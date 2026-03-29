// src/features/invoice-management/ui/components/InvoiceDataTable.tsx
// Invoice data table using the generic Table component with built-in virtualization

'use client';

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Invoice } from '@/entities/invoice';
import { InvoiceGridActions } from './grid/InvoiceGridActions';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import Table from '@/components/table';
import { formatCurrency } from '@/utils/formatters';

interface InvoiceDataTableProps {
  invoices: Invoice[];
  onPreview: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onAddPayment: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onCreateInvoice?: () => void;
  onPreviewReplacement?: (replacementInvoiceId: string) => void;
  className?: string;
}

export const InvoiceDataTable: React.FC<InvoiceDataTableProps> = ({
  invoices,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
  onCreateInvoice,
  onPreviewReplacement,
  className = '',
}) => {
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: 'invoiceNo',
        header: 'Invoice No',
        cell: ({ row }) => {
          const invoice = row.original;
          const date = invoice.createdDate;
          const dateStr = date ? new Date(date).toLocaleDateString() : '';
          return (
            <div>
              <div className='text-xs text-gray-500'>{dateStr}</div>
              <div className='font-medium'>{invoice.invoiceNo}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div>
              <div className='font-medium'>{invoice.customerName}</div>
              {invoice.customerContactNumber && (
                <div className='text-xs text-gray-500'>
                  {invoice.customerContactNumber}
                </div>
              )}
            </div>
          );
        },
      },
      // NEW: Status Column
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <InvoiceStatusBadge
              invoice={invoice}
              showTransferLinks={true}
              onPreviewReplacement={onPreviewReplacement}
            />
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total Amount',
        cell: ({ row }) => formatCurrency(row.original.totalAmount),
      },
      {
        accessorKey: 'paymentDetails',
        header: 'Payment',
        cell: ({ row }) => {
          const invoice = row.original;
          const initialReceived = invoice.receivedAmount || 0;
          const additionalPayments = invoice.additionalPayment || [];
          const batteriesRate = invoice.batteriesRate || 0;

          // Calculate total amount correctly for consolidated invoices
          let totalAmount;
          if (invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0) {
            // For consolidated invoices, total includes both consolidated amount and new items
            const consolidatedAmount =
              invoice.previousAmounts?.reduce(
                (sum: number, amount: number) => sum + amount,
                0
              ) || 0;
            const newItemsAmount =
              invoice.products?.reduce(
                (sum: number, product: any) => sum + (product.totalPrice || 0),
                0
              ) || 0;
            totalAmount = consolidatedAmount + newItemsAmount;
          } else {
            // For normal invoices, use the stored totalAmount
            totalAmount = invoice.totalAmount || 0;
          }

          // Calculate total received amount including additional payments
          const totalAdditionalReceived = additionalPayments.reduce(
            (sum: number, payment: any) => sum + Number(payment.amount),
            0
          );
          const totalReceived = initialReceived + totalAdditionalReceived;

          // Calculate actual remaining amount
          const actualRemaining = totalAmount - totalReceived - batteriesRate;

          const paymentLines = [];

          if (initialReceived > 0) {
            paymentLines.push(formatCurrency(initialReceived));
          }

          if (batteriesRate > 0) {
            paymentLines.push(`Old Battery: ${formatCurrency(batteriesRate)}`);
          }

          additionalPayments.forEach((payment: any) => {
            const paymentDate = payment.addedDate || payment.createdAt;
            const dateStr = paymentDate
              ? new Date(paymentDate).toLocaleString()
              : '';
            paymentLines.push(
              <div key={payment.id || Math.random()}>
                <span className='font-medium text-gray-900'>
                  {formatCurrency(payment.amount)}
                </span>
                {dateStr && (
                  <span className='ml-1 text-xs text-gray-500'>
                    ({dateStr})
                  </span>
                )}
              </div>
            );
          });

          return (
            <div className='text-sm'>
              {paymentLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
              {actualRemaining > 0 && (
                <div className='text-xs text-red-600'>
                  Due: {formatCurrency(actualRemaining)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Status',
        cell: ({ row }) => {
          const invoice = row.original;
          const initialReceived = invoice.receivedAmount || 0;
          const additionalPayments = invoice.additionalPayment || [];
          const batteriesRate = invoice.batteriesRate || 0;

          // Calculate total amount correctly for consolidated invoices
          let totalAmount;
          if (invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0) {
            // For consolidated invoices, total includes both consolidated amount and new items
            const consolidatedAmount =
              invoice.previousAmounts?.reduce(
                (sum: number, amount: number) => sum + amount,
                0
              ) || 0;
            const newItemsAmount =
              invoice.products?.reduce(
                (sum: number, product: any) => sum + (product.totalPrice || 0),
                0
              ) || 0;
            totalAmount = consolidatedAmount + newItemsAmount;
          } else {
            // For normal invoices, use the stored totalAmount
            totalAmount = invoice.totalAmount || 0;
          }

          // Calculate total received amount including additional payments
          const totalAdditionalReceived = additionalPayments.reduce(
            (sum: number, payment: any) => sum + Number(payment.amount),
            0
          );
          const totalReceived = initialReceived + totalAdditionalReceived;

          // Calculate actual remaining amount
          const actualRemaining = totalAmount - totalReceived - batteriesRate;

          // Show actual payment status based on actual received amount
          let actualStatus: 'pending' | 'partial' | 'paid';
          if (totalReceived === 0) {
            actualStatus = 'pending';
          } else if (actualRemaining > 0) {
            actualStatus = 'partial';
          } else {
            actualStatus = 'paid';
          }

          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                actualStatus === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : actualStatus === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {actualStatus}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <InvoiceGridActions
              invoice={invoice}
              onPreview={onPreview}
              onEditInvoice={onEditInvoice}
              onAddPayment={onAddPayment}
              onDeleteInvoice={onDeleteInvoice}
            />
          );
        },
      },
    ],
    [onPreview, onEditInvoice, onAddPayment, onDeleteInvoice]
  );

  // Enhanced search text for better filtering
  const extraGlobalSearchText = useMemo(
    () => (invoice: Invoice) => {
      const parts = [
        invoice.invoiceNo,
        invoice.customerName,
        invoice.customerContactNumber,
        invoice.totalAmount?.toString(),
        invoice.paymentStatus,
        invoice.receivedAmount?.toString(),
        invoice.remainingAmount?.toString(),
        invoice.batteriesRate?.toString(),
        ...(invoice.paymentMethod || []),
      ];

      // Add payment details to search
      if (invoice.additionalPayment) {
        invoice.additionalPayment.forEach((payment: any) => {
          parts.push(payment.amount?.toString());
          parts.push(payment.addedDate);
        });
      }

      return parts.filter(Boolean).join(' ');
    },
    []
  );

  return (
    <div className={className}>
      <Table
        data={invoices}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search invoices...'
        enablePagination={true}
        pageSize={10}
        extraGlobalSearchText={extraGlobalSearchText}
        emptyMessage='No invoices found. Try adjusting your search or filters.'
        showButton={!!onCreateInvoice}
        buttonTitle='Create Invoice'
        buttonOnClick={onCreateInvoice}
      />
    </div>
  );
};
