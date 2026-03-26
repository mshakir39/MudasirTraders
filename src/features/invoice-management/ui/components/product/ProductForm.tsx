// src/features/invoice-management/ui/components/product/ProductForm.tsx
// Product form component - <80 lines

'use client';

import React from 'react';
import Dropdown from '@/components/dropdown';
import SeriesAutocomplete from '@/components/SeriesAutocomplete';
import Input from '@/components/customInput';
import { Toggle } from '@/components/toggle';

interface ProductFormProps {
  accordionDataItem: any;
  categories: any[];
  brandOptions: any[];
  stock: any[];
  onChange: (field: string, value: any) => void;
  onWarrantyToggle: (checked: boolean) => void;
  showWarrantyFields: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  accordionDataItem,
  categories,
  brandOptions,
  stock,
  onChange,
  onWarrantyToggle,
  showWarrantyFields,
}) => {
  const selectedBrandOption = brandOptions.find(
    (option) => option.value === (accordionDataItem.brandName || '')
  );

  return (
    <div className='space-y-4'>
      {/* Brand Selection */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Brand
        </label>
        <Dropdown
          options={brandOptions}
          value={selectedBrandOption || null}
          onSelect={(option) => onChange('brandName', option.value)}
          placeholder='Select Brand'
        />
      </div>

      {/* Series Selection */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Series
        </label>
        <SeriesAutocomplete
          series={stock.filter(
            (item) => item.brandName === accordionDataItem.brandName
          )}
          value={accordionDataItem.series || ''}
          onChange={(value) => onChange('series', value)}
        />
      </div>

      {/* Quantity and Price */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Quantity
          </label>
          <Input
            type='number'
            value={accordionDataItem.quantity || ''}
            onChange={(e) => onChange('quantity', e.target.value)}
            placeholder='Enter quantity'
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Price
          </label>
          <Input
            type='number'
            value={accordionDataItem.productPrice || ''}
            onChange={(e) => onChange('productPrice', e.target.value)}
            placeholder='Enter price'
          />
        </div>
      </div>

      {/* Warranty Toggle */}
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium text-gray-700'>Warranty</label>
        <Toggle
          checked={!accordionDataItem.noWarranty}
          onChange={onWarrantyToggle}
        />
      </div>

      {/* Warranty Fields */}
      {showWarrantyFields && (
        <div className='space-y-3 border-t pt-3'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Warranty Code
            </label>
            <Input
              value={accordionDataItem.warrentyCode || ''}
              onChange={(e) => onChange('warrentyCode', e.target.value)}
              placeholder='Enter warranty code'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Start Date
              </label>
              <Input
                type='date'
                value={accordionDataItem.warrentyStartDate || ''}
                onChange={(e) => onChange('warrentyStartDate', e.target.value)}
              />
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Duration (months)
              </label>
              <Input
                type='number'
                value={accordionDataItem.warrentyDuration || ''}
                onChange={(e) => onChange('warrentyDuration', e.target.value)}
                placeholder='Duration in months'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
