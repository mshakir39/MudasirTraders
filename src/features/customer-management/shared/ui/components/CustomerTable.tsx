// src/features/customer-management/shared/ui/components/CustomerTable.tsx
// Customer table component - matches old design

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import { Customer } from '@/features/customer-management/entities/customer/model/types';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';

const CUSTOMERS_TABLE_SCROLL_HEIGHT = 'min(900px, calc(100dvh - 12rem))';

interface CustomerTableProps {
  customers: Customer[];
  onViewInvoices: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  loading?: boolean;
  className?: string;
  onAddCustomer?: () => void;
  onNearBottom?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onViewInvoices,
  onEditCustomer,
  onDeleteCustomer,
  loading = false,
  className = '',
  onAddCustomer,
  onNearBottom,
  searchValue,
  onSearchChange,
}) => {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  const handleScrollContainerRef = useCallback((el: HTMLDivElement | null) => {
    setScrollRoot(el);
  }, []);

  const handleBodyScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onNearBottom) return;
      const el = e.currentTarget;
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < 80) {
        onNearBottom();
      }
    },
    [onNearBottom]
  );

  useEffect(() => {
    if (!scrollRoot || !onNearBottom) return;

    const sentinel = scrollRoot.querySelector('[data-sales-load-sentinel]');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        const nearBottom =
          scrollRoot.scrollHeight -
            scrollRoot.scrollTop -
            scrollRoot.clientHeight <
          100;
        if (nearBottom) {
          onNearBottom();
        }
      },
      { root: scrollRoot, rootMargin: '0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollRoot, onNearBottom, customers.length]);

  const columns: ColumnDef<Customer>[] = React.useMemo(
    () => [
      {
        accessorKey: 'customerName',
        header: 'Customer Name',
        cell: ({ row }) => (
          <span className='font-medium text-secondary-900'>
            {row.original.customerName}
          </span>
        ),
      },
      {
        accessorKey: 'phoneNumber',
        header: 'Phone Number',
        cell: ({ row }) => (
          <span style={{ color: '#2563eb' }}>{row.original.phoneNumber}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          const email = row.original.email;
          return email ? (
            <a
              href={`mailto:${email}`}
              className='text-blue-500 hover:underline'
              style={{ color: '#2563eb' }}
            >
              {email}
            </a>
          ) : (
            <span className='text-secondary-400'>No email</span>
          );
        },
      },
      {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }) => (
          <span>
            {row.original.address || (
              <span className='text-secondary-400'>No address</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => (
          <span className='text-secondary-600'>
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : 'N/A'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <button
              onClick={() => onViewInvoices(row.original)}
              className='p-2'
              style={{ color: '#2563eb' }}
              title='View Customer Invoices'
              disabled={loading}
            >
              <FaEye size={16} />
            </button>
            <button
              onClick={() => onEditCustomer(row.original)}
              className='p-2'
              style={{ color: '#0284c7' }}
              title='Edit Customer'
              disabled={loading}
            >
              <FaEdit size={16} />
            </button>
            <button
              onClick={() => onDeleteCustomer(row.original)}
              className='p-2'
              style={{ color: '#dc2626' }}
              title='Delete Customer'
              disabled={loading}
            >
              <FaTrash size={16} />
            </button>
          </div>
        ),
      },
    ],
    [onViewInvoices, onEditCustomer, onDeleteCustomer, loading]
  );

  return (
    <div className={className}>
      <Table
        data={customers}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search customers...'
        showButton={!!onAddCustomer}
        buttonTitle='Add Customer'
        buttonOnClick={onAddCustomer}
        emptyMessage='No customers found.'
        enableRowVirtualization={false}
        compactLayout
        stickyHeader
        bodyScrollHeight={CUSTOMERS_TABLE_SCROLL_HEIGHT}
        showLoadMoreSentinel={!!onNearBottom}
        onScrollContainerRef={handleScrollContainerRef}
        onBodyScroll={handleBodyScroll}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
    </div>
  );
};
