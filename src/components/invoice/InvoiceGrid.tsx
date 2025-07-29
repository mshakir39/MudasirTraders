import React, { useMemo } from 'react';
import { VscPreview } from 'react-icons/vsc';
import { convertDate } from '@/utils/convertTime';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';

interface InvoiceGridProps {
  invoices: any[];
  onCreateInvoice: () => void;
  onViewProducts: (data: any) => void;
  onPreview: (data: any) => void;
  onEditInvoice: (data: any) => void;
  showCreateButton?: boolean;
}

const InvoiceGrid: React.FC<InvoiceGridProps> = ({
  invoices,
  onCreateInvoice,
  onViewProducts,
  onPreview,
  onEditInvoice,
  showCreateButton = true,
}) => {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'invoiceNo',
      header: 'Invoice #',
    },
    { 
      accessorKey: 'customerName',
      header: 'Customer Name',
    },
    {
      accessorKey: 'customerContactNumber',
      header: 'Contact #',
    },
    { 
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
    },
    {
      accessorKey: 'batteriesCountAndWeight',
      header: 'Batteries Count and Weight',
    },
    {
      accessorKey: 'batteriesRate',
      header: 'Batteries Rate',
      cell: ({ row }) => {
        return (
          <span>
            {row.original.batteriesRate ? 'Rs ' + row.original.batteriesRate : ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdDate',
      header: 'Created Date',
      cell: ({ row }) => {
        const { dateTime } = convertDate(row.original.createdDate);
        return <span>{dateTime}</span>;
      },
    },
    {
      accessorKey: 'remainingAmount',
      header: 'Remaining Amount',
      cell: ({ row }) => {
        return (
          <span>
            {row.original.remainingAmount !== 0
              ? 'Rs ' + row.original.remainingAmount
              : ''}
          </span>
        );
      },
    },
    {
      id: 'products',
      header: 'Products Sold',
      cell: ({ row }) => (
        <span
          className='cursor-pointer text-blue-500 hover:text-blue-700'
          title='Click here for Detail'
          onClick={(e) => {
            e.stopPropagation();
            const products = row.original.products.map(
              (product: any, index: number) => ({ ...product, id: index })
            );
            onViewProducts(products);
          }}
        >
          Click here for Detail
        </span>
      ),
    },
    {
      id: 'preview',
      header: 'Preview',
      cell: ({ row }) => (
        <div className='flex h-full w-full items-center justify-start'>
          <VscPreview
            className='cursor-pointer text-blue-600 hover:text-blue-800'
            onClick={(e) => {
              e.stopPropagation();
              onPreview(row.original);
            }}
          />
        </div>
      ),
    },
    {
      id: 'makeItPaid',
      header: 'Add Remaining Amount',
      cell: ({ row }) => (
        <div className='flex h-full w-full items-center justify-start'>
          {row.original.remainingAmount > 0 && (
            <span
              className='cursor-pointer text-blue-500 hover:text-blue-700'
              onClick={(e) => {
                e.stopPropagation();
                onEditInvoice(row.original);
              }}
            >
              Add Amount
            </span>
          )}
        </div>
      ),
    },
  ], [onViewProducts, onPreview, onEditInvoice]);

  return (
    <Table
      data={invoices}
      columns={columns}
      enableSearch={true}
      searchPlaceholder="Search invoices..."
      enablePagination={true}
      pageSize={10}
      buttonTitle={showCreateButton ? 'Create Invoice' : undefined}
      buttonOnClick={showCreateButton ? onCreateInvoice : undefined}
      showButton={showCreateButton}
    />
  );
};

export default InvoiceGrid;