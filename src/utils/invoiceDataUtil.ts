/**
 * Invoice Data Utility
 *
 * Centralized utility for invoice data validation, calculation, and processing
 * Used across all invoice operations to ensure consistency
 */

import { Invoice, InvoiceProduct } from '@/entities/invoice/model/types';

export interface InvoiceCalculationResult {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: Partial<Invoice>;
}

export interface StockImpact {
  brandName: string;
  series: string;
  quantity: number;
  operation: 'deduct' | 'add' | 'revert';
  isChargingService: boolean;
}

export interface InvoiceStockAnalysis {
  totalStockImpact: StockImpact[];
  requiresStockUpdate: boolean;
  chargingServiceCount: number;
  physicalProductCount: number;
}

export class InvoiceDataUtil {
  /**
   * Calculate all amount-related fields for an invoice
   */
  static calculateAmounts(
    products: InvoiceProduct[],
    receivedAmount?: number,
    taxRate: number = 0
  ): InvoiceCalculationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate products
    if (!products || !Array.isArray(products)) {
      errors.push('Products array is required');
      return {
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        receivedAmount: receivedAmount || 0,
        remainingAmount: 0,
        isValid: false,
        errors,
        warnings,
      };
    }

    if (products.length === 0) {
      warnings.push('No products in invoice');
    }

    // Calculate subtotal
    const subtotal = products.reduce((sum, product) => {
      const productTotal = this.calculateProductTotal(product);

      if (productTotal <= 0) {
        warnings.push(
          `Product ${product.brandName} ${product.series} has zero or negative total`
        );
      }

      return sum + productTotal;
    }, 0);

    // Calculate tax amount
    const taxAmount = subtotal * (taxRate / 100);

    // Calculate total amount
    const totalAmount = subtotal + taxAmount;

    // Validate received amount
    const finalReceivedAmount = receivedAmount || 0;
    if (finalReceivedAmount < 0) {
      errors.push('Received amount cannot be negative');
    }

    // Calculate remaining amount
    const remainingAmount = totalAmount - finalReceivedAmount;

    // Check for negative remaining amount (overpayment)
    if (remainingAmount < 0) {
      warnings.push(
        `Overpayment detected: Rs ${Math.abs(remainingAmount).toLocaleString()}`
      );
    }

    const isValid = errors.length === 0;

