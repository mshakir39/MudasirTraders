import React, { useMemo, useState } from 'react';
import { VscPreview } from 'react-icons/vsc';
import { convertDate } from '@/utils/convertTime';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import Button from '@/components/button';

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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    invoiceId: string;
    invoiceNo: string;
  }>({
    isOpen: false,
    invoiceId: '',
    invoiceNo: '',
  });

  const handleDeleteClick = (invoiceId: string, invoiceNo: string) => {
    setDeleteModal({
      isOpen: true,
      invoiceId,
      invoiceNo,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('/api/invoice', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deleteModal.invoiceId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Invoice ${deleteModal.invoiceNo} deleted successfully`);
        // Refresh the invoices list
        // fetchInvoices(); // This line was not provided in the original file, so it's not added.
      } else {
        toast.error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteModal({ isOpen: false, invoiceId: '', invoiceNo: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, invoiceId: '', invoiceNo: '' });
  };

  // Utility function to clean up stock data (run this once to fix string/number issues)
  const cleanupStockData = async () => {
    try {
      const response = await fetch('/api/stock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanupStockData' }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        console.log('Stock cleanup result:', result);
      } else {
        toast.error(result.error || 'Failed to cleanup stock data');
      }
    } catch (error) {
      console.error('Error cleaning up stock data:', error);
      toast.error('Failed to cleanup stock data');
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
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
              {row.original.batteriesRate
                ? 'Rs ' + row.original.batteriesRate
                : ''}
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
      {
        id: 'delete',
        header: 'Delete',
        cell: ({ row }) => (
          <div className='flex h-full w-full items-center justify-start'>
            <button
              className='cursor-pointer rounded-full p-2 text-red-500 transition-colors duration-200 hover:text-red-700'
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.original.id, row.original.invoiceNo);
              }}
              title='Delete Invoice'
            >
              🗑️
            </button>
          </div>
        ),
      },
    ],
    [onViewProducts, onPreview, onEditInvoice, handleDeleteClick]
  );

  console.log('invoices', invoices);
  return (
    <>
      <Table
        data={invoices}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search invoices...'
        enablePagination={true}
        pageSize={10}
        buttonTitle={showCreateButton ? 'Create Invoice' : undefined}
        buttonOnClick={showCreateButton ? onCreateInvoice : undefined}
        showButton={showCreateButton}
      />
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        title={`Delete Invoice ${deleteModal.invoiceNo}`}
      >
        <div className='space-y-4'>
          <p className='text-gray-700'>
            Are you sure you want to <strong>completely revert</strong> invoice{' '}
            <strong>{deleteModal.invoiceNo}</strong>?
          </p>
          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <h4 className='mb-2 font-semibold text-yellow-800'>
              This will completely reverse everything:
            </h4>
            <ul className='list-inside list-disc space-y-1 text-yellow-700'>
              <li>
                <strong>Restore stock quantities</strong> - All sold items go
                back to inventory
              </li>
              <li>
                <strong>Delete sales record</strong> - Remove from sales history
              </li>
              <li>
                <strong>Delete invoice record</strong> - Remove from invoice
                list
              </li>
              <li>
                <strong>Preserve warranty data</strong> - Keep warranty info for
                customer service
              </li>
              <li>
                <strong>Archive for audit</strong> - Keep backup for record
                keeping
              </li>
            </ul>
          </div>
          <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
            <p className='font-medium text-red-700'>
              ⚠️ This action will completely undo the invoice as if it never
              existed!
            </p>
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <Button
              variant='outline'
              text='Cancel'
              onClick={handleDeleteCancel}
            />
            <Button
              variant='fill'
              text='Delete Invoice'
              onClick={handleDeleteConfirm}
              className='bg-red-600 hover:bg-red-700'
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InvoiceGrid;
