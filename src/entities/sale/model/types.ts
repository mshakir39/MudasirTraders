// src/entities/sale/model/types.ts
// Sale entity types and interfaces

export interface Sale {
  id: string;
  customerName: string;
  customerContactNumber: string;
  products: SaleProduct[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SaleProduct {
  brandName: string;
  series: string;
  quantity: number;
  productPrice: number;
  productCost: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SalesFilter {
  customer: string;
  dateRange: DateRange;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  avgSaleValue: number;
  uniqueCustomers: number;
  totalProfit: number;
}

export interface SalesApiResponse {
  success: boolean;
  data?: Sale[];
  error?: string;
}

export interface CustomerOption {
  label: string;
  value: string;
}
