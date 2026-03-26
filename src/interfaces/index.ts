import { IDropdownOption } from '../../interfaces';

export interface IBrand {
  id?: string;
  brandName: string;
}

export interface IBatterySeries {
  name: string;
  plate: string | number;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
  batteryType?: 'battery' | 'tonic'; // Track the battery type
}

export interface ICategory {
  id?: string;
  brandName: string;
  series: IBatterySeries[];
  salesTax: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
}

// ... rest of the interfaces ...

export interface BatteryDetails {
  name: string;
  plate: string | number | null;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

export interface StockBatteryData {
  series: string;
  productCost: string | number;
  inStock: string | number;
  updatedDate?: string;
  batteryDetails?: BatteryDetails;
  soldCount?: number;
  brandName: string;
}

export interface StockData {
  id?: number;
  brandName: string;
  seriesStock: StockBatteryData[];
}

export interface SeriesOption extends IDropdownOption {
  batteryDetails?: BatteryDetails;
}

export interface EditData {
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
}

export interface FormStockData {
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
  batteryDetails?: BatteryDetails;
}

export interface DeleteStockParams {
  brandName: string;
  series: string;
  seriesName: string;
}

export interface StockLayoutProps {
  categories: ICategory[];
  // Stock is now fetched via Jotai atoms instead of props
}
// ============================================================
// DEALER INTERFACES
// ============================================================

export interface IDealer {
  id?: string;
  dealerName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: string;
  notes?: string;
  isActive?: boolean;

  // Current bill reference
  currentBillId?: string;
  currentBillAmount?: number;
  currentBillOutstanding?: number;
  currentBillDueDate?: string;
  isOverdue?: boolean;

  // Advance payment balance
  availableAdvance?: number;

  // Historical summary
  totalBillsCount?: number;
  totalPaidAllTime?: number;
  lastPaymentDate?: string;
  firstPaymentDate?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// BILL INTERFACES
// ============================================================

export interface IDealerBill {
  id?: string;
  dealerId: string;
  dealerName: string;
  invoiceNo?: string;
  billDate: Date;
  dueDate?: Date;

  // Amount breakdown
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  netAmount?: number; // totalAmount - discountAmount + taxAmount
  advanceAdjusted?: number; // advance amount absorbed into this bill
  remainingAmount: number; // netAmount - totalPaid - advanceAdjusted - creditNotesTotal

  // Attachments
  billImageUrl?: string;
  attachments?: IBillAttachment[];

  // Status
  status: 'paid' | 'partial' | 'unpaid' | 'disputed' | 'void';
  isCurrent: boolean; // true = active bill, false = history
  hasDispute?: boolean;

  // Payments & credits
  payments: IBillPayment[];
  creditNotes?: ICreditNote[];

