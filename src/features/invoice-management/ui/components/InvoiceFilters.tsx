// src/features/invoice-management/ui/components/InvoiceFilters.tsx
// Invoice filters component - <50 lines

'use client';

import React from 'react';
import { InvoiceFilter } from '@/entities/invoice';

interface InvoiceFiltersProps {
  filter: InvoiceFilter;
  onFilterChange: (filter: InvoiceFilter) => void;
  customerOptions: string[];
  paymentMethodOptions: string[];
  className?: string;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  filter,
  onFilterChange,
  customerOptions,
  paymentMethodOptions,
  className = '',
}) => {
  const handleFilterChange = (key: keyof InvoiceFilter, value: any) => {
    onFilterChange({
      ...filter,
      [key]: value,
    });
  };

  return (
    <div className={`${className}`}>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {/* Customer Filter */}
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Customer
          </label>
          <select
            value={filter.customer || ''}
            onChange={(e) => handleFilterChange('customer', e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Customers</option>
            {customerOptions.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Payment Status
          </label>
          <select
            value={filter.paymentStatus || 'all'}
            onChange={(e) =>
              handleFilterChange('paymentStatus', e.target.value)
            }
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>All Status</option>
            <option value='pending'>Pending</option>
            <option value='partial'>Partial</option>
            <option value='paid'>Paid</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Payment Method
          </label>
          <select
            value={filter.paymentMethod || ''}
            onChange={(e) =>
              handleFilterChange('paymentMethod', e.target.value)
            }
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Methods</option>
            {paymentMethodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
