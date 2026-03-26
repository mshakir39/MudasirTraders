// src/features/invoice-management/ui/components/product/ProductWarrantyFields.tsx
// Product warranty fields component - <80 lines (includes all original functionality)

'use client';

import React from 'react';
import Input from '@/components/customInput';

interface ProductWarrantyFieldsProps {
  warrentyStartDate: string;
  warrentyDuration: string;
  warrentyCode: string;
  onStartDateChange: (date: string) => void;
  onDurationChange: (duration: string) => void;
  onCodeChange: (code: string) => void;
  disabled?: boolean;
  accordionIndex?: number;
  accordionMethods?: any;
  series?: string;
}

export const ProductWarrantyFields: React.FC<ProductWarrantyFieldsProps> = ({
  warrentyStartDate,
  warrentyDuration,
  warrentyCode,
  onStartDateChange,
  onDurationChange,
  onCodeChange,
  disabled = false,
  accordionIndex,
  accordionMethods,
  series,
}) => {
  // Check if it's battery tonic (from original logic)
  const isBatteryTonic = React.useMemo(() => {
    const currentSeries = series || '';
    return (
      currentSeries &&
      (currentSeries.toLowerCase().includes('tonic') ||
        currentSeries.toLowerCase().includes('ml') ||
        (currentSeries.toLowerCase().includes('battery') &&
          currentSeries.toLowerCase().includes('water')) ||
        currentSeries.toLowerCase().includes('distilled'))
    );
  }, [series]);

  // Handle warranty duration change with validation (from original logic)
  const handleDurationChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Ensure value is not negative and not greater than 120, allow 0 for no warranty
      const numValue = parseInt(value);
      if (value === '' || (numValue >= 0 && numValue <= 120)) {
        if (accordionMethods && accordionIndex !== undefined) {
          accordionMethods.handleAccordionChange(
            accordionIndex,
            'warrentyDuration',
            value
          );
        }
        onDurationChange(value);
      }
    },
    [accordionMethods, accordionIndex, onDurationChange]
  );

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='w-full'>
          <Input
            parentClass='w-full'
            type='date'
            label='Warranty Start Date'
            name='warrentyStartDate'
            value={warrentyStartDate}
            onChange={(e) => {
              if (accordionMethods && accordionIndex !== undefined) {
                accordionMethods.handleAccordionChange(
                  accordionIndex,
                  'warrentyStartDate',
                  e.target.value
                );
              }
              onStartDateChange(e.target.value);
            }}
            disabled={disabled}
          />
        </div>
        <div className='w-full'>
          <Input
            parentClass='w-full'
            type='number'
            label='Warranty Duration'
            name='warrentyDuration'
            min={0}
            max={120}
            placeholder='0-120 (0 for no warranty)'
            value={warrentyDuration || ''}
            onChange={handleDurationChange}
            disabled={disabled}
          />
        </div>
      </div>

      <div className='w-full'>
        <Input
          parentClass='w-full'
          type='text'
          label='Warranty Code'
          name='warrentyCode'
          placeholder='Enter warranty code(s) - multiple codes separated by comma or space'
          value={warrentyCode}
          onChange={(e) => {
            if (accordionMethods && accordionIndex !== undefined) {
              accordionMethods.handleAccordionChange(
                accordionIndex,
                'warrentyCode',
                e.target.value
              );
            }
            onCodeChange(e.target.value);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
