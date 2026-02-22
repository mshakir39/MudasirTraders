export interface ICategory {
  id?: string;
  brandName: string;
  series: IBatterySeries[];
  salesTax: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDropdownOption {
  label: string;
  value: any;
}

export interface IStock {
  id?: string;
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
  updatedDate: Date;
}

export interface IBrand {
  id?: string;
  brandName: string;
}

export interface ICustomerReview {
  id?: string;
  author_name: string;
  rating: number;
  text: string;
  createdAt: Date;
  approved?: boolean;
}

export interface IBatterySeries {
  name: string;
  plate: string;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

export interface ICategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
}

export interface IDealerBill {
  id?: string;
  dealerId?: string; // Reference to dealer entity
  dealerName: string; // Keep for backward compatibility
  billDate: Date;
  totalAmount: number;
  billImageUrl: string;
  status: 'paid' | 'partial' | 'unpaid';
  payments: IBillPayment[];
  remainingAmount: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDealer {
  id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: string; // e.g., "Battery Supplier", "Wholesale Dealer"
  notes?: string;
  isActive: boolean;
  totalBills?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBillPayment {
  id?: string;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: string;
  transactionImageUrl: string;
  notes?: string;
  receivedBy?: string; // person who received cash payment
  createdAt?: Date;
}
