// src/app/dashboard/invoices/page.tsx
// Use global state for instant loading

import InvoicesClient from './InvoicesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices | Mudasir Traders',
  description: 'Manage your invoices and billing records',
};

export default function Invoices() {
  return <InvoicesClient />;
}
