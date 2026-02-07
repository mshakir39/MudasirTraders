import React, { useMemo, useState, useCallback } from 'react';
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
  onAddPayment: (data: any) => void;
  showCreateButton?: boolean;
}

const InvoiceGrid: React.FC<InvoiceGridProps> = ({
  invoices,
  onCreateInvoice,
  onViewProducts,
  onPreview,
  onEditInvoice,
  onAddPayment,
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

  const [revertPaymentModal, setRevertPaymentModal] = useState<{
    isOpen: boolean;
    invoiceId: string;
    invoiceNo: string;
    payments: any[];
  }>({
    isOpen: false,
    invoiceId: '',
    invoiceNo: '',
    payments: [],
  });

  const handleDeleteClick = useCallback(
    (invoiceId: string, invoiceNo: string) => {
      setDeleteModal({
        isOpen: true,
        invoiceId,
        invoiceNo,
      });
    },
    []
  );

  const handleRevertPaymentClick = useCallback((invoice: any) => {
    setRevertPaymentModal({
      isOpen: true,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      payments: invoice.additionalPayment || [],
    });
  }, []);

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
      } else {
        toast.error(result.error || 'Failed to cleanup stock data');
      }
    } catch (error) {
      toast.error('Failed to cleanup stock data');
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
       {
      accessorKey: 'invoiceNo',
      header: 'Invoice #',
      // Add explicit string conversion
      cell: ({ row }) => String(row.original.invoiceNo || ''),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Name',
      cell: ({ row }) => String(row.original.customerName || ''),
    },
    {
      accessorKey: 'customerContactNumber',
      header: 'Contact #',
      cell: ({ row }) => String(row.original.customerContactNumber || ''),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
      cell: ({ row }) => String(row.original.paymentMethod || ''),
    },
    {
      accessorKey: 'batteriesCountAndWeight',
      header: 'Batteries Count and Weight',
      cell: ({ row }) => String(row.original.batteriesCountAndWeight || ''),
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
        id: 'remainingAmount',
        accessorFn: (row: any) => Number(row.remainingAmount ?? 0),
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
          <div className='flex h-full w-full items-center justify-start gap-2'>
            <VscPreview
              className='cursor-pointer text-blue-600 transition-colors duration-200 hover:text-blue-800'
              onClick={(e) => {
                e.stopPropagation();
                onPreview(row.original);
              }}
              title='Preview Invoice'
            />
          </div>
        ),
      },
      {
        id: 'edit',
        header: 'Edit',
        cell: ({ row }) => (
          <div className='flex h-full w-full items-center justify-start'>
            <span
              className='cursor-pointer text-blue-600 transition-colors duration-200 hover:text-blue-800'
              onClick={(e) => {
                e.stopPropagation();
                onEditInvoice(row.original);
              }}
              title='Edit Invoice'
            >
              ✏️ Edit
            </span>
          </div>
        ),
      },
      {
        id: 'makeItPaid',
        header: 'Add Payment',
        cell: ({ row }) => (
          <div className='flex h-full w-full items-center justify-start'>
            {row.original.remainingAmount > 0 && (
              <span
                className='cursor-pointer text-emerald-600 transition-colors duration-200 hover:text-emerald-800'
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPayment(row.original);
                }}
                title='Add Payment'
              >
                💰 Pay
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'revertPayment',
        header: 'Revert Payment',
        cell: ({ row }) => (
          <div className='flex h-full w-full items-center justify-start'>
            {row.original.additionalPayment &&
              row.original.additionalPayment.length > 0 && (
                <span
                  className='cursor-pointer text-orange-600 transition-colors duration-200 hover:text-orange-800'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRevertPaymentClick(row.original);
                  }}
                  title='Revert Payment'
                >
                  ↩️ Revert
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
              className='cursor-pointer rounded-full p-2 text-red-600 transition-colors duration-200 hover:text-red-800'
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
    [
      onViewProducts,
      onPreview,
      onEditInvoice,
      onAddPayment,
      handleDeleteClick,
      handleRevertPaymentClick,
    ]
  );
  return (
    <>
      <Table
  data={invoices}
  columns={columns}
  enableSearch={true}
  searchPlaceholder='Search invoices...'
  enablePagination={true}
  pageSize={10}
  enableRowVirtualization={true}
  tableBodyHeight={600}
  buttonTitle={showCreateButton ? 'Create Invoice' : undefined}
  buttonOnClick={showCreateButton ? onCreateInvoice : undefined}
  showButton={showCreateButton}
  // Add this prop to handle search properly
  extraGlobalSearchText={(row: any) => {
    const searchableFields = [
      row.invoiceNo,
      row.customerName,
      row.customerContactNumber,
      row.paymentMethod,
      row.batteriesCountAndWeight,
      row.batteriesRate,
      row.remainingAmount,
      // Convert date to searchable format
      row.createdDate ? convertDate(row.createdDate).dateTime : '',
      // Convert products array to searchable text
      row.products?.map((p: any) => 
        `${p.name || ''} ${p.category || ''} ${p.brand || ''}`
      ).join(' ') || '',
    ];
    
    return searchableFields
      .filter(Boolean)
      .map(field => String(field || ''))
      .join(' ');
  }}
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
      <RevertPaymentModal
        isOpen={revertPaymentModal.isOpen}
        onClose={() =>
          setRevertPaymentModal({
            isOpen: false,
            invoiceId: '',
            invoiceNo: '',
            payments: [],
          })
        }
        invoiceId={revertPaymentModal.invoiceId}
        invoiceNo={revertPaymentModal.invoiceNo}
        payments={revertPaymentModal.payments}
      />
    </>
  );
};

const RevertPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNo: string;
  payments: any[];
}> = ({ isOpen, onClose, invoiceId, invoiceNo, payments }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRevertPayment = async (paymentIndex: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoice/revert-payment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          paymentIndex,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Payment of Rs ${result.revertedAmount} reverted successfully. New remaining: Rs ${result.newRemainingAmount}`
        );
        onClose();
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to revert payment');
      }
    } catch (error: any) {
      toast.error('An error occurred while reverting payment');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const { dateTime } = convertDate(date);
    return dateTime;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Revert Payment - Invoice #${invoiceNo}`}
      size='medium'
    >
      <div className='space-y-4'>
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
          <p className='text-sm text-orange-800'>
            ℹ️ <strong>Note:</strong> Reverting a payment will restore the
            invoice&apos;s remaining balance and remove the payment from
            history.
          </p>
        </div>

        {payments.length === 0 ? (
          <p className='text-center text-gray-500'>
            No additional payments found.
          </p>
        ) : (
          <div className='space-y-3'>
            <h4 className='font-semibold text-gray-700'>
              Select a payment to revert:
            </h4>
            {payments.map((payment, index) => (
              <div
                key={index}
                className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50'
              >
                <div className='flex-1'>
                  <div className='font-medium text-gray-900'>
                    Rs {payment.amount}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {formatDate(payment.addedDate)}
                  </div>
                  {payment.paymentMethod && (
                    <div className='mt-1 text-xs text-gray-600'>
                      Payment Method: {payment.paymentMethod.join(' + ')}
                    </div>
                  )}
                </div>
                <Button
                  variant='outline'
                  text='Revert'
                  onClick={() => handleRevertPayment(index)}
                  className='border-orange-500 text-orange-600 hover:bg-orange-50'
                  disabled={isLoading}
                  isPending={isLoading}
                />
              </div>
            ))}
          </div>
        )}

        <div className='flex justify-end pt-4'>
          <Button
            variant='outline'
            text='Close'
            onClick={onClose}
            disabled={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceGrid;
