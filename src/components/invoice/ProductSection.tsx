import React from 'react';

const Accordion = React.lazy(() => import('@/components/accordion'));
const Dropdown = React.lazy(() => import('@/components/dropdown'));
const Input = React.lazy(() => import('@/components/customInput'));

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
    const originalSeriesOptions = accordionData[accordionIndex]?.seriesOption || [];
    
    if (!selectedBrand || !stock) {
      return originalSeriesOptions;
    }

    // Find stock data for the selected brand
    const brandStock = stock.find(stockItem => stockItem.brandName === selectedBrand);
    
    if (!brandStock || !brandStock.seriesStock) {
      return originalSeriesOptions;
    }

    // Filter series options to only include those with stock > 0
    const filteredOptions = originalSeriesOptions.filter((option: { value: string }) => {
      const stockItem = brandStock.seriesStock.find((stock: { series: string; batteryDetails?: { name: string }; quantity: number }) => 
        stock.series === option.value || 
        stock.batteryDetails?.name === option.value
      );
      return stockItem && stockItem.quantity > 0;
    });

    return filteredOptions;
  };
  const getAccordionContent = (accordionIndex: number) => {
    const accordionDataItem = accordionData[accordionIndex];
    if (!accordionDataItem) {
      return null;
    }

    return (
      <>
        <div
          className='w-full'
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <div className='flex w-full gap-2'>
            <Dropdown
              className={'mt-2'}
              options={brandOptions}
              onSelect={(option) =>
                accordionMethods.handleAccordionChange(accordionIndex, 'brandName', option.value)
              }
              placeholder='Select Brand'
              defaultValue={accordionData[accordionIndex]?.brandName}
              required
            />
            <Dropdown
              className={'mt-2'}
              options={getFilteredSeriesOptions(accordionIndex)}
              onSelect={(option) =>
                accordionMethods.handleAccordionChange(accordionIndex, 'series', option.value)
              }
              placeholder='Select Series'
              defaultValue={accordionData[accordionIndex]?.series}
              required
            />
          </div>
          
          <div className='flex w-full gap-2'>
            <Input
              parentClass='mt-2'
              type='number'
              label='Product Price'
              name='productPrice'
              min={1}
              step="0.01"
              required
              value={accordionDataItem.productPrice}
              onChange={(e) =>
                accordionMethods.handleAccordionChange(
                  accordionIndex,
                  'productPrice',
                  e.target.value
                )
              }
            />
            <Input
              parentClass='mt-4'
              type='number'
              label='Quantity'
              value={accordionDataItem.quantity}
              onChange={(e) => {
                accordionMethods.handleAccordionChange(accordionIndex, 'quantity', e.target.value);
              }}
            />
          </div>

          <div
            className='flex w-full gap-2'
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Input
              parentClass='mt-4'
              type='date'
              label='Warrenty Start Date'
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
            <Input
              parentClass='mt-4'
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

        <Input
          parentClass='mt-2'
          type='text'
          label='Warrenty Code'
          name='warrentyCode'
          value={accordionDataItem.warrentyCode}
          onChange={(e) =>
            accordionMethods.handleAccordionChange(
              accordionIndex,
              'warrentyCode',
              e.target.value
            )
          }
        />
      </>
    );
  };

  return (
    <>
      {Object.keys(accordionData).map((accordionIndex: any, index) => (
        <Accordion
          addOnClick={() => accordionMethods.handleAddAccordion(Number(accordionIndex))}
          index={index}
          addIconClass={`${index === Object.keys(accordionData).length - 1 ? '' : 'hidden'}`}
          removeIconClass={`${index === 0 ? 'hidden' : ''}`}
          removeOnClick={() => {
            accordionMethods.handleRemoveAccordion(parseInt(accordionIndex, 10));
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