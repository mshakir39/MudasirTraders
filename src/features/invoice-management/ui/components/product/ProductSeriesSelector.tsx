// src/features/invoice-management/ui/components/product/ProductSeriesSelector.tsx
// Product series selector component - <80 lines (includes all original functionality)

'use client';

import React from 'react';
import SeriesAutocomplete from '@/components/SeriesAutocomplete';
import { normalizeInStock } from '@/utils/stockUtils';
import { IBatterySeries } from '@/interfaces';

interface ProductSeriesSelectorProps {
  series: string;
  onSeriesChange: (series: string, seriesData: any) => void;
  seriesOptions: any[];
  selectedBrand: string;
  categories: any[];
  stock: any[];
  disabled?: boolean;
}

export const ProductSeriesSelector: React.FC<ProductSeriesSelectorProps> = ({
  series,
  onSeriesChange,
  seriesOptions,
  selectedBrand,
  categories,
  stock,
  disabled = false
}) => {
  // Function to filter series options based on stock availability (from original ProductSection)
  const getFilteredSeriesOptions = React.useCallback(() => {
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
                .replace(/[^a-z0-9]/g, '')
                .replace(/\s+/g, '');

            const normalizedStockName = normalize(opt.value);
            const normalizedBatteryName = normalize(battery.name);

            return normalizedStockName === normalizedBatteryName;
          });

          return stockItem && stockItem.stockQuantity > 0;
        })
        .map((battery: any) => ({
          label: battery.name,
          value: battery.name,
          batteryDetails: battery.batteryDetails || null,
          retailPrice: battery.retailPrice,
          maxRetailPrice: battery.maxRetailPrice,
          plate: battery.plate,
          ah: battery.ah,
        }));
    }

    // Merge stock series with category series, removing duplicates
    const allSeriesOptions = [...stockSeriesOptions];

    // Add series from category that aren't in stock series
    categorySeriesOptions.forEach((categorySeries: any) => {
      const existsInStock = stockSeriesOptions.some(
        (stockSeries: any) => stockSeries.value === categorySeries.value
      );
      
      if (!existsInStock) {
        allSeriesOptions.push(categorySeries);
      }
    });

    return allSeriesOptions;
  }, [selectedBrand, stock, categories]);

  const filteredSeriesOptions = getFilteredSeriesOptions();

  // Convert to IBatterySeries format for SeriesAutocomplete
  const seriesData: IBatterySeries[] = filteredSeriesOptions.map(option => {
    // Get data from categories since batteryDetails is null
    const category = categories.find(cat => cat.brandName === selectedBrand);
    const categorySeries = category?.series?.find((s: IBatterySeries) => s.name === (option.value || option.label));
    
    // Extract numeric values from the data structure
    const plate = option.plate || option.batteryDetails?.plate || categorySeries?.plate || 0;
    const ah = option.ah || option.batteryDetails?.ah || categorySeries?.ah || 0;
    const retailPrice = option.retailPrice || option.batteryDetails?.retailPrice || categorySeries?.retailPrice || 0;
    const maxRetailPrice = option.maxRetailPrice || option.batteryDetails?.maxRetailPrice || categorySeries?.maxRetailPrice || 0;
    const salesTax = option.salesTax || option.batteryDetails?.salesTax || categorySeries?.salesTax || 0;
    const type = option.type || option.batteryDetails?.type || categorySeries?.type;
    
    const converted = {
      name: option.value || option.label,
      plate: typeof plate === 'string' ? parseInt(plate) : plate || 0,
      ah: typeof ah === 'string' ? parseInt(ah) : ah || 0,
      type: type,
      retailPrice: typeof retailPrice === 'string' ? parseFloat(retailPrice) : retailPrice || 0,
      salesTax: typeof salesTax === 'string' ? parseFloat(salesTax) : salesTax || 0,
      maxRetailPrice: typeof maxRetailPrice === 'string' ? parseFloat(maxRetailPrice) : maxRetailPrice || 0,
    };
    
    return converted;
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Series *
      </label>
      <SeriesAutocomplete
        series={seriesData}
        value={series}
        onChange={(value) => {
          const selectedSeries = seriesData.find(s => s.name === value);
          onSeriesChange(value, selectedSeries);
        }}
        placeholder="Search series..."
        disabled={disabled}
        className="w-full"
        showPrices={true}
      />
    </div>
  );
};
