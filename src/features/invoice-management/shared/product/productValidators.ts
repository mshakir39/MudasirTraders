// src/features/invoice-management/ui/shared/product/productValidators.ts
// Product validation utilities

export const isValidPrice = (price: string | number): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

export const isValidQuantity = (quantity: string | number): boolean => {
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity;
  return !isNaN(numQuantity) && numQuantity > 0;
};

export const isValidWarrantyDuration = (duration: string | number): boolean => {
  const numDuration = typeof duration === 'string' ? parseInt(duration) : duration;
  return !isNaN(numDuration) && numDuration >= 0 && numDuration <= 120;
};

export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const hasRequiredFields = (product: any): boolean => {
  return !!(
    product.brandName?.trim() &&
    product.series?.trim() &&
    product.productPrice &&
    product.quantity &&
    isValidPrice(product.productPrice) &&
    isValidQuantity(product.quantity)
  );
};

export const hasValidWarranty = (product: any): boolean => {
  if (product.noWarranty) return true;
  
  return !!(
    product.warrentyStartDate?.trim() &&
    product.warrentyDuration?.trim() &&
    product.warrentyCode?.trim() &&
    isValidDate(product.warrentyStartDate) &&
    isValidWarrantyDuration(product.warrentyDuration)
  );
};

export const validateProductForSubmission = (product: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!product.brandName?.trim()) {
    errors.push('Brand is required');
  }

  if (!product.series?.trim()) {
    errors.push('Series is required');
  }

  if (!isValidPrice(product.productPrice)) {
    errors.push('Valid product price is required');
  }

  if (!isValidQuantity(product.quantity)) {
    errors.push('Valid quantity is required');
  }

  if (!hasValidWarranty(product)) {
    if (!product.noWarranty) {
      // Only show warranty errors if warranty is enabled
      if (!product.warrentyStartDate?.trim()) {
        errors.push('Warranty start date is required');
      }
      if (!product.warrentyDuration?.trim()) {
        errors.push('Warranty duration is required');
      }
      if (!product.warrentyCode?.trim()) {
        errors.push('Warranty code is required');
      }
    }
    // If noWarranty is true, skip all warranty validation
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