  // Replacement tracking
  parentBillId?: string;
  isReplacement?: boolean;
  replacementReason?: string;

  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBillAttachment {
  id?: string;
  billId: string;
  dealerId: string;
  fileUrl: string;
  fileType: 'invoice' | 'delivery_note' | 'receipt' | 'dispute_doc' | 'other';
  uploadedBy?: string;
  uploadedAt?: Date;
  notes?: string;
}

// ============================================================
// PAYMENT INTERFACES
// ============================================================

export interface IBillPayment {
  id: string;
  billId: string;
  dealerId: string;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'online' | 'other';
  transactionImageUrl?: string;
  notes?: string;
  receivedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdvancePayment {
  id?: string;
  dealerId: string;
  dealerName: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'online' | 'other';
  transactionImageUrl?: string;
  notes?: string;
  receivedBy?: string;
  status: 'pending' | 'adjusted' | 'refunded'; // pending = not yet applied to a bill
  adjustedToBillId?: string; // once applied, which bill absorbed this advance
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// CREDIT NOTE INTERFACE
// ============================================================

export interface ICreditNote {
  id?: string;
  dealerId: string;
  dealerName: string;
  billId: string;
  creditDate: Date;
  creditAmount: number;
  reason: 'goods_return' | 'discount' | 'overcharge' | 'damage' | 'other';
  notes?: string;
  imageUrl?: string;
  appliedToPayment?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// DISPUTE INTERFACE
// ============================================================

export interface IBillDispute {
  id?: string;
  billId: string;
  dealerId: string;
  dealerName: string;
  disputeDate: Date;
  reason: string;
  disputedAmount?: number;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// OVERDUE TRACKING INTERFACE
// ============================================================

export interface IBillDueTracker {
  id?: string;
  billId: string;
  dealerId: string;
  dealerName: string;
  billDate: Date;
  dueDate: Date;
  overdueDays?: number; // calculated: today - dueDate
  reminderSentAt?: Date[];
  status: 'on_track' | 'due_soon' | 'overdue' | 'settled';
  priority: 'low' | 'medium' | 'high';
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// AUDIT LOG INTERFACE
// ============================================================

export interface IAuditLog {
  id?: string;
  entityType:
    | 'dealer'
    | 'bill'
    | 'payment'
    | 'credit_note'
    | 'advance'
    | 'dispute';
  entityId: string;
  dealerId: string;
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'payment_added'
    | 'bill_replaced'
    | 'credit_applied'
    | 'advance_adjusted'
    | 'status_changed'
    | 'dispute_raised'
    | 'dispute_resolved';
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  performedBy?: string;
  performedAt: Date;
  notes?: string;
}

// ============================================================
// SUMMARY / VIEW INTERFACES
// ============================================================

export interface IDealerBillHistory {
  id?: string;
  dealerId: string;
  dealerName: string;
  bills: IDealerBill[];
  totalBillsCount: number;
  totalAmountAllBills: number;
  totalPaidAllTime: number;
  currentBill?: IDealerBill;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBillStatusSummary {
  dealerId: string;
  dealerName: string;
  currentBillId?: string;
  currentBillAmount?: number;
  currentBillPaid?: number;
  currentBillOutstanding?: number;
  currentBillStatus?: 'paid' | 'partial' | 'unpaid' | 'disputed' | 'void';
  currentBillDueDate?: string;
  isOverdue?: boolean;
  availableAdvance?: number;
  totalHistoricalBills: number;
  totalPaidAllTime: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

// ============================================================
// ENUMS (optional but recommended for consistency)
// ============================================================

export enum BillStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  UNPAID = 'unpaid',
  DISPUTED = 'disputed',
  VOID = 'void',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum AdvanceStatus {
  PENDING = 'pending',
  ADJUSTED = 'adjusted',
  REFUNDED = 'refunded',
}

export enum DueTrackerStatus {
  ON_TRACK = 'on_track',
  DUE_SOON = 'due_soon',
  OVERDUE = 'overdue',
  SETTLED = 'settled',
}

export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  PAYMENT_ADDED = 'payment_added',
  BILL_REPLACED = 'bill_replaced',
  CREDIT_APPLIED = 'credit_applied',
  ADVANCE_ADJUSTED = 'advance_adjusted',
  STATUS_CHANGED = 'status_changed',
  DISPUTE_RAISED = 'dispute_raised',
  DISPUTE_RESOLVED = 'dispute_resolved',
}

export enum CreditNoteReason {
  GOODS_RETURN = 'goods_return',
  DISCOUNT = 'discount',
  OVERCHARGE = 'overcharge',
  DAMAGE = 'damage',
  OTHER = 'other',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

// NEW: Invoice status enum
export enum InvoiceStatus {
  ACTIVE = 'active',
  VOIDED = 'voided',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
}

// NEW: Invoice payment status enum
export enum InvoicePaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
}

export enum AttachmentType {
  INVOICE = 'invoice',
  DELIVERY_NOTE = 'delivery_note',
  RECEIPT = 'receipt',
  DISPUTE_DOC = 'dispute_doc',
  OTHER = 'other',
}
