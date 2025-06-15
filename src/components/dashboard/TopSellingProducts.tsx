import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { MdTrendingUp } from 'react-icons/md';

interface DateRange {
  start: Date;
  end: Date;
}

interface TopSellingProductsProps {
  products: Array<{
    brandName: string;
    series: string;
    soldCount: number;
    inStock: number;
  }>;
  dateRange: DateRange;
}

export const TopSellingProducts: React.FC<TopSellingProductsProps> = ({ products, dateRange }) => {
  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const end = range.end.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}d (${start} - ${end})`;
  };

  return (
    <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
          <MdTrendingUp className='mr-2 text-green-500' />
          Top Selling Products
        </h3>
      </div>
      <div className='mb-3'>
        <p className='text-sm text-gray-500'>
          Showing sales data for {formatDateRange(dateRange)}
        </p>
      </div>
      {products.length > 0 ? (
        <div className='space-y-3'>
          {products.map((product, index) => (
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
  );
};