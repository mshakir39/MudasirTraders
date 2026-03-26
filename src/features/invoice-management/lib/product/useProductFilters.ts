// src/features/invoice-management/lib/product/useProductFilters.ts
// Product filtering utilities hook

import { useCallback } from 'react';

export const useProductFilters = () => {
  // Filter series options based on stock availability
  const getFilteredSeriesOptions = useCallback(
    (selectedBrand: string, stock: any[], originalSeriesOptions: any[]) => {
      if (!selectedBrand) {
        return [];
      }

      // Ensure originalSeriesOptions is an array
      const safeOriginalSeriesOptions = Array.isArray(originalSeriesOptions)
        ? originalSeriesOptions
        : [];

      // Get series from stock data (only those with stock > 0)
      let stockSeriesOptions: any[] = [];
      if (stock) {
        const brandStock = stock.find(
          (stockItem) => stockItem.brandName === selectedBrand
        );

        if (brandStock && brandStock.seriesStock) {
          stockSeriesOptions = brandStock.seriesStock
            .filter((stockItem: any) => {
              const quantity = parseInt(stockItem.quantity || '0');
              return quantity > 0;
            })
            .map((stockItem: any) => ({
              name: stockItem.series,
              retailPrice: stockItem.retailPrice,
              maxRetailPrice: stockItem.maxRetailPrice,
              plate: stockItem.plate,
              ah: stockItem.ah,
            }));
        }
      }

      // Merge stock series with original series options
      const allSeriesOptions = [...stockSeriesOptions];

      // Add series from original options that aren't in stock
      safeOriginalSeriesOptions.forEach((originalSeries: any) => {
        const existsInStock = stockSeriesOptions.some(
          (stockSeries: any) => stockSeries.name === originalSeries.name
        );

        if (!existsInStock) {
          allSeriesOptions.push(originalSeries);
        }
      });

      return allSeriesOptions;
    },
    []
  );

  // Filter products by brand
  const filterProductsByBrand = useCallback(
    (products: any[], brandName: string) => {
      if (!brandName) return products;

      return products.filter((product) => product.brandName === brandName);
    },
    []
  );

  // Check if product is in stock
  const isProductInStock = useCallback(
    (brandName: string, seriesName: string, stock: any[]) => {
      if (!stock || !brandName || !seriesName) return false;

      const brandStock = stock.find((item) => item.brandName === brandName);
      if (!brandStock || !brandStock.seriesStock) return false;

      const seriesStock = brandStock.seriesStock.find(
        (item: any) => item.series === seriesName
      );

      return seriesStock && parseInt(seriesStock.quantity || '0') > 0;
    },
    []
  );

  return {
    getFilteredSeriesOptions,
    filterProductsByBrand,
    isProductInStock,
  };
};
