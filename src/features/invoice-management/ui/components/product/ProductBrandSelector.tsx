// src/features/invoice-management/ui/components/product/ProductBrandSelector.tsx
// Product brand selector component - <30 lines

'use client';

import React from 'react';
import Dropdown from '@/components/dropdown';

interface ProductBrandSelectorProps {
  brandName: string;
  onBrandChange: (brand: string) => void;
  brandOptions: any[];
  disabled?: boolean;
}

export const ProductBrandSelector: React.FC<ProductBrandSelectorProps> = ({
  brandName,
  onBrandChange,
  brandOptions,
  disabled = false,
}) => {
  // Check if brandOptions is empty or malformed
  if (!brandOptions || brandOptions.length === 0) {
    return (
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Brand *
        </label>
        <div className='w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500'>
          No brands available
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className='mb-1 block text-sm font-medium text-gray-700'>
        Brand *
      </label>
      <Dropdown
        options={brandOptions}
        value={brandOptions.find((option) => option.value === brandName)}
        defaultValue={brandName}
        onSelect={(option) => {
          onBrandChange(option.value);
        }}
        placeholder='Select Brand'
        disabled={disabled}
        className='w-full'
      />
    </div>
  );
};
