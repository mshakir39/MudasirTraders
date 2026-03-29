// src/features/invoice-management/ui/components/preview/InvoicePreviewTable.tsx
// Invoice preview table component - <50 lines

'use client';

import React from 'react';
import { removeParentheses, formatCurrency } from '@/utils/formatters';
import { getAllSum } from '@/utils/getTotalSum';
import BasicTable from '@/components/basicTable';

interface InvoicePreviewTableProps {
  data: any;
}

const columns = [
  { label: 'ID', renderCell: (item: any, index: number) => index + 1 },
  {
    label: 'Name',
    renderCell: (item: any) => {
      const details = item?.batteryDetails;
      const name = details
        ? `${item.brandName} - ${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : `${item.brandName} - ${item.series}`;
      return removeParentheses(name);
    },
  },
  { label: 'Qty', renderCell: (item: any) => item.quantity },
  { label: 'Price', renderCell: (item: any) => formatCurrency(item.productPrice) },
  { label: 'Total', renderCell: (item: any) => formatCurrency(item.totalPrice) },
];

export const InvoicePreviewTable: React.FC<InvoicePreviewTableProps> = ({
  data,
}) => {
  const footerData = {
    ID: '',
    Name: 'Total',
    Qty: getAllSum(data?.products, 'quantity'),
    Price: '',
    Total: formatCurrency(getAllSum(data?.products, 'totalPrice')),
  };

  return (
    <div className='mt-6 overflow-x-auto overflow-y-hidden md:mt-8'>
      <div className='min-w-[500px]'>
        <BasicTable
          data={data?.products}
          columns={columns}
          footerData={footerData}
        />
      </div>
    </div>
  );
};
