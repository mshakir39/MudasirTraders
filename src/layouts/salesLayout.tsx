'use client';
import React, { useState, useMemo, useCallback } from "react";
import DateRangePicker from "@/components/CustomDateRangePicker";
import SalesSummaryCards from "@/components/sales/SalesSummaryCards";
import SalesDataGrid from "@/components/sales/SalesDataGrid";
import ProductsDetailModal from "@/components/sales/ProductDetailModal";

const Dropdown = React.lazy(() => import('@/components/dropdown'));

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
    const uniqueCustomers = Array.from(new Set(
      sales
        .map(sale => sale.customerName)
        .filter(Boolean)
        .filter(name => name.trim() !== '')
    )).sort();

    return [
      { label: 'All Customers', value: '' },
      ...uniqueCustomers.map(customer => ({
        label: customer,
        value: customer
      }))
    ];
  }, [sales]);

  // Filter sales based on selected date range and customer
  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    return sales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const dateMatch = saleDate >= dateRange.start && saleDate <= dateRange.end;
      
      // Customer filter
      const customerMatch = !selectedCustomer || 
        sale.customerName === selectedCustomer;

      return dateMatch && customerMatch;
    });
  }, [sales, dateRange, selectedCustomer]);

  // Calculate summary statistics
  const salesSummary = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Get unique customers from filtered results - Fixed this line
    const uniqueCustomers = Array.from(new Set(
      filteredSales.map(sale => sale.customerName).filter(Boolean)
    )).length;

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
  const handleCustomerSelect = useCallback((option: { label: string; value: string }) => {
    setSelectedCustomer(option.value);
  }, []);

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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        
        {/* Filters Section */}
        <div className="flex items-center gap-4">
          {/* Customer Filter */}
          <div className="min-w-[200px]">
            <Dropdown
              options={customerOptions}
              onSelect={handleCustomerSelect}
              placeholder="Select Customer"
              defaultValue={selectedCustomer}
              className="w-full"
            />
          </div>
          
          {/* Date Range Picker */}
          <DateRangePicker
            onDateChange={handleDateChange}
            initialDateRange={dateRange}
          />
          
          {/* Clear Filters Button */}
          {(selectedCustomer || 
            dateRange.start.getTime() !== getDefaultDateRange().start.getTime() ||
            dateRange.end.getTime() !== getDefaultDateRange().end.getTime()) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Info */}
      {(selectedCustomer || filteredSales.length !== sales.length) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Active Filters: 
                {selectedCustomer && (
                  <span className="ml-1 px-2 py-1 bg-blue-200 rounded-full text-xs">
                    Customer: {selectedCustomer}
                  </span>
                )}
                <span className="ml-1 px-2 py-1 bg-blue-200 rounded-full text-xs">
                  Date: {dateRange.start.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} - {dateRange.end.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </span>
            </div>
            <span className="text-sm text-blue-600">
              {filteredSales.length} of {sales.length} sales
            </span>
          </div>
        </div>
      )}

      {/* Sales Summary Cards */}
      <SalesSummaryCards salesSummary={salesSummary} />

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