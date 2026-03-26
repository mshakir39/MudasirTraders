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

export const TopSellingProducts: React.FC<TopSellingProductsProps> = ({
  products,
  dateRange,
}) => {
  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}d (${start} - ${end})`;
  };

  return (
    <div className='rounded-xl  bg-white p-6 shadow-md h-full flex flex-col'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center text-lg font-semibold text-secondary-900'>
          <MdTrendingUp className='mr-2 text-primary-600' />
          Top Selling Products
        </h3>
      </div>
      <div className='mb-3'>
        <p className='text-sm text-secondary-500'>
          Showing sales data for {formatDateRange(dateRange)}
        </p>
      </div>
      {products.length > 0 ? (
        <div className='space-y-3'>
          {products.map((product, index) => (
            <div
              key={`${product.brandName}-${product.series}-${index}`}
              className='flex items-center justify-between rounded-lg bg-secondary-50 p-3'
            >
              <div className='flex items-center space-x-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary-50'>
                  <span className='text-sm font-medium' style={{ color: '#2563eb' }}>
                    #{index + 1}
                  </span>
                </div>
                <div>
                  <p className='font-medium text-secondary-900'>
                    {product.brandName || 'No Brand'} {product.series}
                  </p>
                  <p className='text-sm text-secondary-500'>
                    {product.inStock} in stock
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='font-medium' style={{ color: '#4287f5' }}>
                  {product.soldCount} sold
                </p>
                <p className='text-sm text-secondary-500'>
                  {product.inStock > 0 ? 'Available' : 'Out of stock'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex-1 py-8 text-center text-secondary-500 flex flex-col justify-center'>
          <FaShoppingCart className='mx-auto mb-2 h-12 w-12 text-secondary-300' />
          <p>No sales data available for selected date range</p>
          <p className='mt-1 text-sm'>Try selecting a different time period</p>
        </div>
      )}
    </div>
  );
};
