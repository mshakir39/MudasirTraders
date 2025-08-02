/**
 * Utility functions for handling stock data and ensuring consistent data types
 */

/**
 * Normalizes inStock values to ensure they are always numbers
 * @param value - The inStock value (can be string or number)
 * @returns A number representing the stock quantity
 */
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
