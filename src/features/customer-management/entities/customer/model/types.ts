// src/features/customer-management/entities/customer/model/types.ts
// Customer entity types and interfaces

export interface Customer {
  _id?: string;
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
  customerType?: string;
  createdAt: string;
  updatedAt?: string;
  totalInvoices?: number;
  totalAmount?: number;
  lastInvoiceDate?: string;
}

export interface CustomerFormData {
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

export interface CustomerCreateRequest {
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

export interface CustomerUpdateRequest {
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

export interface CustomerDeleteRequest {
  id: string;
}

export interface CustomerApiResponse {
  success: boolean;
  data?: Customer[];
  error?: string;
}

export interface CustomerActionResponse {
  success: boolean;
  data?: Customer;
  error?: string;
}
