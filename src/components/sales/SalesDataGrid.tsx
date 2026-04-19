import React, { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Table from '@/components/table';

interface SalesDataGridProps {
  filteredSales: any[];
  onViewProducts: (sale: any) => void;
}

const SalesDataGrid: React.FC<SalesDataGridProps> = ({
  filteredSales,
  onViewProducts,
}) => {
  const extraGlobalSearchText = useCallback((row: any) => {
    const products = row.products || [];
    const warrantyCodes = products
      .map((p: any) => p.warrentyCode)
      .filter(Boolean)
      .join(' ');
    return warrantyCodes;
  }, []);

  const columns = useMemo<ColumnDef<any>[]>(
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
      },
      {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => {
          const products = row.original.products || [];
          const productCount = products.length;

          if (productCount === 0) {
            return <span className='text-gray-400'>No products</span>;
          }

          if (productCount === 1) {
            const product = products[0];
            return (
              <div className='text-sm'>
                <div>
                  {product.series || product.batteryDetails?.name} ×{' '}
                  {product.quantity}
                </div>
                {product.warrentyCode && (
                  <div className='text-xs text-gray-500'>
                    Warranty: {product.warrentyCode}
                  </div>
                )}
              </div>
            );
          }

          // For multiple products, show clickable summary
          const firstProduct = products[0];
          const remainingCount = productCount - 1;

          return (
            <div
              className='cursor-pointer rounded p-1 text-sm transition-colors hover:bg-gray-50'
              onClick={() => onViewProducts(row.original)}
            >
              <div>
                <div className='font-medium text-blue-600'>
                  {firstProduct.series || firstProduct.batteryDetails?.name} ×{' '}
                  {firstProduct.quantity}
                </div>
                {firstProduct.warrentyCode && (
                  <div className='text-xs text-gray-500'>
                    Warranty: {firstProduct.warrentyCode}
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
        cell: ({ row }) =>
          `Rs ${row.original.totalAmount?.toLocaleString() || 0}`,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method',
        cell: ({ row }) => row.original.paymentMethod?.join(', '),
      },
    ],
    [onViewProducts]
  );

  return (
    <div className='rounded-lg  bg-white'>
      <Table
        data={filteredSales}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search sales...'
        enableRowVirtualization={true}
        tableBodyHeight={600}
        minVisibleRows={15}
        extraGlobalSearchText={extraGlobalSearchText}
      />
    </div>
  );
};

export default SalesDataGrid;
