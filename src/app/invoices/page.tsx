import React from 'react';
import InvoiceLayout from '../../layouts/invoicesLayout';
import { getCategories } from '@/getData/getCategories';
import { getInvoices } from '@/actions/invoiceActions';
import { getStock } from '@/actions/stockActions';

export const dynamic = 'auto';
export const revalidate = 60; // Cache for 1 minute

async function Invoices() {
  const categories = await getCategories();
  const invoicesResult = await getInvoices();
  const stockResult = await getStock();

  const invoices =
    invoicesResult.success && Array.isArray(invoicesResult.data)
      ? invoicesResult.data
      : [];
  const stock =
    stockResult.success && Array.isArray(stockResult.data)
      ? stockResult.data
      : [];

  return (
    <InvoiceLayout
      categories={Array.isArray(categories) ? categories : []}
      invoices={invoices}
      stock={stock}
    />
  );
}

export default Invoices;
