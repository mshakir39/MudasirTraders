// src/app/dashboard/invoices/InvoicesClient.tsx
// Client component that uses global state for instant loading

'use client';

import InvoiceErrorBoundary from '../../../components/invoices/InvoiceErrorBoundary';
import InvoiceManagementPage from '@/pages/InvoiceManagementPage';

export default function InvoicesClient() {
  return (
    <InvoiceErrorBoundary>
      <InvoiceManagementPage
        initialInvoices={[]} // Empty initial data - will use global state
      />
    </InvoiceErrorBoundary>
  );
}
