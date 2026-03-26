// src/features/sales-management/ui/SalesManagement.tsx
// Main sales management component

'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useOptimistic,
  useActionState,
} from 'react';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import {
  Sale,
  SalesFilters,
  DateRange,
  CustomerOption,
} from '@/features/sales-management/entities/sales/model/types';
import { useSalesActions } from '@/features/sales-management/lib/useSalesActions';
import { SalesDataGrid } from '@/features/sales-management/shared/ui/components/SalesDataGrid';
import ProductsDetailModal from '@/features/sales-management/shared/ui/components/ProductDetailModal';

interface SalesManagementProps {
  initialSales: Sale[];
  className?: string;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({
  initialSales,
  className = '',
}) => {
  unstable_noStore();

  // Modal state for products
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSaleProducts, setSelectedSaleProducts] = useState<
    Sale['products']
  >([]);
  const [selectedSaleInfo, setSelectedSaleInfo] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [sales, setSales] = useState<Sale[]>(initialSales);

  // Initialize with last 30 days as default
  const getDefaultDateRange = useCallback((): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, []);

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  // React 19: Optimistic updates for sales operations
  const [optimisticSales, addOptimisticSale] = useOptimistic(
    sales,
    (state, newSale: any) => {
      if (newSale.action === 'delete') {
        return state.filter((sale) => sale.id !== newSale.id);
      }
      return [newSale, ...state];
    }
  );

