// src/features/invoice-management/lib/useAccordionDataJotai.tsx
// Jotai version of useAccordionData - eliminates accordion prop drilling

import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  accordionDataAtom, 
  expandedAccordionIndexAtom, 
  updateAccordionFieldAtom,
  resetAccordionDataAtom 
} from '@/store/invoiceAtoms';
import { normalizeInStock } from '@/utils/stockUtils';

interface AccordionItemData {
  brandName: string;
  series: string;
  productPrice: string;
  quantity: string;
  warrentyStartDate: string;
  warrentyEndDate: string;
  warrentyCode: string;
  warrentyDuration: string;
  noWarranty: boolean;
  seriesOption: SeriesOption[];
  batteryDetails?: BatteryDetails;
}

type AccordionData = Record<number, AccordionItemData>;

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

const calculateEndDate = (
  startDate: string,
  months: number | string
): string => {
  if (!startDate || isNaN(new Date(startDate).getTime())) {
    return '';
  }

  // Handle empty or invalid months value
  const monthsValue = parseInt(String(months));
  if (isNaN(monthsValue) || monthsValue <= 0) {
    return '';
  }

  const date = new Date(startDate);
  date.setMonth(date.getMonth() + monthsValue);
  return date.toISOString().split('T')[0];
};

const calculateAmountReceived = (data: AccordionData) => {
  return Object.values(data).reduce((total, row) => {
    const price = parseFloat(String(row.productPrice)) || 0;
    const quantity = parseInt(String(row.quantity)) || 0;
    return total + price * quantity;
  }, 0);
};

