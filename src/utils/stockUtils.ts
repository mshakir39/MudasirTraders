/**
 * Utility functions for handling stock data and ensuring consistent data types
 */

/**
 * Normalizes inStock values to ensure they are always numbers
 * @param value - The inStock value (can be string or number)
 * @returns A number representing the stock quantity
 */

import { ICategory } from '../interfaces';
import { BatteryDetails, StockBatteryData } from '../interfaces';

export const normalizeInStock = (
  value: string | number | null | undefined
): number => {
  if (value === null || value === undefined) return 0;
  const parsed = parseInt(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Normalizes stock data to ensure consistent data types
 * @param stockData - The stock data array
 * @returns Normalized stock data with consistent inStock types
 */
export const normalizeStockData = (stockData: any[]): any[] => {
  if (!Array.isArray(stockData)) return [];

  return stockData.map((brand) => ({
    ...brand,
    seriesStock: Array.isArray(brand.seriesStock)
      ? brand.seriesStock.map((series: any) => ({
          ...series,
          inStock: normalizeInStock(series.inStock),
          soldCount: normalizeInStock(series.soldCount),
        }))
      : [],
  }));
};

/**
 * Validates if a stock item has sufficient quantity
 * @param stockItem - The stock item to validate
 * @param requiredQuantity - The quantity needed
 * @returns Object with isValid boolean and available quantity
 */
export const validateStockQuantity = (
  stockItem: any,
  requiredQuantity: number
): { isValid: boolean; available: number; message?: string } => {
  const available = normalizeInStock(stockItem?.inStock);

  if (available === 0) {
    return {
      isValid: false,
      available,
      message: `Stock for '${stockItem?.series || 'this item'}' is depleted.`,
    };
  }

  if (requiredQuantity > available) {
    return {
      isValid: false,
      available,
      message: `Insufficient stock. Available: ${available}, Required: ${requiredQuantity}`,
    };
  }

  return {
    isValid: true,
    available,
  };
};

/**
 * Formats stock quantity for display
 * @param value - The stock quantity value
 * @returns Formatted string for display
 */
export const formatStockQuantity = (value: string | number): string => {
  const quantity = normalizeInStock(value);
  return quantity.toLocaleString();
};

export function transformStockData(
  stockItem: StockBatteryData,
  categoryData: ICategory,
  index: number
): StockBatteryData {
  const isBatteryDetails = (obj: any): obj is BatteryDetails =>
    obj &&
    typeof obj === 'object' &&
    'name' in obj &&
    'plate' in obj &&
    'ah' in obj;

  const series = categoryData.series.find(
    (s) => isBatteryDetails(s) && s.name === stockItem.series
  );

  return {
    ...stockItem,
    batteryDetails: isBatteryDetails(series) ? series : undefined,
    updatedDate: stockItem.updatedDate || new Date().toISOString(),
  };
}

export function getMaxRetailPrice(
  categories: ICategory[],
  brandName: string,
  seriesName: string
): { maxRetailPrice: number | string; salesTax: number } {
  const category = categories.find((cat) => cat.brandName === brandName);
  if (!category) return { maxRetailPrice: 'N/A', salesTax: 0 };

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[\/\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  let series = category.series.find((s) => s.name === seriesName);
  if (!series) {
    series = category.series.find(
      (s) => normalize(seriesName) === normalize(s.name)
    );
  }

  if (!series?.maxRetailPrice && series?.retailPrice && category.salesTax) {
    return {
      maxRetailPrice: series.retailPrice * (1 + category.salesTax / 100),
      salesTax: category.salesTax || 0,
    };
  }

  return {
    maxRetailPrice: series?.maxRetailPrice || 'N/A',
    salesTax: category.salesTax || 0,
  };
}

export function calculateStockCost(seriesStock: StockBatteryData[]): number {
  return seriesStock.reduce((total, item) => {
    return (
      total + (Number(item.productCost) || 0) * (Number(item.inStock) || 0)
    );
  }, 0);
}

/**
 * Validates and normalizes stock data for multiple products
 * @param stock - The stock data array
 * @param productDetails - The product details to validate against
 * @returns Object with isValid boolean and array of error messages
 */
export function validateAndNormalizeStock(
  stock: any[],
  productDetails: any[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(stock)) {
    errors.push('Stock data is not available');
    return { isValid: false, errors };
  }

  if (!Array.isArray(productDetails)) {
    errors.push('Product details are not valid');
    return { isValid: false, errors };
  }

  for (const product of productDetails) {
    const seriesName = product.batteryDetails?.name || product.series;
    const requiredQuantity = parseInt(product.quantity) || 0;

    if (requiredQuantity <= 0) {
      errors.push(`Invalid quantity for ${seriesName}: ${requiredQuantity}`);
      continue;
    }

    // Find the stock item for this series
    let stockItem: any = null;
    for (const brandStock of stock) {
      if (Array.isArray(brandStock.seriesStock)) {
        stockItem = brandStock.seriesStock.find(
          (item: any) => item.series === seriesName
        );
        if (stockItem) break;
      }
    }

    if (!stockItem) {
      errors.push(`Series '${seriesName}' not found in stock`);
      continue;
    }

    const availableStock = normalizeInStock(stockItem.inStock);

    if (availableStock === 0) {
      errors.push(`Stock for '${seriesName}' is depleted`);
    } else if (requiredQuantity > availableStock) {
      errors.push(
        `Insufficient stock for ${seriesName}. Available: ${availableStock}, Required: ${requiredQuantity}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
