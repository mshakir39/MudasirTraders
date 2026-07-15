'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import {
  Sale,
  DateRange,
  CustomerOption,
  SalesSummary,
  SalesPaginationMeta,
} from '@/features/sales-management/entities/sales/model/types';
import { useSalesInfiniteScroll } from '@/features/sales-management/lib/useSalesInfiniteScroll';
import { useSalesActions } from '@/features/sales-management/lib/useSalesActions';
import { SalesDataGrid } from '@/features/sales-management/shared/ui/components/SalesDataGrid';
import ProductsDetailModal from '@/features/sales-management/shared/ui/components/ProductDetailModal';
import { getDefaultSalesDateRange } from '@/lib/salesQuery';

interface SalesManagementProps {
  initialSales: Sale[];
  initialPagination?: SalesPaginationMeta;
  initialSummary: SalesSummary;
  customerNames: string[];
  className?: string;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({
  initialSales,
  initialPagination,
  initialSummary,
  customerNames,
  className = '',
}) => {
  unstable_noStore();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSaleProducts, setSelectedSaleProducts] = useState<
    Sale['products']
  >([]);
  const [selectedSaleInfo, setSelectedSaleInfo] = useState<Sale | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [dateRange] = useState<DateRange>(getDefaultSalesDateRange());

  const {
    sales,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    refetch,
  } = useSalesInfiniteScroll({
    initialSales,
    initialPagination,
    initialSummary,
    dateRange,
    customerName: selectedCustomer,
  });

  const safeCustomerNames = Array.isArray(customerNames) ? customerNames : [];

  const customerOptions = useMemo<CustomerOption[]>(() => {
    return [
      { label: 'All Customers', value: '' },
      ...safeCustomerNames.map((customer) => ({
        label: customer,
        value: customer,
      })),
    ];
  }, [safeCustomerNames]);

  const { deleteSale } = useSalesActions({ sales, onRefreshSales: refetch });

  const handleCustomerChange = useCallback((value: string) => {
    setSelectedCustomer(value);
  }, []);

  const handleViewProducts = useCallback((sale: Sale) => {
    setSelectedSaleProducts(sale.products || []);
    setSelectedSaleInfo(sale);
    setIsProductModalOpen(true);
  }, []);

  const handleDeleteSale = useCallback(
    async (saleId: string) => {
      if (!confirm('Are you sure you want to delete this sale?')) return;

      try {
        await deleteSale(saleId);
        await refetch();
      } catch {
        await refetch();
      }
    },
    [deleteSale, refetch]
  );

  const handleCloseProductsModal = useCallback(() => {
    setIsProductModalOpen(false);
    setSelectedSaleProducts([]);
    setSelectedSaleInfo(null);
  }, []);

  const handleExportSales = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/sales?all=true');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch sales data');
      }

      const allSales = result.data ?? [];

      if (!allSales.length) {
        toast.warning('No sales data found to export');
        return;
      }

      const salesData = allSales.map((sale: any) => {
        const products = sale.products || [];
        const productDetails = products
          .map(
            (product: any) =>
              `${product.brandName} ${product.series} × ${product.quantity} (Rs ${product.totalPrice}) [Warranty: ${product.warrentyCode || 'N/A'}]`
          )
          .join(' | ');

        const product1 = products[0] || {};
        const product2 = products[1] || {};
        const product3 = products[2] || {};

        return {
          'Invoice ID': sale.invoiceId || '',
          Date: new Date(sale.date).toLocaleString('en-GB'),
          Customer: sale.customerName || '',
          'Total Amount': sale.totalAmount || 0,
          'Payment Method': sale.paymentMethod || 'Not specified',
          'Product Count': products.length,
          'Products Summary': productDetails,
          'P1 Brand': product1.brandName || '',
          'P1 Series': product1.series || '',
          'P1 Quantity': product1.quantity || 0,
          'P1 Unit Price': product1.productPrice || 0,
          'P1 Total Price': product1.totalPrice || 0,
          'P1 Warranty Code': product1.warrentyCode || '',
          'P1 Warranty Start': product1.warrentyStartDate || '',
          'P1 Warranty End': product1.warrentyEndDate || '',
          'P2 Brand': product2.brandName || '',
          'P2 Series': product2.series || '',
          'P2 Quantity': product2.quantity || 0,
          'P2 Unit Price': product2.productPrice || 0,
          'P2 Total Price': product2.totalPrice || 0,
          'P2 Warranty Code': product2.warrentyCode || '',
          'P2 Warranty Start': product2.warrentyStartDate || '',
          'P2 Warranty End': product2.warrentyEndDate || '',
          'P3 Brand': product3.brandName || '',
          'P3 Series': product3.series || '',
          'P3 Quantity': product3.quantity || 0,
          'P3 Unit Price': product3.productPrice || 0,
          'P3 Total Price': product3.totalPrice || 0,
          'P3 Warranty Code': product3.warrentyCode || '',
          'P3 Warranty Start': product3.warrentyStartDate || '',
          'P3 Warranty End': product3.warrentyEndDate || '',
          'Created At': sale.createdAt
            ? new Date(sale.createdAt).toLocaleString('en-GB')
            : '',
          'Updated At': sale.updatedAt
            ? new Date(sale.updatedAt).toLocaleString('en-GB')
            : '',
          Notes: sale.notes || '',
        };
      });

      const headers = Object.keys(salesData[0] || {});
      const csvContent = [
        headers.join(','),
        ...salesData.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              if (value === null || value === undefined) return '';
              if (typeof value === 'number') return value.toString();
              if (typeof value === 'boolean') return value ? 'Yes' : 'No';
              if (typeof value === 'object') return JSON.stringify(value);

              const stringValue = value.toString();
              if (
                stringValue.includes(',') ||
                stringValue.includes('"') ||
                stringValue.includes('\n')
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `all-sales-export-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${allSales.length} sales records`);
    } catch (error) {
      toast.error('Failed to export sales data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <label className='flex items-center gap-2 text-sm text-secondary-700'>
          Customer
          <select
            value={selectedCustomer}
            disabled={loading}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className='min-w-[200px] rounded border border-secondary-300 px-2 py-1 text-sm'
          >
            {customerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleExportSales}
          disabled={isExporting || loading}
          className='flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400'
          title='Export all sales data to CSV'
        >
          Export All Sales Data
        </button>
      </div>

      <SalesDataGrid
        filteredSales={sales}
        onViewProducts={handleViewProducts}
        onDeleteSale={handleDeleteSale}
        isLoading={loading && sales.length === 0}
        onNearBottom={loadMore}
      />
      {(loadingMore || (loading && sales.length > 0)) && (
        <p className='py-2 text-center text-sm text-secondary-500'>
          Loading more...
        </p>
      )}
      {!hasMore && sales.length > 0 && !loadingMore && (
        <p className='py-2 text-center text-sm text-secondary-400'>
          All sales loaded
        </p>
      )}

      <ProductsDetailModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductsModal}
        selectedSaleInfo={selectedSaleInfo}
        selectedSaleProducts={selectedSaleProducts}
      />
    </div>
  );
};
