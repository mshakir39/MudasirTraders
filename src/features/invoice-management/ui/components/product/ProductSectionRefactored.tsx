// src/features/invoice-management/ui/components/product/ProductSectionRefactored.tsx
// Refactored product section using FSD architecture - <80 lines

'use client';

import React from 'react';
import Accordion from '@/components/accordion';
import { useProductCalculations } from '../../../lib/product/useProductCalculations';
import { useProductFilters } from '../../../lib/product/useProductFilters';
import { useProductValidation } from '../../../lib/product/useProductValidation';
import { ProductBrandSelector } from './ProductBrandSelector';
import { ProductSeriesSelector } from './ProductSeriesSelector';
import { ProductPriceInput } from './ProductPriceInput';

import { ProductWarrantyFields } from './ProductWarrantyFields';
import { ProductBatteryDetails } from './ProductBatteryDetails';
import { ProductWarrantyToggle } from './ProductWarrantyToggle';

interface ProductSectionRefactoredProps {
  accordionData: any;
  categories: any[];
  brandOptions: any[];
  expandedAccordionIndex: number;
  onAccordionClick: (index: number) => void;
  accordionMethods: any;
  stock: any[];
}

const ProductSectionRefactored: React.FC<ProductSectionRefactoredProps> = ({
  accordionData,
  categories,
  brandOptions,
  expandedAccordionIndex,
  onAccordionClick,
  accordionMethods,
  stock,
}) => {
  const { calculateTotalPrice, calculateWarrantyEndDate, formatPrice } =
    useProductCalculations();
  const { getFilteredSeriesOptions, isProductInStock } = useProductFilters();
  const { validateProductData } = useProductValidation();

  const renderAccordionContent = (accordionIndex: number) => {
    const accordionDataItem = accordionData[accordionIndex];
    if (!accordionDataItem) return null;

    // Get filtered series options
    const seriesOptions = getFilteredSeriesOptions(
      accordionDataItem.brandName,
      stock,
      accordionDataItem.seriesOption || []
    );

    // Handle field changes
    const handleFieldChange = (field: string, value: any) => {
      accordionMethods.handleAccordionChange(accordionIndex, field, value);
    };

    const handleSeriesChange = (series: string, seriesData: any) => {
      handleFieldChange('series', series);
      handleFieldChange('seriesOption', seriesData);
    };

    return (
      <div className='space-y-4'>
        {/* Brand and Series Selection */}
        <div className='grid grid-cols-2 gap-4'>
          <ProductBrandSelector
            brandName={accordionDataItem.brandName}
            onBrandChange={(brand) => handleFieldChange('brandName', brand)}
            brandOptions={brandOptions}
          />
          <ProductSeriesSelector
            series={accordionDataItem.series}
            onSeriesChange={handleSeriesChange}
            seriesOptions={seriesOptions}
            selectedBrand={accordionDataItem.brandName}
            categories={categories}
            stock={stock}
          />
        </div>

        {/* Price and Quantity */}
        <ProductPriceInput
          productPrice={accordionDataItem.productPrice}
          quantity={accordionDataItem.quantity}
          onPriceChange={(price) => handleFieldChange('productPrice', price)}
          onQuantityChange={(quantity) =>
            handleFieldChange('quantity', quantity)
          }
        />

        {/* Warranty Toggle */}
        <ProductWarrantyToggle
          noWarranty={accordionDataItem.noWarranty}
          onWarrantyChange={(noWarranty: boolean) =>
            handleFieldChange('noWarranty', noWarranty)
          }
        />

        {/* Warranty Fields (only if not no warranty and not battery tonic) */}
        {!accordionDataItem.noWarranty &&
          (() => {
            const currentSeries = accordionDataItem.series || '';
            const isBatteryTonic =
              currentSeries &&
              (currentSeries.toLowerCase().includes('tonic') ||
                currentSeries.toLowerCase().includes('ml') ||
                (currentSeries.toLowerCase().includes('battery') &&
                  currentSeries.toLowerCase().includes('water')) ||
                currentSeries.toLowerCase().includes('distilled'));

            return !isBatteryTonic;
          })() && (
            <ProductWarrantyFields
              warrentyStartDate={accordionDataItem.warrentyStartDate}
              warrentyDuration={accordionDataItem.warrentyDuration}
              warrentyCode={accordionDataItem.warrentyCode}
              onStartDateChange={(date) =>
                handleFieldChange('warrentyStartDate', date)
              }
              onDurationChange={(duration) =>
                handleFieldChange('warrentyDuration', duration)
              }
              onCodeChange={(code) => handleFieldChange('warrentyCode', code)}
              accordionIndex={accordionIndex}
              accordionMethods={accordionMethods}
              series={accordionDataItem.series}
            />
          )}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      {accordionData && Object.keys(accordionData).length > 0 ? (
        Object.keys(accordionData).map((index, arrayIndex) => {
          const accordionIndex = parseInt(index);
          const accordionDataItem = accordionData[accordionIndex];
          const totalAccordions = Object.keys(accordionData).length;
          const isLastAccordion = arrayIndex === totalAccordions - 1;

          if (!accordionDataItem) return null;

          // Skip battery tonic products
          const currentSeries = accordionDataItem.series || '';
          const isBatteryTonic = currentSeries?.toLowerCase().includes('tonic');

          if (isBatteryTonic) {
            return (
              <div key={accordionIndex} className='text-sm text-gray-600'>
                Battery Tonic products use different configuration
              </div>
            );
          }

          // Create dynamic title with brand and series info
          const brandText = accordionDataItem.brandName
            ? `${accordionDataItem.brandName}`
            : '';
          const seriesText = accordionDataItem.series
            ? ` - ${accordionDataItem.series}`
            : '';
          const hasBothSelected =
            accordionDataItem.brandName && accordionDataItem.series;
          const productTitle = hasBothSelected
            ? `${brandText}${seriesText}`
            : `Product ${arrayIndex + 1}${brandText}${seriesText}`;

          return (
            <Accordion
              key={accordionIndex}
              title={productTitle}
              content={
                <div className='p-4'>
                  {renderAccordionContent(accordionIndex)}
                </div>
              }
              index={accordionIndex}
              expandedAccordionIndex={expandedAccordionIndex}
              handleAccordionClick={onAccordionClick}
              addOnClick={() =>
                accordionMethods.handleAddAccordion(accordionIndex)
              }
              removeOnClick={() =>
                accordionMethods.handleRemoveAccordion(accordionIndex)
              }
              addIconClass={isLastAccordion ? '' : 'hidden'} // Show green plus only on last accordion
              removeIconClass={arrayIndex === 0 ? 'hidden' : ''}
            />
          );
        })
      ) : (
        <div className='py-4 text-center text-gray-500'>
          No products configured. Click the + button to add a product.
        </div>
      )}
    </div>
  );
};

export default ProductSectionRefactored;
