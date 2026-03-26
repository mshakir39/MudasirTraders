// src/utils/invoiceCalculations.ts
// Invoice calculation utilities for consistent amount calculations

export interface InvoiceCalculationData {
  previousAmounts?: number[];
  newProducts?: Array<{
    totalPrice: number;
    quantity?: number;
    isChargingService?: boolean;
    isScrapBattery?: boolean;
  }>;
  batteriesRate?: number;
  receivedAmount?: number;
  pendingInvoices?: Array<{
    remainingAmount: number;
    totalAmount: number;
    receivedAmount: number;
  }>;
}

export interface InvoiceCalculationResult {
  consolidatedAmount: number;
  newItemsAmount: number;
  batteriesAmount: number;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  breakdown: {
    previousAmounts: number[];
    newProductsTotal: number;
    batteryRate: number;
    receivedAmount: number;
  };
}

/**
 * Calculate invoice totals and remaining amounts consistently
 * Used for both normal and consolidated invoices
 */
export function calculateInvoiceAmounts(data: InvoiceCalculationData): InvoiceCalculationResult {
  // 1. Calculate consolidated amount from pending invoices
  let consolidatedAmount = 0;
  let actualRemainingAmounts: number[] = [];

  if (data.pendingInvoices && data.pendingInvoices.length > 0) {
    // Use actual remaining amounts from pending invoices
    actualRemainingAmounts = data.pendingInvoices.map(inv => inv.remainingAmount || 0);
    consolidatedAmount = actualRemainingAmounts.reduce((sum, amount) => sum + amount, 0);
  } else if (data.previousAmounts && data.previousAmounts.length > 0) {
    // Fallback to provided previous amounts
    consolidatedAmount = data.previousAmounts.reduce((sum, amount) => sum + amount, 0);
    actualRemainingAmounts = data.previousAmounts;
  }

  // 2. Calculate new items amount (exclude services and scrap batteries)
  let newItemsAmount = 0;
  if (data.newProducts && data.newProducts.length > 0) {
    newItemsAmount = data.newProducts.reduce((sum, product) => {
      // Skip charging services and scrap batteries in amount calculation
      if (product.isChargingService || product.isScrapBattery) {
        return sum;
      }
      return sum + (product.totalPrice || 0);
    }, 0);
  }

  // 3. Battery rate amount (this is a deduction)
  const batteriesAmount = data.batteriesRate || 0;

  // 4. Calculate total amount (subtotal + previous amounts only)
  const totalAmount = consolidatedAmount + newItemsAmount;

  // 5. Calculate received amount
  const receivedAmount = data.receivedAmount || 0;

  // 6. Calculate remaining amount (deduct received amount and battery rate)
  const remainingAmount = totalAmount - receivedAmount - batteriesAmount;

  // 7. Determine payment status
  let paymentStatus: 'pending' | 'partial' | 'paid';
  if (receivedAmount >= totalAmount) {
    paymentStatus = 'paid';
  } else if (receivedAmount > 0) {
    paymentStatus = 'partial';
  } else {
    paymentStatus = 'pending';
  }

  return {
    consolidatedAmount,
    newItemsAmount,
    batteriesAmount,
    totalAmount,
    receivedAmount,
    remainingAmount,
    paymentStatus,
    breakdown: {
      previousAmounts: actualRemainingAmounts,
      newProductsTotal: newItemsAmount,
      batteryRate: batteriesAmount,
      receivedAmount: receivedAmount,
    }
  };
}

/**
 * Calculate normal invoice amounts (no consolidation)
 */
export function calculateNormalInvoiceAmounts(
  products: Array<{
    totalPrice: number;
    isChargingService?: boolean;
    isScrapBattery?: boolean;
  }>,
  batteriesRate?: number,
  receivedAmount?: number
): InvoiceCalculationResult {
  // Calculate products amount (exclude services and scrap batteries)
  const productsAmount = products.reduce((sum, product) => {
    if (product.isChargingService || product.isScrapBattery) {
      return sum;
    }
    return sum + (product.totalPrice || 0);
  }, 0);

  return calculateInvoiceAmounts({
    newProducts: products,
    batteriesRate,
    receivedAmount,
  });
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Validate calculation data
 */
export function validateCalculationData(data: InvoiceCalculationData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if we have either pendingInvoices or previousAmounts for consolidation
  if (!data.pendingInvoices && !data.previousAmounts) {
    // This is fine for normal invoices
  }

  // Validate products
  if (data.newProducts) {
    data.newProducts.forEach((product, index) => {
      if (product.totalPrice && product.totalPrice < 0) {
        errors.push(`Product ${index + 1}: Total price cannot be negative`);
      }
      if (product.quantity && product.quantity < 0) {
        errors.push(`Product ${index + 1}: Quantity cannot be negative`);
      }
    });
  }

  // Validate battery rate
  if (data.batteriesRate && data.batteriesRate < 0) {
    errors.push('Battery rate cannot be negative');
  }

  // Validate received amount
  if (data.receivedAmount && data.receivedAmount < 0) {
    errors.push('Received amount cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