    return {
      subtotal,
      taxAmount,
      totalAmount,
      receivedAmount: finalReceivedAmount,
      remainingAmount,
      isValid,
      errors,
      warnings,
    };
  }

  /**
   * Calculate total amount for a single product
   */
  static calculateProductTotal(product: InvoiceProduct): number {
    const quantity = this.parseQuantity(product.quantity);
    const price = parseFloat(String(product.productPrice || 0));

    if (quantity <= 0 || price <= 0) {
      return 0;
    }

    return quantity * price;
  }

  /**
   * Parse quantity from various formats to number
   */
  static parseQuantity(quantity: any): number {
    if (typeof quantity === 'number') {
      return quantity;
    }

    if (typeof quantity === 'string') {
      const parsed = parseInt(quantity, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  /**
   * Validate invoice data and clean it
   */
  static validateInvoice(data: Partial<Invoice>): InvoiceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedData: Partial<Invoice> = {};

    // Validate customer name
    if (!data.customerName || data.customerName.trim() === '') {
      errors.push('Customer name is required');
    } else {
      cleanedData.customerName = data.customerName.trim();
    }

    // Validate customer contact number
    if (
      !data.customerContactNumber ||
      data.customerContactNumber.trim() === ''
    ) {
      errors.push('Customer contact number is required');
    } else {
      cleanedData.customerContactNumber = data.customerContactNumber.trim();
    }

    // Validate customer address
    if (!data.customerAddress || data.customerAddress.trim() === '') {
      errors.push('Customer address is required');
    } else {
      cleanedData.customerAddress = data.customerAddress.trim();
    }

    // Validate products
    if (!data.products || !Array.isArray(data.products)) {
      errors.push('Products array is required');
    } else if (data.products.length === 0) {
      warnings.push('No products in invoice');
    } else {
      // Transform and validate each product
      const transformedProducts = data.products
        .map((product) => {
          if (!product.brandName || !product.series) {
            errors.push(
              `Product missing brand or series: ${JSON.stringify(product)}`
            );
            return null;
          }

          const quantity = this.parseQuantity(product.quantity);
          if (quantity <= 0) {
            warnings.push(
              `Product ${product.brandName} ${product.series} has invalid quantity: ${product.quantity}`
            );
            return null;
          }

          const price = parseFloat(String(product.productPrice || 0));
          if (price <= 0) {
            warnings.push(
              `Product ${product.brandName} ${product.series} has invalid price: ${product.productPrice}`
            );
            return null;
          }

          // Return transformed product with number quantity
          return {
            ...product,
            quantity: quantity,
            productPrice: price,
            totalPrice: price * quantity,
          };
        })
        .filter((product) => product !== null);

      cleanedData.products = transformedProducts;
    }

    // Validate payment method (with consolidation logic)
    if (
      !data.paymentMethod ||
      !Array.isArray(data.paymentMethod) ||
      data.paymentMethod.length === 0
    ) {
      if (
        data.receivedAmount === 0 &&
        data.remainingAmount &&
        data.remainingAmount > 0
      ) {
        // This is likely a consolidation scenario - default to Cash
        warnings.push(
          'No payment method specified for consolidation, defaulting to Cash'
        );
        cleanedData.paymentMethod = ['Cash'];
      } else {
        warnings.push('No payment method specified, defaulting to Cash');
        cleanedData.paymentMethod = ['Cash'];
      }
    } else {
      cleanedData.paymentMethod = data.paymentMethod;
    }

    // Calculate amounts if products are valid
    if (cleanedData.products && cleanedData.products.length > 0) {
      const calculation = this.calculateAmounts(
        cleanedData.products,
        data.receivedAmount,
        data.taxRate
      );

      if (!calculation.isValid) {
        errors.push(...calculation.errors);
      }

      cleanedData.subtotal = calculation.subtotal;
      cleanedData.taxAmount = calculation.taxAmount;
      cleanedData.totalAmount = calculation.totalAmount;
      cleanedData.receivedAmount = calculation.receivedAmount;
      cleanedData.remainingAmount = calculation.remainingAmount;

      warnings.push(...calculation.warnings);
    }

    // Set default values
    cleanedData.createdDate = data.createdDate || new Date();
    cleanedData.status = data.status || 'active';

    // Special handling for consolidation scenarios
    if (
      data.receivedAmount === 0 &&
      data.remainingAmount &&
      data.remainingAmount > 0
    ) {
      // This is likely a consolidation - payment status should be pending
      cleanedData.paymentStatus = 'pending';
      warnings.push(
        'Detected consolidation scenario - payment status set to pending'
      );
    } else {
      cleanedData.paymentStatus = this.determinePaymentStatus(
        cleanedData.totalAmount || 0,
        cleanedData.receivedAmount || 0
      );
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      cleanedData: isValid ? cleanedData : undefined,
    };
  }

  /**
   * Determine payment status based on amounts
   */
  static determinePaymentStatus(
    totalAmount: number,
    receivedAmount: number
  ): 'paid' | 'partial' | 'pending' {
    if (!totalAmount || totalAmount <= 0) {
      return 'pending';
    }

    if (!receivedAmount || receivedAmount <= 0) {
      return 'pending';
    }

    if (receivedAmount >= totalAmount) {
      return 'paid';
    }

    return 'partial';
  }

  /**
   * Analyze stock impact of an invoice
   */
  static analyzeStockImpact(products: InvoiceProduct[]): InvoiceStockAnalysis {
    if (!products || !Array.isArray(products)) {
      return {
        totalStockImpact: [],
        requiresStockUpdate: false,
        chargingServiceCount: 0,
        physicalProductCount: 0,
      };
    }

    const stockImpact: StockImpact[] = [];
    let chargingServiceCount = 0;
    let physicalProductCount = 0;

    products.forEach((product) => {
      const quantity = this.parseQuantity(product.quantity);
      const isChargingService = product.isChargingService || false;

      if (isChargingService) {
        chargingServiceCount++;
        // Charging services don't affect physical stock
        return;
      }

      if (quantity <= 0) {
        return; // Skip products with invalid quantity
      }

      physicalProductCount++;

      stockImpact.push({
        brandName: product.brandName,
        series: product.series,
        quantity,
        operation: 'deduct', // Default operation for sales
        isChargingService,
      });
    });

    return {
      totalStockImpact: stockImpact,
      requiresStockUpdate: stockImpact.length > 0,
      chargingServiceCount,
      physicalProductCount,
    };
  }

  /**
   * Get products that require stock updates
   */
  static getStockRelevantProducts(
    products: InvoiceProduct[]
  ): InvoiceProduct[] {
    if (!products || !Array.isArray(products)) {
      return [];
    }

    return products.filter((product) => {
      const quantity = this.parseQuantity(product.quantity);
      const isChargingService = product.isChargingService || false;

      return !isChargingService && quantity > 0;
    });
  }

  /**
   * Calculate totals for consolidation
   */
  static calculateConsolidationTotals(
    pendingInvoices: Invoice[],
    newProducts: InvoiceProduct[]
  ): {
    pendingTotal: number;
    newProductsTotal: number;
    grandTotal: number;
    consolidatedFrom: string[];
    previousAmounts: number[];
  } {
    const pendingTotal = pendingInvoices.reduce((sum, invoice) => {
      const amount = invoice.remainingAmount || invoice.totalAmount || 0;
      return sum + amount;
    }, 0);

    const newProductsTotal = newProducts.reduce((sum, product) => {
      return sum + this.calculateProductTotal(product);
    }, 0);

    const grandTotal = pendingTotal + newProductsTotal;

    return {
      pendingTotal,
      newProductsTotal,
      grandTotal,
      consolidatedFrom: pendingInvoices.map((inv) => inv.id || ''),
      previousAmounts: pendingInvoices.map(
        (inv) => inv.remainingAmount || inv.totalAmount || 0
      ),
    };
  }

  /**
   * Check if invoice should be included in pending list
   */
  static shouldIncludeInPending(invoice: Invoice): boolean {
    // Skip voided invoices
    if (invoice.status === 'voided') {
      return false;
    }

    // Include pending invoices regardless of amount
    if (invoice.paymentStatus === 'pending') {
      return true;
    }

    // For partial invoices, only include if remaining amount > 0
    if (invoice.paymentStatus === 'partial') {
      const remainingAmount = invoice.remainingAmount || 0;
      return remainingAmount > 0;
    }

    return false;
  }

  /**
   * Generate invoice summary for display
   */
  static generateInvoiceSummary(invoice: Invoice): {
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    remainingAmount: number;
    status: string;
    paymentStatus: string;
    productCount: number;
    hasChargingServices: boolean;
    createdDate: Date;
  } {
    const hasChargingServices =
      invoice.products?.some((p) => p.isChargingService) || false;

    return {
      invoiceNumber: invoice.invoiceNo || 'N/A',
      customerName: invoice.customerName || 'Unknown',
      totalAmount: invoice.totalAmount || 0,
      remainingAmount: invoice.remainingAmount || 0,
      status: invoice.status || 'unknown',
      paymentStatus: invoice.paymentStatus || 'unknown',
      productCount: invoice.products?.length || 0,
      hasChargingServices,
      createdDate: invoice.createdDate || new Date(),
    };
  }

  /**
   * Clean and normalize product data
   */
  static normalizeProduct(product: any): InvoiceProduct {
    return {
      brandName: String(product.brandName || '').trim(),
      series: String(product.series || '').trim(),
      quantity: this.parseQuantity(product.quantity),
      productPrice: parseFloat(String(product.productPrice || 0)),
      totalPrice: this.calculateProductTotal(product),
      isChargingService: Boolean(product.isChargingService),
      isScrapBattery: Boolean(product.isScrapBattery),
      warrentyCode: product.warrentyCode || 'No Warranty',
      warrentyStartDate: product.warrentyStartDate || null,
      warrentyEndDate: product.warrentyEndDate || null,
      warrentyDuration: product.warrentyDuration || null,
    };
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: number): string {
    return `Rs ${amount.toLocaleString()}`;
  }

  /**
   * Check if invoice has zero total amount (data issue)
   */
  static hasZeroTotalIssue(invoice: Invoice): boolean {
    const calculatedTotal =
      invoice.products?.reduce((sum, product) => {
        return sum + this.calculateProductTotal(product);
      }, 0) || 0;

    return (invoice.totalAmount || 0) === 0 && calculatedTotal > 0;
  }

  /**
   * Fix zero total amount issue
   */
  static fixZeroTotalAmount(invoice: Invoice): Invoice {
    const calculatedTotal =
      invoice.products?.reduce((sum, product) => {
        return sum + this.calculateProductTotal(product);
      }, 0) || 0;

    if (calculatedTotal > 0 && (invoice.totalAmount || 0) === 0) {
      return {
        ...invoice,
        totalAmount: calculatedTotal,
        remainingAmount: calculatedTotal - (invoice.receivedAmount || 0),
      };
    }

    return invoice;
  }
}

export default InvoiceDataUtil;
