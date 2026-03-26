// src/pages/InvoiceManagementPage.tsx
// Invoice management page - <50 lines (composition only)

'use client';

import React from 'react';
import { InvoiceManagement } from '@/features/invoice-management';
import { Invoice } from '@/entities/invoice';

interface InvoiceManagementPageProps {
  initialInvoices: Invoice[];
  // Categories and stock now fetched via Jotai atoms
}

export default function InvoiceManagementPage({
  initialInvoices
}: InvoiceManagementPageProps) {
  const handleCreateInvoice = () => {
    // This will be passed to the table component
  };

  return (
    <div className='p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Invoices</h1>
      </div>

      {/* Invoice Management Component */}
      <InvoiceManagement 
        initialInvoices={initialInvoices}
        onCreateInvoice={handleCreateInvoice}
      />
    </div>
  );
}
