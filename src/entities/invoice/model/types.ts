// src/entities/invoice/model/types.ts
// Invoice entity types and interfaces

export interface InvoiceProduct {
  id?: string;
  brandName: string;
  series: string;
  quantity: number;
  productPrice: number;
  totalPrice: number;
  warrentyCode: string;
  warrentyStartDate: string;
  warrentyDuration: string;
  warrentyEndDate: string;
  noWarranty?: boolean;
  isChargingService?: boolean;
  isScrapBattery?: boolean;
  batteryDetails?: {
    name: string;
    plate: string | number;
    ah: number;
    type?: string;
    retailPrice?: number;
    salesTax?: number;
    maxRetailPrice?: number;
  };
}

export interface InvoicePayment {
  id?: string;
  addedDate: string; // ISO date string like "2026-03-14T14:37:50.387Z"
  amount: number; // Payment amount
  paymentMethod: string[]; // Array of payment methods like ['Cash']
  transactionId?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string; // 8-digit format like "00000001"
  customerName: string;
  customerAddress?: string;
  customerContactNumber: string;
  customerType?: 'WalkIn Customer' | 'Regular Customer';
  clientId?: string;
  products: InvoiceProduct[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  paymentMethod: string[];
  paymentStatus: 'pending' | 'paid' | 'partial';
  status: 'active' | 'voided' | 'deleted' | 'archived'; // ✅ Added 'voided'
  taxRate?: number; // Tax rate percentage
  useCustomDate?: boolean;
  customDate?: string;
  createdDate: Date;
  dueDate?: Date;
  additionalPayment?: InvoicePayment[];
  notes?: string;
  updatedAt?: Date;
  // Battery-related fields for Old Battery payment method
  batteriesRate?: number;
  batteriesCountAndWeight?: string;

  // NEW: Void/Replace fields
  voidedAt?: Date;
  voidReason?: string;
  voidedBy?: string;
  replacedBy?: string; // New invoice ID if this was voided
  replacesInvoice?: string; // Old invoice ID if this replaces another

  // NEW: Consolidation fields
  consolidatedFrom?: string[]; // Array of voided invoice IDs
  previousAmounts?: number[]; // Individual amounts from previous invoices (for audit trail)

  // Helper getters (can be calculated, no need to store)
  // consolidatedAmount = sum(previousAmounts)
  // newItemsAmount = totalAmount - sum(previousAmounts)
}

export interface InvoiceFilter {
  customer?: string;
  status?: string;
  paymentStatus?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  paymentMethod?: string;
  invoiceNo?: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  partialInvoices: number;
}

export interface InvoiceFormData {
  invoiceNo?: string;
  customerName: string;
  customerAddress?: string;
  customerContactNumber: string;
  customerType?: 'WalkIn Customer' | 'Regular Customer';
  clientId?: string;
  products: InvoiceProduct[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  paymentMethod: string[];
  paymentStatus: 'pending' | 'paid' | 'partial';
  useCustomDate?: boolean;
  customDate?: string;
  dueDate?: Date;
  notes?: string;
  isChargingService?: boolean;
  chargingServices?: any[];
  // Battery-related fields for Old Battery payment method
  batteriesCountAndWeight?: string;
  batteriesRate?: number;
}

export type InvoiceModalType =
  | 'create'
  | 'edit'
  | 'preview'
  | 'payment'
  | 'productDetail'
  | 'voidReplace';

export interface InvoiceModalState {
  isOpen: boolean;
  type: InvoiceModalType;
  data?: Invoice | Partial<Invoice>;
}

// NEW: Pending invoice detection
export interface PendingInvoice {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  remainingAmount: number; // Added to show actual remaining balance for partial invoices
  createdDate: Date;
  paymentStatus: 'pending' | 'paid' | 'partial';
}

// NEW: Consolidation request data
export interface ConsolidationRequest {
  customerId: string;
  customerName: string;
  newProducts: InvoiceProduct[];
  pendingInvoiceIds: string[];
  previousAmounts: number[]; // Individual amounts from previous invoices
  notes?: string;
}

// NEW: Consolidation result
export interface ConsolidationResult {
  success: boolean;
  newInvoice: Invoice;
  voidedInvoices: Invoice[];
  consolidatedCount: number;
  message?: string;
}

// NEW: Invoice transfer chain
export interface InvoiceTransferChain {
  chain: Invoice[];
  success: boolean;
}

// NEW: Helper functions for invoice calculations
export class InvoiceUtils {
  // Calculate consolidated amount from previous amounts
  static getConsolidatedAmount(invoice: Invoice): number {
    if (!invoice.previousAmounts || invoice.previousAmounts.length === 0) {
      return 0;
    }
    return invoice.previousAmounts.reduce((sum, amount) => sum + amount, 0);
  }

  // Calculate new items amount
  static getNewItemsAmount(invoice: Invoice): number {
    const consolidatedAmount = InvoiceUtils.getConsolidatedAmount(invoice);
    return invoice.totalAmount - consolidatedAmount;
  }

  // Check if invoice is consolidated
  static isConsolidated(invoice: Invoice): boolean {
    return !!(invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0);
  }

  // Get consolidation summary
  static getConsolidationSummary(invoice: Invoice) {
    if (!InvoiceUtils.isConsolidated(invoice)) {
      return null;
    }

    return {
      consolidatedAmount: InvoiceUtils.getConsolidatedAmount(invoice),
      newItemsAmount: InvoiceUtils.getNewItemsAmount(invoice),
      consolidatedCount: invoice.consolidatedFrom?.length || 0,
      previousAmounts: invoice.previousAmounts || [],
    };
  }
}

// Invoice creation form data structure (matches existing implementation)
export interface InvoiceCreationData {
  customerType: 'WalkIn Customer' | 'Regular Customer';
  customerName: string;
  customerAddress: string;
  customerContactNumber: string;
  clientName: string;
  customerId: string | null;
  receivedAmount: string;
  useCustomDate: boolean;
  customDate: string;
  // Accordion data for products
  [key: string]: any;
}

// Invoice validation result
export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Invoice statistics for dashboard
export interface InvoiceStats {
  today: {
    count: number;
    amount: number;
  };
  thisWeek: {
    count: number;
    amount: number;
  };
  thisMonth: {
    count: number;
    amount: number;
  };
  total: {
    count: number;
    amount: number;
  };
}
