import React, { useMemo } from 'react';
import { VscPreview } from 'react-icons/vsc';
import { convertDate } from '@/utils/convertTime';
import DataGridDemo from '@/components/dataGrid';

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
  const MemoizedGridColumns = useMemo(() => {
    return [
      {
        field: 'invoiceNo',
        headerName: 'Invoice #',
        width: 100,
        sortable: true,
      },
      { field: 'customerName', headerName: 'Customer Name', width: 150 },
      {
        field: 'customerContactNumber',
        headerName: 'Contact #',
        width: 120,
      },
      { field: 'paymentMethod', headerName: 'Payment Method', width: 150 },
      {
        field: 'batteriesCountAndWeight',
        headerName: 'Batteries Count and Weight',
        width: 150,
      },
      {
        field: 'batteriesRate',
        headerName: 'Batteries Rate',
        width: 150,
        renderCell: (item: any) => {
          return (
            <span>
              {item?.row?.batteriesRate ? 'Rs ' + item?.row?.batteriesRate : ''}
            </span>
          );
        },
      },
      {
        field: 'createdDate',
        headerName: 'Created Date',
        width: 180,
        renderCell: (item: any) => {
          const { dateTime } = convertDate(item?.row?.createdDate);
          return <span>{dateTime}</span>;
        },
      },
      {
        field: 'remainingAmount',
        headerName: 'Remaining Amount',
        width: 180,
        renderCell: (item: any) => {
          return (
            <span>
              {item?.row?.remainingAmount !== 0
                ? 'Rs ' + item?.row?.remainingAmount
                : ''}
            </span>
          );
        },
      },
      {
        field: 'products',
        headerName: 'Products Sold',
        width: 150,
        renderCell: (item: any) => (
          <span
            className='cursor-pointer text-blue-500'
            title='Click here for Detail'
            onClick={() => {
              const products = item?.row?.products.map(
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
        field: 'preview',
        headerName: 'Preview',
        width: 100,
        renderCell: (item: any) => (
          <div className='flex h-full w-full items-center justify-start'>
            <VscPreview
              className='cursor-pointer'
              onClick={() => onPreview(item?.row)}
            />
          </div>
        ),
      },
      {
        field: 'make it Paid',
        headerName: 'Add Remaining Amount',
        width: 250,
        renderCell: (item: any) => (
          <div className='flex h-full w-full items-center justify-start'>
            {item?.row?.remainingAmount > 0 && (
              <span
                className='cursor-pointer text-blue-500'
                onClick={() => onEditInvoice(item?.row)}
              >
                Add Amount
              </span>
            )}
          </div>
        ),
      },
    ];
  }, [onViewProducts, onPreview, onEditInvoice]);

  return (
    <DataGridDemo
      rows={invoices}
      columns={MemoizedGridColumns}
      buttonTitle={showCreateButton ? 'Create Invoice' : undefined}
      buttonOnClick={showCreateButton ? onCreateInvoice : undefined}
      showButton={showCreateButton}
    />
  );
};

export default InvoiceGrid;