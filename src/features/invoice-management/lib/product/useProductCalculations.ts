// src/features/invoice-management/lib/product/useProductCalculations.ts
// Product calculation utilities hook

import { useCallback } from 'react';

export const useProductCalculations = () => {
  // Calculate total price for a product
  const calculateTotalPrice = useCallback((price: number, quantity: number) => {
    return price * quantity;
  }, []);

  // Calculate warranty end date
  const calculateWarrantyEndDate = useCallback(
    (startDate: string, months: number) => {
      if (!startDate || isNaN(new Date(startDate).getTime()) || months <= 0) {
        return '';
      }

      const date = new Date(startDate);
      date.setMonth(date.getMonth() + months);
      return date.toISOString().split('T')[0];
    },
    []
  );

  // Format price for display
  const formatPrice = useCallback((price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) || 0 : price;
    return numPrice.toLocaleString();
  }, []);

  // Validate price input
  const validatePrice = useCallback((price: string) => {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice >= 0;
  }, []);

  // Validate quantity input
  const validateQuantity = useCallback((quantity: string) => {
    const numQuantity = parseInt(quantity);
    return !isNaN(numQuantity) && numQuantity > 0;
  }, []);

  return {
    calculateTotalPrice,
    calculateWarrantyEndDate,
    formatPrice,
    validatePrice,
    validateQuantity,
  };
};
