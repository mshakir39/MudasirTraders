import React from 'react';
import Accordion from '@/components/accordion';
import Dropdown from '@/components/dropdown';
import Input from '@/components/customInput';
import { normalizeInStock } from '@/utils/stockUtils';

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
          // Check if this series exists in stock with quantity > 0
          const stockItem = stockSeriesOptions.find(
            (opt) => opt.value === battery.name
          );
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
      const exists = allSeriesOptions.some(
        (catOption) => catOption.value === stockOption.value
      );
      if (!exists) {
        // For series that only exist in stock (not in categories), use the stock option
        allSeriesOptions.push({
          label: stockOption.label,
          value: stockOption.value,
          batteryDetails: stockOption.batteryDetails,
        });
      } else {
      }
    });

    // Always use combined options to ensure all available series are shown

    return allSeriesOptions;
  };
  const getAccordionContent = (accordionIndex: number) => {
    const accordionDataItem = accordionData[accordionIndex];
    if (!accordionDataItem) {
      return null;
    }

    return (
      <>
        <div className='w-full'>
          <div className='mb-4 mt-4 grid w-full grid-cols-2 gap-4'>
            <div className='w-full'>
              <Dropdown
                key={`brand-${accordionIndex}`}
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
                defaultValue={accordionData[accordionIndex]?.brandName}
                required
              />
            </div>
            <div className='w-full'>
              <Dropdown
                key={`series-${accordionIndex}`}
                className={'w-full'}
                options={getFilteredSeriesOptions(accordionIndex)}
                onSelect={(option) => {
                  accordionMethods.handleAccordionChange(
                    accordionIndex,
                    'series',
                    option.value
                  );
                }}
                placeholder='Select Series'
                defaultValue={accordionData[accordionIndex]?.series}
                required
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
                label='Warranty Duration (Months)'
                name='warrentyDuration'
                min={1}
                value={accordionDataItem.warrentyDuration}
                onChange={(e) =>
                  accordionMethods.handleAccordionChange(
                    accordionIndex,
                    'warrentyDuration',
                    e.target.value
                  )
                }
              />
            </div>
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
