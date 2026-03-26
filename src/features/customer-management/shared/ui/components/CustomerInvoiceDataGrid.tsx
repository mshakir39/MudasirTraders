// src/features/customer-management/shared/ui/components/CustomerInvoiceDataGrid.tsx
// Customer invoice data grid wrapper component

'use client';

import React from 'react';
import { CustomerInvoiceDataTable } from './CustomerInvoiceDataTable';

// Import the CustomerInvoice interface
interface CustomerInvoice {
  _id: string;
  invoiceNo: string;
  customerName: string;
  customerAddress: string;
  customerContactNumber: string;
  customerType: string;
  customerId: string;
  vehicleNo: string;
  paymentMethod: string | string[];
  batteriesCountAndWeight: string;
  batteriesRate: number;
  receivedAmount: number;
  isPayLater: boolean;
  products: any[];
  createdDate: string;
  remainingAmount: number;
  paymentStatus: string;
  addedDate: string;
  additionalPayment: any[];
}

interface CustomerInvoiceDataGridProps {
  invoices: CustomerInvoice[];
  onPreview: (invoice: CustomerInvoice) => void;
  onEditInvoice: (invoice: CustomerInvoice) => void;
  onAddPayment: (invoice: CustomerInvoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  className?: string;
}

export const CustomerInvoiceDataGrid: React.FC<CustomerInvoiceDataGridProps> = ({
  invoices,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Customer Invoice Data Table */}
      <CustomerInvoiceDataTable
        invoices={invoices}
        onPreview={onPreview}
        onEditInvoice={onEditInvoice}
        onAddPayment={onAddPayment}
        onDeleteInvoice={onDeleteInvoice}
      />
    </div>
  );
};
