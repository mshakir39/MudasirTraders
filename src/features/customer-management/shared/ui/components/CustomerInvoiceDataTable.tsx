// src/features/customer-management/shared/ui/components/CustomerInvoiceDataTable.tsx
// Customer invoice data table component

'use client';

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FaEye, FaEdit, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import Table from '@/components/table';

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

interface CustomerInvoiceDataTableProps {
  invoices: CustomerInvoice[];
  onPreview: (invoice: CustomerInvoice) => void;
  onEditInvoice: (invoice: CustomerInvoice) => void;
  onAddPayment: (invoice: CustomerInvoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  className?: string;
}

export const CustomerInvoiceDataTable: React.FC<CustomerInvoiceDataTableProps> = ({
  invoices,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
  className = '',
}) => {
  const columns = useMemo<ColumnDef<CustomerInvoice>[]>(
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
        accessorKey: 'totalAmount',
        header: 'Total Amount',
        cell: ({ row }) => {
          const invoice = row.original;
          
          // Calculate total from products
          const productTotal = invoice.products?.reduce(
            (sum: number, product: any) => {
              // Try different possible price fields - prioritize productPrice
              const productPrice = product.productPrice || product.totalPrice || product.price || 0;
              const quantity = product.quantity || 1;
              return sum + (Number(productPrice) * Number(quantity));
            },
            0
          ) || 0;
          
          return (
            <span className='font-semibold text-green-600'>
              Rs {Number(productTotal).toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentDetails',
        header: 'Payment Details',
        cell: ({ row }) => {
          const invoice = row.original;
          const received = invoice.receivedAmount || 0;
          const remaining = invoice.remainingAmount || 0;
          const additionalPayments = invoice.additionalPayment || [];
          
          // Calculate total from products
          const productTotal = invoice.products?.reduce(
            (sum: number, product: any) => {
              // Use same logic as total amount - prioritize productPrice
              const productPrice = product.productPrice || product.totalPrice || product.price || 0;
              const quantity = product.quantity || 1;
              return sum + (Number(productPrice) * Number(quantity));
            },
            0
          ) || 0;

          // Calculate total additional payments
          const totalAdditional = additionalPayments.reduce((sum: number, payment: any) => 
            sum + Number(payment.amount || 0), 0
          );
          
          // Total paid amount
          const totalPaid = received + totalAdditional;
          
          // Calculate payment progress
          const paymentProgress = productTotal > 0 ? (totalPaid / productTotal) * 100 : 0;
          const isPayLater = invoice.isPayLater || received === 0;

          return (
            <div className='text-sm'>
              <div className='text-green-600'>
                Initial: Rs {Number(received).toLocaleString()}
              </div>
              {additionalPayments.length > 0 && (
                <div className='text-purple-600'>
                  Additional: Rs {Number(totalAdditional).toLocaleString()} ({additionalPayments.length})
                </div>
              )}
              <div className='text-blue-600 font-medium'>
                Total Paid: Rs {Number(totalPaid).toLocaleString()}
              </div>
              {remaining > 0 && (
                <div className='text-red-600'>
                  Remaining: Rs {Number(remaining).toLocaleString()}
                </div>
              )}
              <div className='text-xs text-gray-500 mt-1'>
                {paymentProgress.toFixed(0)}% paid
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method',
        cell: ({ row }) => {
          const method = row.original.paymentMethod;
          return (
            <div className='text-sm font-medium'>
              {Array.isArray(method) ? method.join(', ') : method || 'N/A'}
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Status',
        cell: ({ row }) => {
          const invoice = row.original;
          const remaining = invoice.remainingAmount || 0;
          const isPaid = remaining === 0;
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isPaid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isPaid ? 'Paid' : 'Pending'}
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
            <div className='flex items-center gap-2'>
              <button
                onClick={() => onPreview(invoice)}
                className='p-2' style={{ color: '#2563eb' }}
                title='View Invoice'
              >
                <FaEye />
              </button>
              <button
                onClick={() => onEditInvoice(invoice)}
                className='p-2' style={{ color: '#0284c7' }}
                title='Edit Invoice'
              >
                <FaEdit />
              </button>
              {(invoice.remainingAmount || 0) > 0 && (
                <button
                  onClick={() => onAddPayment(invoice)}
                  className='p-2' style={{ color: '#fbcc5e' }}
                  title='Add Payment'
                >
                  <FaMoneyBillWave />
                </button>
              )}
              <button
                onClick={() => onDeleteInvoice(invoice._id)}
                className='p-2' style={{ color: '#dc2626' }}
                title='Delete Invoice'
              >
                <FaTrash />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className={className}>
      <Table
        data={invoices}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search invoices...'
        showButton={false}
        emptyMessage="No invoices found for this customer."
      />
    </div>
  );
};
