// src/features/invoice-management/ui/components/product/ProductWarrantyToggle.tsx
// Product warranty toggle component - <40 lines

'use client';

import React from 'react';
import { Toggle } from '@/components/toggle';

interface ProductWarrantyToggleProps {
  noWarranty: boolean;
  onWarrantyChange: (noWarranty: boolean) => void;
  disabled?: boolean;
}

export const ProductWarrantyToggle: React.FC<ProductWarrantyToggleProps> = ({
  noWarranty,
  onWarrantyChange,
  disabled = false,
}) => {
  return (
    <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
      <div className='flex items-center gap-4'>
        <div className='flex flex-col'>
          <label className='text-sm font-semibold text-gray-800'>
            No Warranty
          </label>
          <p className='mt-1 text-xs text-gray-600'>
            {noWarranty
              ? 'This product has no warranty coverage'
              : 'Enable if this product has no warranty'}
          </p>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = !noWarranty;
            onWarrantyChange(newValue);
          }}
          className='cursor-pointer'
        >
          <Toggle
            checked={!!noWarranty}
            onChange={(noWarranty: boolean) => onWarrantyChange(noWarranty)}
            label={noWarranty ? 'No Warranty' : 'Has Warranty'}
            size='sm'
            color='red'
            labelPosition='bottom'
          />
        </div>
      </div>
    </div>
  );
};
