// src/features/sales-management/entities/sales/model/types.ts
// Sales entity types and interfaces

export interface SalesProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  brand?: string;
  warranty?: string;
}

export interface Sale {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  products: SalesProduct[];
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'partial';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SalesFilters {
  customer: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  avgSaleValue: number;
  uniqueCustomers: number;
}

export interface SalesPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SalesApiResponse {
  success: boolean;
  data?: Sale[];
  summary?: SalesSummary;
  pagination?: SalesPaginationMeta;
  error?: string;
}

export interface SalesActionResponse {
  success: boolean;
  data?: Sale;
  error?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CustomerOption {
  label: string;
  value: string;
}
