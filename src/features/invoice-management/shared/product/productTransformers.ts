// src/features/invoice-management/ui/shared/product/productTransformers.ts
// Product data transformation utilities

export const transformProductData = (accordionData: {
  [key: number]: any;
}): any[] => {
  return Object.values(accordionData).map((item) => {
    const {
      seriesOption,
      batteryDetails,
      warrentyStartDate,
      warrentyDuration,
      noWarranty,
      ...rest
    } = item;

    return {
      ...rest,
      warrentyStartDate: noWarranty ? '' : warrentyStartDate,
      warrentyDuration: noWarranty ? '0' : warrentyDuration,
      warrentyCode: noWarranty ? 'No Warranty' : item.warrentyCode,
      warrantyEndDate: noWarranty
        ? ''
        : calculateWarrantyEndDate(
            item.warrentyStartDate,
            item.warrentyDuration
          ),
      totalPrice: Number(rest.productPrice) * Number(rest.quantity),
      batteryDetails,
    };
  });
};

export const calculateWarrantyEndDate = (
  startDate: string,
  months: number | string
): string => {
  if (!startDate || isNaN(new Date(startDate).getTime())) {
    return '';
  }

  const monthsValue = parseInt(String(months));
  if (isNaN(monthsValue) || monthsValue <= 0) {
    return '';
  }

  const date = new Date(startDate);
  date.setMonth(date.getMonth() + monthsValue);
  return date.toISOString().split('T')[0];
};

export const normalizeProductData = (product: any) => {
  return {
    brandName: product.brandName || '',
    series: product.series || '',
    productPrice: product.productPrice || '0',
    quantity: product.quantity || '1',
    totalPrice: product.totalPrice || 0,
    warrentyStartDate: product.warrentyStartDate || '',
    warrentyDuration: product.warrentyDuration || '0',
    warrentyCode: product.warrentyCode || '',
    noWarranty: product.noWarranty || false,
    batteryDetails: product.batteryDetails || '',
  };
};

export const calculateProductSubtotal = (products: any[]) => {
  return products.reduce((sum, product) => {
    const price = parseFloat(product.productPrice) || 0;
    const quantity = parseInt(product.quantity) || 0;
    return sum + price * quantity;
  }, 0);
};

export const formatProductForDisplay = (product: any) => {
  return {
    ...product,
    displayPrice: `Rs ${parseFloat(product.productPrice || 0).toLocaleString()}`,
    displayTotal: `Rs ${parseFloat(product.totalPrice || 0).toLocaleString()}`,
    displayWarranty: product.noWarranty
      ? 'No Warranty'
      : `${product.warrentyDuration} months`,
  };
};
