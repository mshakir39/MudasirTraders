// src/entities/customer/model/types.ts
// Customer entity types and interfaces

export interface Customer {
  _id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
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

export interface CustomerTableColumn {
  accessorKey: string;
  header: string;
  cell?: (info: any) => React.ReactNode;
}
