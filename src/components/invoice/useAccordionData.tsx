import { useState, useCallback } from 'react';

interface AccordionData {
  [key: number]: {
    brandName: string;
    series: string;
    productPrice: string;
    quantity: string;
    warrentyStartDate: string;
    warrentyEndDate: string;
    warrentyCode: string;
    warrentyDuration: string;
    seriesOption: SeriesOption[];
    batteryDetails?: BatteryDetails;
  };
}

interface SeriesOption {
  label: string;
  value: string;
  batteryDetails?: BatteryDetails;
}

interface BatteryDetails {
  name: string;
  plate: string;
  ah: number;
  type?: string;
}

const calculateEndDate = (startDate: string, months: number | string): string => {
  if (!startDate || isNaN(new Date(startDate).getTime())) {
    return '';
  }

  const date = new Date(startDate);
  date.setMonth(date.getMonth() + parseInt(months as string));
  return date.toISOString().split('T')[0];
};

const calculateAmountReceived = (data: AccordionData) => {
  return Object.values(data).reduce((total, row) => {
    const price = parseFloat(String(row.productPrice)) || 0;
    const quantity = parseInt(String(row.quantity)) || 0;
    return total + price * quantity;
  }, 0);
};

export const useAccordionData = (categories: any[], stock?: any[]) => {
  const [accordionData, setAccordionData] = useState<AccordionData>({
    1: {
      brandName: '',
      series: '',
      productPrice: '',
      quantity: '',
      seriesOption: [],
      warrentyStartDate: new Date().toISOString().split('T')[0],
      warrentyEndDate: calculateEndDate(new Date().toISOString().split('T')[0], '6'),
      warrentyCode: '',
      warrentyDuration: '6',
      batteryDetails: undefined,
    },
  });

  const [amountReceived, setAmountReceived] = useState<number>(0);

  const handleRemoveAccordion = useCallback((accordionIndex: number) => {
    setAccordionData(prevData => {
      const newData = { ...prevData };
      delete newData[accordionIndex];
      return newData;
    });
  }, []);

  const handleAddAccordion = useCallback((accordionIndex: number) => {
    const warrantyStartDate = new Date().toISOString().split('T')[0];
    setAccordionData((prevData) => ({
      ...prevData,
      [accordionIndex + 1]: {
        brandName: '',
        series: '',
        productPrice: '',
        quantity: '',
        seriesOption: [],
        warrentyStartDate: warrantyStartDate,
        warrentyEndDate: calculateEndDate(warrantyStartDate, '6'),
        warrentyCode: '',
        warrentyDuration: '6',
        batteryDetails: undefined,
      },
    }));
  }, []);

  const handleAccordionChange = useCallback((
    accordionIndex: number,
    fieldName: string,
    fieldValue: string | string[]
  ) => {
    if (fieldName === 'brandName') {
      const category = categories.find((item) => item.brandName === fieldValue);
      if (category) {
        // Create series options from category data
        const seriesOptions = category.series.map((battery: any) => ({
          label: `${battery.name} (${battery.plate}, ${battery.ah}AH${battery.type ? `, ${battery.type}` : ''})`,
          value: battery.name,
          batteryDetails: battery,
        }));

        // Filter series options based on stock availability
        let filteredSeriesOptions = [];
        
        console.log('🔍 Stock filtering for brand:', fieldValue);
        console.log('📦 Available stock:', stock);
        
        if (stock && stock.length > 0) {
          const brandStock = stock.find(stockItem => 
            stockItem.brandName && stockItem.brandName === fieldValue
          );
          
          console.log('🏷️ Brand stock found:', brandStock);
          
          if (brandStock && brandStock.seriesStock && brandStock.seriesStock.length > 0) {
            console.log('📋 Series in stock:', brandStock.seriesStock);
            console.log('🎯 All series options:', seriesOptions);
            
            // Only show series that exist in stock with quantity > 0
            filteredSeriesOptions = seriesOptions.filter(option => {
              const stockItem = brandStock.seriesStock.find(stockSeries => {
                // More comprehensive matching
                const stockSeriesName = stockSeries.series?.toLowerCase().trim();
                const optionValue = option.value?.toLowerCase().trim();
                const batteryName = option.batteryDetails?.name?.toLowerCase().trim();
                
                console.log(`🔗 Matching: "${stockSeriesName}" vs "${optionValue}" or "${batteryName}"`);
                
                return (stockSeriesName === optionValue || stockSeriesName === batteryName) && 
                       stockSeries.inStock > 0;
              });
              
              console.log(`✅ Option "${option.value}" ${stockItem ? 'MATCHED' : 'NOT MATCHED'}`);
              return stockItem && stockItem.inStock > 0;
            });
            
            console.log('🎭 Filtered options:', filteredSeriesOptions);
          } else {
            console.log('❌ No series stock found for brand');
          }
          // If no stock found for this brand or no series in stock, show empty array
        } else {
          // If no stock data at all, show all series (fallback for when stock isn't loaded yet)
          console.log('⚠️ No stock data available, showing all series');
          filteredSeriesOptions = seriesOptions;
        }

        setAccordionData((prevData: AccordionData) => ({
          ...prevData,
          [accordionIndex]: {
            ...prevData[accordionIndex],
            brandName: String(fieldValue),
            seriesOption: filteredSeriesOptions,
            series: '', // Reset series when brand changes
          },
        }));
      }
    } else if (fieldName === 'series') {
      const currentAccordion = accordionData[accordionIndex];
      const selectedSeries = currentAccordion.seriesOption.find(
        (option) => option.value === fieldValue
      );
      setAccordionData((prevData: AccordionData) => ({
        ...prevData,
        [accordionIndex]: {
          ...prevData[accordionIndex],
          series: String(fieldValue),
          batteryDetails: selectedSeries?.batteryDetails,
        },
      }));
    } else if (fieldName === 'warrentyDuration' || fieldName === 'warrentyStartDate') {
      const currentAccordion = accordionData[accordionIndex];
      const newValue = String(fieldValue);
      const startDate = fieldName === 'warrentyStartDate' ? newValue : currentAccordion.warrentyStartDate;
      const duration = fieldName === 'warrentyDuration' ? newValue : currentAccordion.warrentyDuration;
      
      setAccordionData((prevData: AccordionData) => ({
        ...prevData,
        [accordionIndex]: {
          ...prevData[accordionIndex],
          [fieldName]: newValue,
          warrentyEndDate: calculateEndDate(startDate, duration),
        },
      }));
    } else {
      setAccordionData((prevData: AccordionData) => {
        const updated = {
          ...prevData,
          [accordionIndex]: {
            ...prevData[accordionIndex],
            [fieldName]: fieldValue,
          },
        };
        // Calculate new total amount
        const newAmount = calculateAmountReceived(updated);
        setAmountReceived(newAmount);
        return updated;
      });
    }
  }, [accordionData, categories, stock]);

  const resetAccordionData = useCallback(() => {
    const warrantyStartDate = new Date().toISOString().split('T')[0];
    setAccordionData({
      1: {
        brandName: '',
        series: '',
        productPrice: '',
        quantity: '',
        seriesOption: [],
        warrentyStartDate: warrantyStartDate,
        warrentyEndDate: calculateEndDate(warrantyStartDate, '6'),
        warrentyCode: '',
        warrentyDuration: '6',
        batteryDetails: undefined,
      },
    });
    setAmountReceived(0);
  }, []);

  return {
    accordionData,
    setAccordionData,
    amountReceived,
    setAmountReceived,
    handleRemoveAccordion,
    handleAddAccordion,
    handleAccordionChange,
    resetAccordionData,
  };
};