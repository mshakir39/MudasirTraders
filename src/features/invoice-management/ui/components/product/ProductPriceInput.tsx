// src/features/invoice-management/ui/components/product/ProductPriceInput.tsx
// Product price and quantity input component - <40 lines

'use client';

import React from 'react';
import Input from '@/components/customInput';

interface ProductPriceInputProps {
  productPrice: string;
  quantity: string;
  onPriceChange: (price: string) => void;
  onQuantityChange: (quantity: string) => void;
  disabled?: boolean;
}

export const ProductPriceInput: React.FC<ProductPriceInputProps> = ({
  productPrice,
  quantity,
  onPriceChange,
  onQuantityChange,
  disabled = false,
}) => {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <div>
        <Input
          type='number'
          label='Price *'
          value={productPrice}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder='0'
          disabled={disabled}
          parentClass='w-full'
        />
      </div>
      <div>
        <Input
          type='number'
          label='Quantity *'
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          placeholder='1'
          disabled={disabled}
          parentClass='w-full'
        />
      </div>
    </div>
  );
};
