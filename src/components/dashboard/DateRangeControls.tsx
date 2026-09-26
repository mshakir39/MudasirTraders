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
  revenueLoading?: boolean;
  topProductsLoading?: boolean;
  salesTrendLoading?: boolean;
  isAllTimeLoading?: boolean;
}

export const DateRangeControls: React.FC<DateRangeControlsProps> = ({
  revenueDateRange,
  topProductsDateRange,
  salesTrendDateRange,
  onRevenueDateChange,
  onTopProductsDateChange,
  onSalesTrendDateChange,
  onSetAllTime,
  revenueLoading = false,
  topProductsLoading = false,
  salesTrendLoading = false,
  isAllTimeLoading = false,
}) => (
  <div className='relative z-30 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-md'>
    <div className='flex flex-wrap items-center gap-4'>
      <h3 className='text-lg font-semibold text-gray-900'>
        Date Range Filters
      </h3>
      {onSetAllTime && (
        <button
          type='button'
          onClick={onSetAllTime}
          disabled={isAllTimeLoading}
          className='flex items-center gap-2 rounded-md border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-60'
        >
          <span>Overall All Time</span>
          {isAllTimeLoading && (
            <span className='inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent' />
          )}
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
          isLoading={revenueLoading}
        />
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>Sales Trend:</span>
        <DateRangePicker
          onDateChange={onSalesTrendDateChange}
          initialDateRange={salesTrendDateRange}
          isLoading={salesTrendLoading}
        />
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>Top Products:</span>
        <DateRangePicker
          onDateChange={onTopProductsDateChange}
          initialDateRange={topProductsDateRange}
          align='right'
          isLoading={topProductsLoading}
        />
      </div>
    </div>
  </div>
);
