// src/shared/ui/CustomerTable.tsx
// Customer table component - <100 lines

import React from 'react';
import { FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import { Customer } from '@/entities/customer/model/types';

interface CustomerTableProps {
  customers: Customer[];
  onViewInvoices: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  loading?: boolean;
  className?: string;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onViewInvoices,
  onEditCustomer,
  onDeleteCustomer,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className='py-8 text-center'>
        <p className='text-gray-500'>No customers found</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
              Customer Name
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
              Phone Number
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
              Email
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
              Address
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
              Created Date
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 bg-white'>
          {customers.map((customer) => (
            <tr
              key={
                customer._id ||
                `${customer.phoneNumber}-${customer.customerName}`
              }
              className='hover:bg-gray-50'
            >
              <td className='whitespace-nowrap px-6 py-4'>
                <span className='font-medium'>{customer.customerName}</span>
              </td>
              <td className='whitespace-nowrap px-6 py-4'>
                <span className='text-blue-600'>{customer.phoneNumber}</span>
              </td>
              <td className='whitespace-nowrap px-6 py-4'>
                {customer.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className='text-blue-500 hover:underline'
                  >
                    {customer.email}
                  </a>
                ) : (
                  <span className='text-gray-400'>No email</span>
                )}
              </td>
              <td className='whitespace-nowrap px-6 py-4'>
                {customer.address || (
                  <span className='text-gray-400'>No address</span>
                )}
              </td>
              <td className='whitespace-nowrap px-6 py-4'>
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString()
                  : 'N/A'}
              </td>
              <td className='whitespace-nowrap px-6 py-4'>
                <div className='flex gap-2'>
                  <button
                    onClick={() => onViewInvoices(customer)}
                    className='flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600'
                    title='View Customer Invoices'
                  >
                    <FaEye size={10} />
                    Invoices
                  </button>
                  <button
                    onClick={() => onEditCustomer(customer)}
                    className='flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-xs text-white transition-colors hover:bg-green-600'
                    title='Edit Customer'
                  >
                    <FaEdit size={10} />
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteCustomer(customer)}
                    className='flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600'
                    title='Delete Customer'
                  >
                    <FaTrash size={10} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
