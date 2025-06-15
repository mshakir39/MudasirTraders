import React from 'react';
import InvoiceLayout from '../../layouts/invoicesLayout';
import { getCategories } from '@/getData/getCategories';
import { getAllInvoices } from '@/getData/getInvoices';
import { getAllStock } from '@/getData/getStock';

async function Invoices() {
  const categories = await getCategories();
  const invoices = await getAllInvoices();
  const stock = await getAllStock();
  return (
    <div className='mt-6 flex w-full flex-col'>
      <InvoiceLayout categories={categories} invoices={invoices} stock={stock} />
    </div>
  );
}

export default Invoices;
