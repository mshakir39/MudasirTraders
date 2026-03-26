// src/features/invoice-management/lib/product/useProductValidation.ts
// Product validation utilities hook

import { useCallback } from 'react';

export const useProductValidation = () => {
  // Validate complete product data
  const validateProductData = useCallback((productData: any) => {
    const errors: string[] = [];

    // Required fields validation
    if (!productData.brandName?.trim()) {
      errors.push('Brand is required');
    }

    if (!productData.series?.trim()) {
      errors.push('Series is required');
    }

    if (!productData.productPrice || parseFloat(productData.productPrice) <= 0) {
      errors.push('Valid product price is required');
    }

    if (!productData.quantity || parseInt(productData.quantity) <= 0) {
      errors.push('Valid quantity is required');
    }

    // Warranty validation (if not no warranty)
    if (!productData.noWarranty) {
      if (!productData.warrentyStartDate?.trim()) {
        errors.push('Warranty start date is required');
      }

      if (!productData.warrentyDuration?.trim()) {
        errors.push('Warranty duration is required');
      }

      if (!productData.warrentyCode?.trim()) {
        errors.push('Warranty code is required');
      }

      // Validate warranty duration range
      const duration = parseInt(productData.warrentyDuration);
      if (duration < 0 || duration > 120) {
        errors.push('Warranty duration must be between 0 and 120 months');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Validate brand selection
  const validateBrand = useCallback((brandName: string) => {
    return brandName?.trim().length > 0;
  }, []);

  // Validate series selection
  const validateSeries = useCallback((series: string) => {
    return series?.trim().length > 0;
  }, []);

  // Validate price
  const validatePrice = useCallback((price: string) => {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice > 0;
  }, []);

  // Validate quantity
  const validateQuantity = useCallback((quantity: string) => {
    const numQuantity = parseInt(quantity);
    return !isNaN(numQuantity) && numQuantity > 0;
  }, []);

  // Validate warranty code
  const validateWarrantyCode = useCallback((code: string) => {
    return code?.trim().length > 0;
  }, []);

  return {
    validateProductData,
    validateBrand,
    validateSeries,
    validatePrice,
    validateQuantity,
    validateWarrantyCode,
  };
};
