'use client';
import React, { useState, useMemo, useCallback } from 'react';
import DateRangePicker from '@/components/CustomDateRangePicker';
import SalesSummaryCards from '@/components/sales/SalesSummaryCards';
import SalesDataGrid from '@/components/sales/SalesDataGrid';
import ProductsDetailModal from '@/components/sales/ProductDetailModal';
import Dropdown from '@/components/dropdown';

interface DateRange {
  start: Date;
  end: Date;
}

const SalesLayout = ({ sales }: { sales: any[] }) => {
  // Modal state for products
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSaleProducts, setSelectedSaleProducts] = useState<any[]>([]);
  const [selectedSaleInfo, setSelectedSaleInfo] = useState<any>(null);

  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

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

  // Get unique customers for dropdown
  const customerOptions = useMemo(() => {
    const uniqueCustomers = Array.from(
      new Set(
        sales
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
  }, [sales]);

  // Filter sales based on selected date range and customer
  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    return sales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const dateMatch =
        saleDate >= dateRange.start && saleDate <= dateRange.end;

      // Customer filter
      const customerMatch =
        !selectedCustomer || sale.customerName === selectedCustomer;

      return dateMatch && customerMatch;
    });
  }, [sales, dateRange, selectedCustomer]);

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

  // Handle date range change
  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  // Handle customer selection
  const handleCustomerSelect = useCallback(
    (option: { label: string; value: string }) => {
      setSelectedCustomer(option.value);
    },
    []
  );

  // Handle viewing products
  const handleViewProducts = useCallback((sale: any) => {
    setSelectedSaleProducts(sale.products || []);
    setSelectedSaleInfo(sale);
    setIsProductModalOpen(true);
  }, []);

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

  return (
    <div className='p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Sales</h1>
      </div>

      {/* Sales Data Grid */}
      <SalesDataGrid
        filteredSales={filteredSales}
        onViewProducts={handleViewProducts}
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

export default SalesLayout;
