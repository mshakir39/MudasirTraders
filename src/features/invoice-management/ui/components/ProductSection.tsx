import React from 'react';
import Accordion from '@/components/accordion';
import Dropdown from '@/components/dropdown';
import SeriesAutocomplete from '@/components/SeriesAutocomplete';
import Input from '@/components/customInput';
import { normalizeInStock } from '@/utils/stockUtils';
import { Toggle } from '@/components/toggle';

interface ProductSectionProps {
  accordionData: any;
  categories: any[];
  brandOptions: any[];
  expandedAccordionIndex: number;
  onAccordionClick: (index: number) => void;
  accordionMethods: any;
  stock: any[];
}

const ProductSection: React.FC<ProductSectionProps> = ({
  accordionData,
  categories,
  brandOptions,
  expandedAccordionIndex,
  onAccordionClick,
  accordionMethods,
  stock,
}) => {
  // Function to filter series options based on stock availability
  const getFilteredSeriesOptions = (accordionIndex: number) => {
    const selectedBrand = accordionData[accordionIndex]?.brandName;
    const originalSeriesOptions =
      accordionData[accordionIndex]?.seriesOption || [];

    // If no brand is selected, return empty array
    if (!selectedBrand) {
      return [];
    }

    // Get series from stock data first (only those with stock > 0)
    let stockSeriesOptions: any[] = [];
    if (stock) {
      const brandStock = stock.find(
        (stockItem) => stockItem.brandName === selectedBrand
      );

      if (brandStock && brandStock.seriesStock) {
        stockSeriesOptions = brandStock.seriesStock
          .filter((stockItem: any) => {
            const stockQuantity = normalizeInStock(stockItem.inStock);

            return stockQuantity > 0;
          })
          .map((stockItem: any) => {
            return {
              label: stockItem.series,
              value: stockItem.series,
              batteryDetails: stockItem.batteryDetails || null,
              stockQuantity: normalizeInStock(stockItem.inStock),
            };
          });
      }
    }

    // Get series from categories (only for series that have stock > 0)
    let categorySeriesOptions: any[] = [];
    const category = categories.find((cat) => cat.brandName === selectedBrand);
    if (category) {
      categorySeriesOptions = category.series
        .filter((battery: any) => {
          // Check if this series exists in stock with quantity > 0 (using fuzzy matching)
          const stockItem = stockSeriesOptions.find((opt) => {
            // First try exact match
            if (opt.value === battery.name) return true;

            // If no exact match, try fuzzy matching
            const normalize = (str: string) =>
              str
                .toLowerCase()
                .replace(/[\/\\]/g, '') // Remove slashes
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();

            const normalizedStock = normalize(opt.value);
            const normalizedCategory = normalize(battery.name);

            return normalizedStock === normalizedCategory;
          });
          return stockItem && stockItem.stockQuantity > 0;
        })
        .map((battery: any) => ({
          label: `${battery.name} (${battery.plate}, ${battery.ah}AH${battery.type ? `, ${battery.type}` : ''})`,
          value: battery.name,
          batteryDetails: battery,
        }));
    }

    // Combine and deduplicate series options
    const allSeriesOptions = [...categorySeriesOptions];
    stockSeriesOptions.forEach((stockOption) => {
      // Use fuzzy matching to find existing series
      const existingIndex = allSeriesOptions.findIndex((catOption) => {
        // First try exact match
        if (catOption.value === stockOption.value) return true;

        // If no exact match, try fuzzy matching
        const normalize = (str: string) =>
          str
            .toLowerCase()
            .replace(/[\/\\]/g, '') // Remove slashes
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();

        const normalizedStock = normalize(stockOption.value);
        const normalizedCategory = normalize(catOption.value);

        return normalizedStock === normalizedCategory;
      });

      if (existingIndex === -1) {
        // For series that only exist in stock (not in categories), use the stock option
        allSeriesOptions.push({
          label: stockOption.label,
          value: stockOption.value,
          batteryDetails: stockOption.batteryDetails,
        });
      } else {
        // For series that exist in both, prioritize category data (complete batteryDetails)
        // but keep the stock quantity information
        allSeriesOptions[existingIndex] = {
          ...allSeriesOptions[existingIndex],
          stockQuantity: stockOption.stockQuantity,
        };
      }
    });

    // Final deduplication to remove any remaining duplicates based on normalized names
    const finalSeriesOptions: any[] = [];
    const seenNames = new Set<string>();

    allSeriesOptions.forEach((option) => {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .replace(/[\/\\]/g, '') // Remove slashes
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();

      const normalizedName = normalize(option.value);

      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        finalSeriesOptions.push(option);
      } else {
        // If we've seen this normalized name before, keep the one with better data (non-zero values)
        const existingIndex = finalSeriesOptions.findIndex(
          (existing) => normalize(existing.value) === normalizedName
        );

        if (existingIndex !== -1) {
          const existing = finalSeriesOptions[existingIndex];
          const current = option;

          // Keep the one with better data (non-zero plate, AH, retailPrice)
          const existingScore =
            (existing.batteryDetails?.plate || 0) +
            (existing.batteryDetails?.ah || 0) +
            (existing.batteryDetails?.retailPrice || 0);
          const currentScore =
            (current.batteryDetails?.plate || 0) +
            (current.batteryDetails?.ah || 0) +
            (current.batteryDetails?.retailPrice || 0);

          if (currentScore > existingScore) {
            finalSeriesOptions[existingIndex] = current;
          }
        }
      }
    });

    return finalSeriesOptions;
  };
  const getAccordionContent = (accordionIndex: number) => {
    const accordionDataItem = accordionData[accordionIndex];
    if (!accordionDataItem) {
      return null;
    }

    return (
      <div className='w-full'>
        <div className='mb-4 mt-4 grid w-full grid-cols-2 gap-4'>
          <div className='w-full'>
            <Dropdown
              className={'w-full'}
              options={brandOptions}
              onSelect={(option) => {
                accordionMethods.handleAccordionChange(
                  accordionIndex,
                  'brandName',
                  option.value
                );
              }}
              placeholder='Select Brand'
              value={
                brandOptions.find(
                  (opt) =>
                    opt.value === accordionData[accordionIndex]?.brandName
                ) || null
              }
              required
            />
            {/* Debug brand options */}
            <div style={{ fontSize: '10px', color: 'gray', marginTop: '2px' }}>
              Debug: Brands: {brandOptions.length}, Current:{' '}
              {accordionData[accordionIndex]?.brandName || 'none'}
            </div>
          </div>
          <div className='w-full'>
            <SeriesAutocomplete
              key={`series-${accordionIndex}`}
              series={getFilteredSeriesOptions(accordionIndex).map((option) => {
                const mappedSeries = {
                  name: option.value,
                  plate: option.batteryDetails?.plate || 0,
                  ah: option.batteryDetails?.ah || 0,
                  retailPrice: option.batteryDetails?.retailPrice || 0,
                  type: option.batteryDetails?.type || '',
                  salesTax: option.batteryDetails?.salesTax || 0,
                  maxRetailPrice: option.batteryDetails?.maxRetailPrice || 0,
                };

                // Debug logging for the problematic series
                if (option.value === 'MF 70 R/L (ThinThick Pole)') {
                }

                return mappedSeries;
              })}
              value={accordionData[accordionIndex]?.series || ''}
              onChange={(value) => {
                // Check if the selected series is battery tonic (distilled water)
                const isBatteryTonic =
                  value &&
                  (value.toLowerCase().includes('tonic') ||
                    value.toLowerCase().includes('ml') ||
                    (value.toLowerCase().includes('battery') &&
                      value.toLowerCase().includes('water')) ||
                    value.toLowerCase().includes('distilled'));

                // Update series
                accordionMethods.handleAccordionChange(
                  accordionIndex,
                  'series',
                  value
                );

                // Auto-set noWarranty to true for battery tonic
                if (isBatteryTonic) {
                  accordionMethods.handleAccordionChange(
                    accordionIndex,
                    'noWarranty',
                    true
                  );
                }
              }}
              placeholder='Search series...'
              className='w-full'
            />
          </div>
        </div>

        <div className='mb-4 grid w-full grid-cols-2 gap-4'>
          <div className='w-full'>
            <Input
              parentClass='w-full'
              type='number'
              label='Product Price'
              name='productPrice'
              min={1}
              step='0.01'
              required
              value={accordionDataItem.productPrice}
              onChange={(e) => {
                accordionMethods.handleAccordionChange(
                  accordionIndex,
                  'productPrice',
                  e.target.value
                );
              }}
            />
          </div>
          <div className='w-full'>
            <Input
              parentClass='w-full'
              type='number'
              label='Quantity'
              value={accordionDataItem.quantity}
              onChange={(e) => {
                accordionMethods.handleAccordionChange(
                  accordionIndex,
                  'quantity',
                  e.target.value
                );
              }}
            />
          </div>
        </div>

        {/* Check if current series is battery tonic */}
        {(() => {
          const currentSeries = accordionDataItem.series || '';
          const isBatteryTonic =
            currentSeries &&
            (currentSeries.toLowerCase().includes('tonic') ||
              currentSeries.toLowerCase().includes('ml') ||
              (currentSeries.toLowerCase().includes('battery') &&
                currentSeries.toLowerCase().includes('water')) ||
              currentSeries.toLowerCase().includes('distilled'));

          // If it's battery tonic, show info message instead of toggle
          if (isBatteryTonic) {
            return (
              <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-blue-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3 flex-1'>
                    <p className='text-sm font-medium text-blue-800'>
                      Battery Tonic (Distilled Water) - No Warranty Required
                    </p>
                    <p className='mt-1 text-xs text-blue-700'>
                      Warranty fields are not applicable for this product type.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // For regular batteries, show the warranty toggle
          return (
            <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <div className='flex items-center gap-4'>
                <div className='flex flex-col'>
                  <label className='text-sm font-semibold text-gray-800'>
                    No Warranty
                  </label>
                  <p className='mt-1 text-xs text-gray-600'>
                    {accordionDataItem.noWarranty
                      ? 'This product has no warranty coverage'
                      : 'Enable if this product has no warranty'}
                  </p>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue = !accordionDataItem.noWarranty;
                    accordionMethods.handleAccordionChange(
                      accordionIndex,
                      'noWarranty',
                      newValue
                    );
                  }}
                  className='cursor-pointer'
                >
                  <Toggle
                    checked={!!accordionDataItem.noWarranty}
                    onChange={() => {}}
                    label={
                      accordionDataItem.noWarranty
                        ? 'No Warranty'
                        : 'Has Warranty'
                    }
                    size='sm'
                    color='red'
                    labelPosition='bottom'
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Only show warranty fields if warranty is enabled and NOT battery tonic */}
        {(() => {
          const currentSeries = accordionDataItem.series || '';
          const isBatteryTonic =
            currentSeries &&
            (currentSeries.toLowerCase().includes('tonic') ||
              currentSeries.toLowerCase().includes('ml') ||
              (currentSeries.toLowerCase().includes('battery') &&
                currentSeries.toLowerCase().includes('water')) ||
              currentSeries.toLowerCase().includes('distilled'));
          // Don't show warranty fields if it's battery tonic OR if noWarranty is true
          return !accordionDataItem.noWarranty && !isBatteryTonic;
        })() && (
          <>
            <div className='mb-4 grid w-full grid-cols-2 gap-4'>
              <div className='w-full'>
                <Input
                  parentClass='w-full'
                  type='date'
                  label='Warranty Start Date'
                  name='warrentyStartDate'
                  value={accordionDataItem.warrentyStartDate}
                  onChange={(e) =>
                    accordionMethods.handleAccordionChange(
                      accordionIndex,
                      'warrentyStartDate',
                      e.target.value
                    )
                  }
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
                  value={accordionDataItem.warrentyDuration || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Ensure value is not negative and not greater than 120, allow 0 for no warranty
                    const numValue = parseInt(value);
                    if (value === '' || (numValue >= 0 && numValue <= 120)) {
                      accordionMethods.handleAccordionChange(
                        accordionIndex,
                        'warrentyDuration',
                        value
                      );
                    }
                  }}
                />
              </div>
            </div>

            <div className='mb-4 w-full'>
              <Input
                parentClass='w-full'
                type='text'
                label='Warranty Code'
                name='warrentyCode'
                placeholder='Enter warranty code(s) - multiple codes separated by comma or space'
                value={accordionDataItem.warrentyCode}
                onChange={(e) =>
                  accordionMethods.handleAccordionChange(
                    accordionIndex,
                    'warrentyCode',
                    e.target.value
                  )
                }
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {Object.keys(accordionData).map((accordionIndex: any, index) => (
        <Accordion
          addOnClick={() =>
            accordionMethods.handleAddAccordion(Number(accordionIndex))
          }
          index={index}
          addIconClass={`${index === Object.keys(accordionData).length - 1 ? '' : 'hidden'}`}
          removeIconClass={`${index === 0 ? 'hidden' : ''}`}
          removeOnClick={() => {
            accordionMethods.handleRemoveAccordion(
              parseInt(accordionIndex, 10)
            );
          }}
          expandedAccordionIndex={expandedAccordionIndex}
          handleAccordionClick={onAccordionClick}
          key={accordionIndex}
          title={`Row ${accordionIndex}`}
          content={getAccordionContent(parseInt(accordionIndex, 10))}
        />
      ))}
    </>
  );
};

export default ProductSection;
