// src/features/sales-management/shared/ui/components/SalesDataGrid.tsx
// Sales data grid component

'use client';

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Table from '@/components/table';
import { FaEye, FaTrash } from 'react-icons/fa';
import { Sale } from '@/features/sales-management/entities/sales/model/types';

interface SalesDataGridProps {
  filteredSales: Sale[];
  onViewProducts: (sale: Sale) => void;
  onDeleteSale?: (saleId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const SalesDataGrid: React.FC<SalesDataGridProps> = ({
  filteredSales,
  onViewProducts,
  onDeleteSale,
  isLoading = false,
  className = '',
}) => {
  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => {
          const date = new Date(row.original.date);
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: (info) => (
          <span className='font-medium'>{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => {
          const products = (row.original as any).products || [];
          const productCount = products.length;

          if (productCount === 0) {
            return <span className='text-gray-400'>No products</span>;
          }

          if (productCount === 1) {
            const product = products[0];
            return (
              <div className='text-sm'>
                <div className='font-medium text-blue-600'>
                  {(product as any).series || (product as any).batteryDetails?.name || 'Unknown Product'} ×{' '}
                  {(product as any).quantity}
                </div>
                {(product as any).warrentyCode && (
                  <div className='text-xs text-gray-500'>
                    Warranty: {(product as any).warrentyCode}
                  </div>
                )}
              </div>
            );
          }

          const firstProduct = products[0];
          const remainingCount = productCount - 1;

          return (
            <div className='text-sm'>
              <div>
                <div className='font-medium text-blue-600'>
                  {(firstProduct as any).series || (firstProduct as any).batteryDetails?.name} ×{' '}
                  {(firstProduct as any).quantity}
                </div>
                {(firstProduct as any).warrentyCode && (
                  <div className='text-xs text-gray-500'>
                    Warranty: {(firstProduct as any).warrentyCode}
                  </div>
                )}
              </div>
              {remainingCount > 0 && (
                <div className='mt-1 text-xs text-gray-500'>
                  +{remainingCount} more product{remainingCount > 1 ? 's' : ''}{' '}
                  - Click to view all
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total Amount',
        cell: ({ row }) => {
          const sale = row.original as any;
          const amount = sale.grandTotal || sale.totalAmount || sale.amount || sale.total || 0;
          return (
            <span className='font-semibold text-green-600'>
              Rs {Number(amount).toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method',
        cell: ({ row }) => {
          const method = row.original.paymentMethod;
          return (
            <span className='text-sm text-gray-600'>
              {method 
                ? Array.isArray(method) 
                  ? method.join(', ') 
                  : method
                : 'Not specified'
              }
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <button
              onClick={() => onViewProducts(row.original)}
              className='text-blue-500 hover:text-blue-700 transition-colors'
              title='View Products'
              disabled={isLoading}
            >
              <FaEye />
            </button>
            {onDeleteSale && (
              <button
                onClick={() => onDeleteSale(row.original.id)}
                className='text-red-500 hover:text-red-700 transition-colors'
                title='Delete Sale'
                disabled={isLoading}
              >
                <FaTrash />
              </button>
            )}
          </div>
        ),
      },
    ],
    [onViewProducts, onDeleteSale, isLoading]
  );

  return (
    <div className={className}>
      <Table
        data={filteredSales}
        columns={columns}
        enableSearch={true}
        enableRowVirtualization
        minVisibleRows={13}
        searchPlaceholder='Search sales...'
        showButton={false}
        emptyMessage="No sales found. Try adjusting your search or create a new sale."
      />
    </div>
  );
};
