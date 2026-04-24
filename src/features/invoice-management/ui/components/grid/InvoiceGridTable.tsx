// src/features/invoice-management/ui/components/grid/InvoiceGridTable.tsx
// Invoice grid table component - <50 lines

'use client';

import React from 'react';
import { InvoiceGridActions } from './InvoiceGridActions';

interface InvoiceGridTableProps {
  invoices: any[];
  columns: any[];
  onViewProducts: (invoice: any) => void;
  onPreview: (invoice: any) => void;
  onEditInvoice: (invoice: any) => void;
  onAddPayment: (invoice: any) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoiceGridTable: React.FC<InvoiceGridTableProps> = ({
  invoices,
  columns,
  onViewProducts,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
}) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                {column.header}
              </th>
            ))}
            <th className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 bg-white'>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              {columns.map((column, index) => (
                <td
                  key={index}
                  className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'
                >
                  {column.cell({
                    getValue: () => invoice[column.accessorKey],
                    invoice,
                  })}
                </td>
              ))}
              <td className='relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium'>
                <InvoiceGridActions
                  invoice={invoice}
                  onPreview={onPreview}
                  onEditInvoice={onEditInvoice}
                  onAddPayment={onAddPayment}
                  onDeleteInvoice={onDeleteInvoice}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
