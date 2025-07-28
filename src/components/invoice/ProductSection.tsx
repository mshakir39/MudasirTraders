import React from 'react';
import Accordion from '@/components/accordion';
import Dropdown from '@/components/dropdown';
import Input from '@/components/customInput';

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
    
    // If no brand is selected, return empty array
    if (!selectedBrand) {
      return [];
    }
    
    // If no original series options, try to get them from categories
    if (originalSeriesOptions.length === 0) {
      const category = categories.find((cat) => cat.brandName === selectedBrand);
      if (category) {
        const seriesOptions = category.series.map((battery: any) => ({
          label: `${battery.name} (${battery.plate}, ${battery.ah}AH${battery.type ? `, ${battery.type}` : ''})`,
          value: battery.name,
          batteryDetails: battery,
        }));
        return seriesOptions;
      }
    }
    
    if (!stock) {
      return originalSeriesOptions;
    }

    // Find stock data for the selected brand
    const brandStock = stock.find(stockItem => stockItem.brandName === selectedBrand);
    
    if (!brandStock || !brandStock.seriesStock) {
      return originalSeriesOptions;
    }

    // Filter series options to only include those with stock > 0
    const filteredOptions = originalSeriesOptions.filter((option: { value: string }) => {
      const stockItem = brandStock.seriesStock.find((stock: { series: string; batteryDetails?: { name: string }; inStock: string | number }) => 
        stock.series === option.value || 
        stock.batteryDetails?.name === option.value
      );
      // Convert inStock to number for proper comparison
      const stockQuantity = stockItem ? parseInt(String(stockItem.inStock)) || 0 : 0;
      return stockItem && stockQuantity > 0;
    });
    
    // Fallback: if filtering results in empty array, show all series options
    if (filteredOptions.length === 0) {
      return originalSeriesOptions;
    }

    return filteredOptions;
  };
  const getAccordionContent = (accordionIndex: number) => {
    const accordionDataItem = accordionData[accordionIndex];
    if (!accordionDataItem) {
      return null;
    }

    return (
      <>
        <div className='w-full'>
          <div className='grid grid-cols-2 w-full gap-4 mb-4 mt-4'>
            <div className="w-full">
           
              <Dropdown
                key={`brand-${accordionIndex}`}
                className={'w-full'}
                options={brandOptions}
                onSelect={(option) => {
                  accordionMethods.handleAccordionChange(accordionIndex, 'brandName', option.value);
                }}
                placeholder='Select Brand'
                defaultValue={accordionData[accordionIndex]?.brandName}
                required
              />
            </div>
            <div className="w-full">
          
              <Dropdown
                key={`series-${accordionIndex}`}
                className={'w-full'}
                options={getFilteredSeriesOptions(accordionIndex)}
                onSelect={(option) => {
                  accordionMethods.handleAccordionChange(accordionIndex, 'series', option.value);
                }}
                placeholder='Select Series'
                defaultValue={accordionData[accordionIndex]?.series}
                required
              />
            </div>
            

          </div>
          

          
          <div className='grid grid-cols-2 w-full gap-4 mb-4'>
            <div className="w-full">
              <Input
                parentClass='w-full'
                type='number'
                label='Product Price'
                name='productPrice'
                min={1}
                step="0.01"
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
            <div className="w-full">
              <Input
                parentClass='w-full'
                type='number'
                label='Quantity'
                value={accordionDataItem.quantity}
                onChange={(e) => {
                  accordionMethods.handleAccordionChange(accordionIndex, 'quantity', e.target.value);
                }}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 w-full gap-4 mb-4'>
            <div className="w-full">
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
            <div className="w-full">
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

        <div className='w-full mb-4'>
          <Input
            parentClass='w-full'
            type='text'
            label='Warranty Code'
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
        </div>
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