  // React 19: useActionState for filter operations
  const [filterState, filterAction, isFilterPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const customer = formData.get('customer') as string;
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;

      try {
        // Simulate API call for filtering
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
          customer: customer || '',
          dateRange: {
            start: startDate
              ? new Date(startDate)
              : getDefaultDateRange().start,
            end: endDate ? new Date(endDate) : getDefaultDateRange().end,
          },
        };
      } catch (error) {
        toast.error('Failed to apply filters');
        return prevState;
      }
    },
    { customer: '', dateRange: getDefaultDateRange() }
  );

  // React 19: Sync with filter state when it changes
  React.useEffect(() => {
    if (filterState.customer !== selectedCustomer) {
      setSelectedCustomer(filterState.customer);
    }
    if (filterState.dateRange) {
      setDateRange(filterState.dateRange);
    }
  }, [filterState, selectedCustomer]);

  // Get unique customers for dropdown - React 19: Enhanced with memoization
  const customerOptions = useMemo(() => {
    if (!optimisticSales || optimisticSales.length === 0) {
      return [{ label: 'All Customers', value: '' }];
    }

    const uniqueCustomers = Array.from(
      new Set(
        optimisticSales // Use optimistic sales instead of original sales
          .map((sale) => sale.customerName)
          .filter(Boolean)
          .filter((name) => name.trim() !== '')
      )
    ).sort();

    return [
      { label: 'All Customers', value: '' },
      ...uniqueCustomers.map((customer) => ({
        label: customer,
        value: customer,
      })),
    ];
  }, [optimisticSales]); // Dependency on optimistic sales

  // Filter sales based on selected date range and customer - React 19: Use optimistic data
  const filteredSales = useMemo(() => {
    if (!optimisticSales || optimisticSales.length === 0) return [];

    return optimisticSales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const dateMatch =
        saleDate >= dateRange.start && saleDate <= dateRange.end;

      // Customer filter
      const customerMatch =
        !selectedCustomer || sale.customerName === selectedCustomer;

      return dateMatch && customerMatch;
    });
  }, [optimisticSales, dateRange, selectedCustomer]);

  // Calculate summary statistics
  const salesSummary = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get unique customers from filtered results - Fixed this line
    const uniqueCustomers = Array.from(
      new Set(filteredSales.map((sale) => sale.customerName).filter(Boolean))
    ).length;

    return {
      totalSales,
      totalRevenue,
      avgSaleValue,
      uniqueCustomers,
    };
  }, [filteredSales]);

  const { deleteSale } = useSalesActions({
    sales,
    onSalesChange: setSales,
  });

  // Handle date range change
  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  // Handle customer selection
  const handleCustomerSelect = useCallback((option: CustomerOption) => {
    setSelectedCustomer(option.value);
  }, []);

  // Handle viewing products - React 19: Enhanced with error boundary
  const handleViewProducts = useCallback((sale: Sale) => {
    try {
      setSelectedSaleProducts(sale.products || []);
      setSelectedSaleInfo(sale);
      setIsProductModalOpen(true);
    } catch (error) {
      toast.error('Failed to load sale details');
      console.error('Error viewing products:', error);
    }
  }, []);

  // React 19: Optimistic delete function
  const handleDeleteSale = useCallback(
    async (saleId: string) => {
      if (!confirm('Are you sure you want to delete this sale?')) return;

      try {
        // Add optimistic update
        addOptimisticSale({ id: saleId, action: 'delete' });

        const response = await fetch('/api/sales', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: saleId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete sale');
        }

        toast.success('Sale deleted successfully');
      } catch (error) {
        toast.error('Failed to delete sale');
        // Refresh data to revert optimistic update
        window.location.reload();
      }
    },
    [addOptimisticSale]
  );

  // Handle closing products modal
  const handleCloseProductsModal = useCallback(() => {
    setIsProductModalOpen(false);
    setSelectedSaleProducts([]);
    setSelectedSaleInfo(null);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedCustomer('');
    setDateRange(getDefaultDateRange());
  }, [getDefaultDateRange]);

  // Export sales data to CSV
  const handleExportSales = useCallback(async () => {
    try {
      // Fetch ALL sales from database, not just filtered ones
      const response = await fetch('/api/sales');
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const allSales = await response.json();

      if (!allSales || allSales.length === 0) {
        toast.warning('No sales data found to export');
        return;
      }

      const salesData = allSales.map((sale: any) => {
        // Flatten products for CSV export - include all product details
        const products = sale.products || [];
        const productDetails = products
          .map(
            (product: any) =>
              `${product.brandName} ${product.series} × ${product.quantity} (Rs ${product.totalPrice}) [Warranty: ${product.warrentyCode || 'N/A'}]`
          )
          .join(' | ');

        // Extract individual product details for separate columns
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
          // Product 1 Details
          'P1 Brand': product1.brandName || '',
          'P1 Series': product1.series || '',
          'P1 Quantity': product1.quantity || 0,
          'P1 Unit Price': product1.productPrice || 0,
          'P1 Total Price': product1.totalPrice || 0,
          'P1 Warranty Code': product1.warrentyCode || '',
          'P1 Warranty Start': product1.warrentyStartDate || '',
          'P1 Warranty End': product1.warrentyEndDate || '',
          // Product 2 Details (if exists)
          'P2 Brand': product2.brandName || '',
          'P2 Series': product2.series || '',
          'P2 Quantity': product2.quantity || 0,
          'P2 Unit Price': product2.productPrice || 0,
          'P2 Total Price': product2.totalPrice || 0,
          'P2 Warranty Code': product2.warrentyCode || '',
          'P2 Warranty Start': product2.warrentyStartDate || '',
          'P2 Warranty End': product2.warrentyEndDate || '',
          // Product 3 Details (if exists)
          'P3 Brand': product3.brandName || '',
          'P3 Series': product3.series || '',
          'P3 Quantity': product3.quantity || 0,
          'P3 Unit Price': product3.productPrice || 0,
          'P3 Total Price': product3.totalPrice || 0,
          'P3 Warranty Code': product3.warrentyCode || '',
          'P3 Warranty Start': product3.warrentyStartDate || '',
          'P3 Warranty End': product3.warrentyEndDate || '',
          // Additional sale metadata
          'Created At': sale.createdAt
            ? new Date(sale.createdAt).toLocaleString('en-GB')
            : '',
          'Updated At': sale.updatedAt
            ? new Date(sale.updatedAt).toLocaleString('en-GB')
            : '',
          Notes: sale.notes || '',
        };
      });

      // Convert to CSV with proper escaping
      const headers = Object.keys(salesData[0] || {});
      const csvContent = [
        headers.join(','),
        ...salesData.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              // Handle different data types and escape properly
              if (value === null || value === undefined) return '';
              if (typeof value === 'number') return value.toString();
              if (typeof value === 'boolean') return value ? 'Yes' : 'No';
              if (typeof value === 'object') return JSON.stringify(value);

              // Escape quotes and wrap in quotes if contains comma, quote, or newline
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

      // Create and download file
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

      toast.success(
        `Exported ALL ${allSales.length} sales records with ${headers.length} data fields`
      );
    } catch (error) {
      toast.error('Failed to export sales data');
      console.error('Export error:', error);
    }
  }, []);

  return (
    <div className={`p-0 py-6 md:p-6 ${className}`}>
      {/* Export Button */}
      <div className='mb-4 flex justify-end'>
        <button
          onClick={handleExportSales}
          disabled={isLoading}
          className='flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400'
          title='Export ALL sales data to CSV'
        >
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
          Export All Sales Data
        </button>
      </div>

      {/* Sales Data Grid */}
      <SalesDataGrid
        filteredSales={filteredSales}
        onViewProducts={handleViewProducts}
        onDeleteSale={handleDeleteSale}
        isLoading={isLoading}
      />

      {/* Products Detail Modal */}
      <ProductsDetailModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductsModal}
        selectedSaleInfo={selectedSaleInfo}
        selectedSaleProducts={selectedSaleProducts}
      />
    </div>
  );
};
