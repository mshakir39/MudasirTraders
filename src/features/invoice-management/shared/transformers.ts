// src/features/invoice-management/shared/transformers.ts
// Data transformation utilities for invoices

export const transformAccordionData = (data: { [key: number]: any }): any[] => {
  return Object.values(data).map((item) => {
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
        : calculateEndDate(item.warrentyStartDate, item.warrentyDuration),
      totalPrice: Number(rest.productPrice) * Number(rest.quantity),
      batteryDetails,
    };
  });
};

export const calculateEndDate = (
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

export const calculateInvoiceTotals = (
  isChargingService: boolean,
  transformedProducts: any[],
  chargingServices: any[],
  taxAmount: number,
  receivedAmount: number
) => {
  if (isChargingService) {
    const subtotal = (chargingServices || []).reduce(
      (sum, service) => sum + (service.total || 0),
      0
    );
    const total = subtotal + (taxAmount || 0);
    return {
      subtotal,
      totalAmount: total,
      remainingAmount: Math.max(0, total - receivedAmount),
    };
  } else {
    const subtotal = (transformedProducts || []).reduce(
      (sum, product) => sum + (product.totalPrice || 0),
      0
    );
    const total = subtotal + (taxAmount || 0);
    return {
      subtotal,
      totalAmount: total,
      remainingAmount: Math.max(0, total - receivedAmount),
    };
  }
};
