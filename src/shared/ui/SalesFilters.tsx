// src/shared/ui/SalesFilters.tsx
// Sales filters component - <100 lines

import React, { useState } from 'react';
import { FaCalendar, FaFilter, FaTimes } from 'react-icons/fa';
import {
  DateRange,
  CustomerOption,
  SalesFilter,
} from '@/entities/sale/model/types';
import { SaleApi } from '@/entities/sale/api/saleApi';

interface SalesFiltersProps {
  filter: SalesFilter;
  onFilterChange: (filter: SalesFilter) => void;
  customerOptions: CustomerOption[];
  className?: string;
}

export const SalesFilters: React.FC<SalesFiltersProps> = ({
  filter,
  onFilterChange,
  customerOptions,
  className = '',
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCustomerChange = (value: string) => {
    onFilterChange({
      ...filter,
      customer: value,
    });
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    onFilterChange({
      ...filter,
      dateRange: { start, end },
    });
  };

  const handleQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    handleDateRangeChange(start, end);
  };

  const clearFilters = () => {
    const defaultRange = SaleApi.getDefaultDateRange();
    onFilterChange({
      customer: '',
      dateRange: defaultRange,
    });
  };

  const hasActiveFilters =
    filter.customer !== '' ||
    filter.dateRange.start.getTime() !==
      SaleApi.getDefaultDateRange().start.getTime() ||
    filter.dateRange.end.getTime() !==
      SaleApi.getDefaultDateRange().end.getTime();

  return (
    <div
      className={`rounded-lg border border-secondary-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <FaFilter className='text-secondary-500' />
          <h3 className='font-semibold text-secondary-900'>Filters</h3>
        </div>
        <div className='flex items-center gap-2'>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className='text-error-600 hover:text-error-700 flex items-center gap-1 text-sm'
            >
              <FaTimes size={12} />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className='text-sm text-primary-600 hover:text-primary-700'
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Customer Filter */}
      <div className='mb-4'>
        <label className='mb-2 block text-sm font-medium text-secondary-700'>
          Customer
        </label>
        <select
          value={filter.customer}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className='w-full rounded-md border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500'
        >
          {customerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className='mb-4'>
        <label className='mb-2 block text-sm font-medium text-secondary-700'>
          Date Range
        </label>
        <div className='mb-2 flex gap-2'>
          <button
            onClick={() => handleQuickDateRange(7)}
            className='rounded bg-secondary-100 px-3 py-1 text-xs hover:bg-secondary-200'
          >
            Last 7 days
          </button>
          <button
            onClick={() => handleQuickDateRange(30)}
            className='rounded bg-secondary-100 px-3 py-1 text-xs hover:bg-secondary-200'
          >
            Last 30 days
          </button>
          <button
            onClick={() => handleQuickDateRange(90)}
            className='rounded bg-secondary-100 px-3 py-1 text-xs hover:bg-secondary-200'
          >
            Last 90 days
          </button>
        </div>

        {showAdvanced && (
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <label className='mb-1 block text-xs text-secondary-600'>
                Start Date
              </label>
              <input
                type='date'
                value={filter.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => {
                  const start = new Date(e.target.value);
                  start.setHours(0, 0, 0, 0);
                  handleDateRangeChange(start, filter.dateRange.end);
                }}
                className='w-full rounded border border-secondary-300 px-2 py-1 text-sm'
              />
            </div>
            <div>
              <label className='mb-1 block text-xs text-secondary-600'>
                End Date
              </label>
              <input
                type='date'
                value={filter.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => {
                  const end = new Date(e.target.value);
                  end.setHours(23, 59, 59, 999);
                  handleDateRangeChange(filter.dateRange.start, end);
                }}
                className='w-full rounded border border-secondary-300 px-2 py-1 text-sm'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
