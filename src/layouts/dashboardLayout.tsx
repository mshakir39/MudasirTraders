'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FaWarehouse, FaShoppingCart, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { MdTrendingUp, MdAccountBalanceWallet } from 'react-icons/md';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import DateRangePicker from '@/components/CustomDateRangePicker';

interface DateRange {
  start: Date;
  end: Date;
}

interface StreamlinedDashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit?: number;
  averageOrderValue: number;
  totalPending: number;
  totalCustomers: number;
  topSellingProducts: Array<{
    brandName: string;
    series: string;
    soldCount: number;
    inStock: number;
  }>;
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingPayments: number;
  };
  salesTrend?: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  inventoryByBrand?: Array<{
    brand: string;
    value: number;
    products: number;
  }>;
}

const LoadingSpinner = () => (
  <div className='flex h-full w-full items-center justify-center py-8'>
    <div className='h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-[#4287f5]'></div>
  </div>
);

const DashboardLayout = () => {
  const [stats, setStats] = useState<StreamlinedDashboardStats>({
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageOrderValue: 0,
    totalPending: 0,
    totalCustomers: 0,
    topSellingProducts: [],
    alerts: {
      lowStock: 0,
      outOfStock: 0,
      pendingPayments: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date Ranges
  const [revenueDateRange, setRevenueDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const [topProductsDateRange, setTopProductsDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const [salesTrendDateRange, setSalesTrendDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const initialLoadRef = useRef(false);
  const fetchingRef = useRef(false);

  // Fetch data with date ranges
  const fetchData = async (revenueRange: DateRange, topProductsRange: DateRange, salesTrendRange: DateRange) => {
    if (fetchingRef.current) return;
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('revenueStart', revenueRange.start.toISOString());
      params.append('revenueEnd', revenueRange.end.toISOString());
      params.append('topProductsStart', topProductsRange.start.toISOString());
      params.append('topProductsEnd', topProductsRange.end.toISOString());
      params.append('salesTrendStart', salesTrendRange.start.toISOString());
      params.append('salesTrendEnd', salesTrendRange.end.toISOString());

      const url = `/api/dashboard?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setStats(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard data'
      );
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    fetchData(revenueDateRange, topProductsDateRange, salesTrendDateRange);
  }, []);

  const handleRevenueDateChange = useCallback((range: DateRange) => {
    setRevenueDateRange(range);
    fetchData(range, topProductsDateRange, salesTrendDateRange);
  }, [topProductsDateRange, salesTrendDateRange]);

  const handleTopProductsDateChange = useCallback((range: DateRange) => {
    setTopProductsDateRange(range);
    fetchData(revenueDateRange, range, salesTrendDateRange);
  }, [revenueDateRange, salesTrendDateRange]);

  const handleSalesTrendDateChange = useCallback((range: DateRange) => {
    setSalesTrendDateRange(range);
    fetchData(revenueDateRange, topProductsDateRange, range);
  }, [revenueDateRange, topProductsDateRange]);

  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const end = range.end.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}d (${start} - ${end})`;
  };

  const chartData = {
    salesTrend: stats.salesTrend || [],
    inventoryByBrand: stats.inventoryByBrand || []
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className='p-6'>
        <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
          Error: {error}
        </div>
      </div>
    );
  }

  const hasAlerts = stats.alerts.lowStock > 0 || stats.alerts.outOfStock > 0 || stats.alerts.pendingPayments > 0;

  // Profit Margin
  const profitMargin = stats.totalRevenue > 0 ? ((stats.totalProfit ?? 0) / stats.totalRevenue) * 100 : 0;

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-1'>Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Alerts Banner */}
      {hasAlerts && (
        <div className='mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg'>
          <div className='flex items-center'>
            <FaExclamationTriangle className='text-orange-400 mr-3' />
            <div>
              <h3 className='text-sm font-medium text-orange-800'>Attention Required</h3>
              <div className='text-sm text-orange-700 mt-1'>
                {stats.alerts.lowStock > 0 && <span className='mr-4'>• {stats.alerts.lowStock} items low on stock</span>}
                {stats.alerts.outOfStock > 0 && <span className='mr-4'>• {stats.alerts.outOfStock} items out of stock</span>}
                {stats.alerts.pendingPayments > 0 && <span>• Rs {stats.alerts.pendingPayments.toLocaleString('en-PK')} pending payments</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Controls Section */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200'>
        <div className='flex items-center gap-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Date Range Filters</h3>
        </div>
        <div className='flex flex-wrap items-center gap-6'>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-gray-600'>Sales & Profit Period:</span>
            <DateRangePicker
              onDateChange={handleRevenueDateChange}
              initialDateRange={revenueDateRange}
              className="scale-90"
            />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-gray-600'>Sales Trend:</span>
            <DateRangePicker
              onDateChange={handleSalesTrendDateChange}
              initialDateRange={salesTrendDateRange}
              className="scale-90"
            />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-gray-600'>Top Products:</span>
            <DateRangePicker
              onDateChange={handleTopProductsDateChange}
              initialDateRange={topProductsDateRange}
              className="scale-90"
            />
          </div>
        </div>
      </div>

      {/* Main Stats Grid - 5 Key Metrics */}
      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'>
        {/* Inventory Value */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Inventory Value</p>
              <h3 className='text-2xl font-bold text-gray-900 mt-1'>Rs {stats.totalInventoryValue.toLocaleString('en-PK')}</h3>
              <p className='text-sm text-gray-500 mt-1'>{stats.totalProducts} products</p>
            </div>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <FaWarehouse className='w-6 h-6 text-blue-600' />
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Sales</p>
              <h3 className='text-2xl font-bold text-gray-900 mt-1'>Rs {stats.totalRevenue.toLocaleString('en-PK')}</h3>
              <p className='text-sm text-gray-500 mt-1'>{stats.totalSales} sales • {formatDateRange(revenueDateRange)}</p>
            </div>
            <div className='p-3 bg-green-100 rounded-lg'>
              <MdTrendingUp className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        {/* Profit */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Profit</p>
              <h3 className='text-2xl font-bold text-yellow-700 mt-1'>
                Rs {(stats.totalProfit ?? 0).toLocaleString('en-PK')}
              </h3>
              <p className='text-sm text-gray-500 mt-1'>
                Gross profit for selected period
              </p>
              <p className='text-xs text-yellow-600 mt-1'>
                Profit Margin: {profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className='p-3 bg-yellow-100 rounded-lg'>
              <MdAccountBalanceWallet className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Pending Payments</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.totalPending > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                Rs {stats.totalPending.toLocaleString('en-PK')}
              </h3>
              <p className='text-sm text-gray-500 mt-1'>Outstanding amount</p>
            </div>
            <div className={`p-3 rounded-lg ${stats.totalPending > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <MdAccountBalanceWallet className={`w-6 h-6 ${stats.totalPending > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Customers</p>
              <h3 className='text-2xl font-bold text-gray-900 mt-1'>{stats.totalCustomers}</h3>
              <p className='text-sm text-gray-500 mt-1'>Active customers</p>
            </div>
            <div className='p-3 bg-purple-100 rounded-lg'>
              <FaUsers className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2'>
           {/* Top Selling Products */}
           <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
              <MdTrendingUp className='mr-2 text-green-500' />
              Top Selling Products
            </h3>
          </div>
          <div className='mb-3'>
            <p className='text-sm text-gray-500'>
              Showing sales data for {formatDateRange(topProductsDateRange)}
            </p>
          </div>
          {stats.topSellingProducts.length > 0 ? (
            <div className='space-y-3'>
              {stats.topSellingProducts.map((product, index) => (
                <div key={`${product.brandName}-${product.series}-${index}`} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-medium text-blue-600'>#{index + 1}</span>
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {product.brandName || 'No Brand'} {product.series}
                      </p>
                      <p className='text-sm text-gray-500'>{product.inStock} in stock</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium text-green-600'>{product.soldCount} sold</p>
                    <p className='text-sm text-gray-500'>
                      {product.inStock > 0 ? 'Available' : 'Out of stock'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <FaShoppingCart className='w-12 h-12 mx-auto mb-2 text-gray-300' />
              <p>No sales data available for selected date range</p>
              <p className='text-sm mt-1'>Try selecting a different time period</p>
            </div>
          )}
        </div>
        {/* Sales Trend Chart */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Sales Trend</h3>
            <div className='text-sm text-gray-500'>
              {formatDateRange(salesTrendDateRange)}
            </div>
          </div>
          {chartData.salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `Rs ${Number(value).toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Sales Count'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales Count" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-[300px] text-gray-500'>
              <div className='text-center'>
                <FaShoppingCart className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>No sales data available for selected period</p>
                <p className='text-sm mt-1'>Try selecting a different date range</p>
              </div>
            </div>
          )}
        </div>

      
      </div>

      {/* Inventory by Brand Chart and Top Selling Products */}
      <div className='mb-8 '>
        {/* Inventory by Brand Chart */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Inventory Value by Brand</h3>
          {chartData.inventoryByBrand.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.inventoryByBrand}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'value' ? `Rs ${Number(value).toLocaleString()}` : value,
                    name === 'value' ? 'Inventory Value' : 'Product Count'
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" name="Inventory Value" />
                <Bar dataKey="products" fill="#00C49F" name="Product Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-[300px] text-gray-500'>
              <div className='text-center'>
                <FaWarehouse className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>No inventory data available</p>
              </div>
            </div>
          )}
        </div>

     
      </div>
    </div>
  );
};

export default DashboardLayout;
