import React from 'react';
import DateRangePicker from '@/components/CustomDateRangePicker';

interface DateRange {
  start: Date;
  end: Date;
  isAllTime?: boolean;
}

interface DateRangeControlsProps {
  revenueDateRange: DateRange;
  topProductsDateRange: DateRange;
  salesTrendDateRange: DateRange;
  onRevenueDateChange: (range: DateRange) => void;
  onTopProductsDateChange: (range: DateRange) => void;
  onSalesTrendDateChange: (range: DateRange) => void;
  onSetAllTime?: () => void;
}

export const DateRangeControls: React.FC<DateRangeControlsProps> = ({
  revenueDateRange,
  topProductsDateRange,
  salesTrendDateRange,
  onRevenueDateChange,
  onTopProductsDateChange,
  onSalesTrendDateChange,
  onSetAllTime,
}) => (
  <div className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl  bg-white p-4 shadow-md'>
    <div className='flex flex-wrap items-center gap-4'>
      <h3 className='text-lg font-semibold text-gray-900'>
        Date Range Filters
      </h3>
      {onSetAllTime && (
        <button
          type='button'
          onClick={onSetAllTime}
          className='rounded-md border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100'
        >
          Overall All Time
        </button>
      )}
    </div>
    <div className='flex flex-wrap items-center gap-6'>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>
          Sales & Profit Period:
        </span>
        <DateRangePicker
          onDateChange={onRevenueDateChange}
          initialDateRange={revenueDateRange}
          className='scale-90'
        />
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>Sales Trend:</span>
        <DateRangePicker
          onDateChange={onSalesTrendDateChange}
          initialDateRange={salesTrendDateRange}
          className='scale-90'
        />
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>Top Products:</span>
        <DateRangePicker
          onDateChange={onTopProductsDateChange}
          initialDateRange={topProductsDateRange}
          className='scale-90'
        />
      </div>
    </div>
  </div>
);
