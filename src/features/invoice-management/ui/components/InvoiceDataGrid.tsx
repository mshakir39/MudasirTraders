// src/features/invoice-management/ui/components/InvoiceDataGrid.tsx
// Invoice data grid component using generic Table with built-in virtualization

'use client';

import React from 'react';
import { Invoice } from '@/entities/invoice';
import { InvoiceDataTable } from './InvoiceDataTable';

interface InvoiceDataGridProps {
  invoices: Invoice[];
  onCreateInvoice: () => void;
  onPreview: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onAddPayment: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onPreviewReplacement?: (replacementInvoiceId: string) => void;
  className?: string;
  pendingPartialTotal?: number;
}

export const InvoiceDataGrid: React.FC<InvoiceDataGridProps> = ({
  invoices,
  onCreateInvoice,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
  onPreviewReplacement,
  className = '',
  pendingPartialTotal = 0,
}) => {
  return (
    <div className={className}>
      {/* Invoice Data Table with built-in virtualization */}
      <InvoiceDataTable
        invoices={invoices}
        onCreateInvoice={onCreateInvoice}
        onPreview={onPreview}
        onEditInvoice={onEditInvoice}
        onAddPayment={onAddPayment}
        onDeleteInvoice={onDeleteInvoice}
        onPreviewReplacement={onPreviewReplacement}
        pendingPartialTotal={pendingPartialTotal}
      />
    </div>
  );
};
