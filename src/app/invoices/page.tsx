import React from 'react';
import InvoiceLayout from '../../layouts/invoicesLayout';
import { getCategories } from '@/getData/getCategories';
import { getAllInvoices } from '@/getData/getInvoices';
import { getAllStock } from '@/getData/getStock';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function Invoices() {
  console.log("categories, invoices, stock");

  const categories = await getCategories();
  console.log("categories",categories);
  const invoices = await getAllInvoices();
  console.log("invoices",invoices);
  const stock = await getAllStock();
  console.log("stock",stock);
  console.log("categories, invoices, stock",categories, invoices, stock);
  return (
    <div className='mt-6 flex w-full flex-col'>
      <InvoiceLayout categories={Array.isArray(categories) ? categories : []} invoices={Array.isArray(invoices) ? invoices : []} stock={Array.isArray(stock) ? stock : []} />
    </div>
  );
}

export default Invoices;