export const useAccordionDataJotai = (categories: any[], stock?: any[]) => {
  const [accordionData, setAccordionData] = useAtom(accordionDataAtom);
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useAtom(expandedAccordionIndexAtom);
  const updateAccordionField = useSetAtom(updateAccordionFieldAtom);
  const resetAccordionDataAction = useSetAtom(resetAccordionDataAtom);

  // Initialize with default accordion data if empty
  const initializeAccordionData = useCallback(() => {
    if (Object.keys(accordionData).length === 0) {
      const warrantyStartDate = new Date().toISOString().split('T')[0];
      const defaultData: AccordionData = {
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
          noWarranty: false,
          batteryDetails: undefined,
        },
      };
      setAccordionData(defaultData);
    }
  }, [accordionData, setAccordionData]);

  const handleRemoveAccordion = useCallback((accordionIndex: number) => {
    setAccordionData((prevData) => {
      const newData = { ...prevData };
      delete newData[accordionIndex];
      return newData;
    });
  }, [setAccordionData]);

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
        noWarranty: false,
        batteryDetails: undefined,
      },
    }));
  }, [setAccordionData]);

  const handleAccordionChange = useCallback(
    (
      accordionIndex: number,
      fieldName: string,
      fieldValue: string | string[]
    ) => {
      if (fieldName === 'brandName') {
        const category = categories.find(
          (item) => item.brandName === fieldValue
        );

        if (category) {
          // Get series from stock data first (only those with stock > 0)
          let stockSeriesOptions: any[] = [];
          console.log('Processing brand:', fieldValue);
          console.log('Available stock:', stock);

          if (stock && stock.length > 0) {
            const brandStock = stock.find(
              (stockItem) =>
                stockItem.brandName && stockItem.brandName === fieldValue
            );

            console.log('Found brand stock:', brandStock);

            if (
              brandStock &&
              brandStock.seriesStock &&
              brandStock.seriesStock.length > 0
            ) {
              console.log('Brand series stock:', brandStock.seriesStock);
              stockSeriesOptions = brandStock.seriesStock
                .filter(
                  (stockItem: any) => normalizeInStock(stockItem.inStock) > 0
                )
                .map((stockItem: any) => {
                  return {
                    label: stockItem.series,
                    value: stockItem.series,
                    batteryDetails: stockItem.batteryDetails || null,
                    stockQuantity: normalizeInStock(stockItem.inStock),
                  };
                });
              console.log('Filtered stock series options:', stockSeriesOptions);
            }
          }

          // Create series options from category data (only for series that have stock > 0)
          const categorySeriesOptions = category.series
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
            }
          });

          console.log('Category series options:', categorySeriesOptions);
          console.log('Final all series options:', allSeriesOptions);
          console.log(
            'Setting series options for accordion:',
            accordionIndex,
            allSeriesOptions
          );

          // Use combined options (only series with stock > 0)
          const filteredSeriesOptions = allSeriesOptions;
          setAccordionData((prevData) => {
            const currentAccordion = prevData[accordionIndex];
            const newData = {
              ...prevData,
              [accordionIndex]: {
                ...currentAccordion,
                brandName: String(fieldValue),
                seriesOption: filteredSeriesOptions,
                series: '', // Reset series when brand changes
              },
            };
            return newData;
          });
        }
      } else if (fieldName === 'series') {
        const currentAccordion = accordionData[accordionIndex];
        const seriesOptions = Array.isArray(currentAccordion?.seriesOption) ? currentAccordion.seriesOption : [];
        const selectedSeries = seriesOptions.find(
          (option: any) => option.value === fieldValue
        );
        updateAccordionField({
          index: accordionIndex,
          field: 'series',
          value: String(fieldValue)
        });
        updateAccordionField({
          index: accordionIndex,
          field: 'batteryDetails',
          value: selectedSeries?.batteryDetails
        });
      } else if (
        fieldName === 'warrentyDuration' ||
        fieldName === 'warrentyStartDate'
      ) {
        const currentAccordion = accordionData[accordionIndex];
        const newValue = String(fieldValue);
        const startDate =
          fieldName === 'warrentyStartDate'
            ? newValue
            : currentAccordion?.warrentyStartDate || '';
        const duration =
          fieldName === 'warrentyDuration'
            ? newValue
            : currentAccordion?.warrentyDuration || '';

        updateAccordionField({
          index: accordionIndex,
          field: fieldName,
          value: newValue
        });
        updateAccordionField({
          index: accordionIndex,
          field: 'warrentyEndDate',
          value: calculateEndDate(startDate, duration)
        });
      } else if (fieldName === 'noWarranty') {
        const isNoWarranty = Boolean(fieldValue);
        setAccordionData((prevData) => {
          const currentAccordion = prevData[accordionIndex];
          const newData = {
            ...prevData,
            [accordionIndex]: {
              ...currentAccordion,
              noWarranty: isNoWarranty,
              // Reset warranty fields when no warranty is selected
              warrentyStartDate: isNoWarranty
                ? ''
                : currentAccordion?.warrentyStartDate ||
                  new Date().toISOString().split('T')[0],
              warrentyEndDate: isNoWarranty
                ? ''
                : currentAccordion?.warrentyEndDate,
              warrentyDuration: isNoWarranty
                ? '0'
                : currentAccordion?.warrentyDuration || '6',
              warrentyCode: isNoWarranty
                ? 'No Warranty'
                : currentAccordion?.warrentyCode,
            },
          };
          return newData;
        });
      } else {
        updateAccordionField({
          index: accordionIndex,
          field: fieldName,
          value: typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue
        });
      }
    },
    [accordionData, categories, stock, updateAccordionField, setAccordionData]
  );

  const resetAccordionData = useCallback(() => {
    resetAccordionDataAction();
  }, [resetAccordionDataAction]);

  return {
    accordionData,
    setAccordionData,
    expandedAccordionIndex,
    setExpandedAccordionIndex,
    handleRemoveAccordion,
    handleAddAccordion,
    handleAccordionChange,
    resetAccordionData,
    initializeAccordionData,
    // Provide compatibility methods for existing components
    handleAccordionClick: setExpandedAccordionIndex,
    accordionMethods: {
      handleAccordionChange,
      handleAddAccordion,
      handleRemoveAccordion,
    }
  };
};
