import React from 'react';
import { formatCurrency } from '@/utils/formatters';

interface InvoiceTableProps<T> {
  data: T[];
  columns: {
    label: string;
    renderCell: (item: T, index: number) => React.ReactNode;
  }[];
  footerData: any;
}

const InvoiceTable: React.FC<InvoiceTableProps<any>> = ({
  data,
  columns,
  footerData,
}) => {
  // Add space to Amount in footerData
  const modifiedFooterData = {
    ...footerData,
    Amount: footerData['Amount']
      ? footerData['Amount'].replace('Rs', formatCurrency(0).split('0')[0])
      : footerData['Amount'],
  };

  return (
    <div className='w-full'>
      {/* Mobile View - Card Layout */}
      <div className='block md:hidden lg:hidden'>
        {data?.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className='mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:mb-4 sm:p-4'
          >
            <div className='space-y-2 sm:space-y-3'>
              <div className='flex items-center justify-between border-b pb-2'>
                <span className='text-sm font-bold text-gray-800 sm:text-base'>
                  Item #{rowIndex + 1}
                </span>
                <span className='text-sm font-bold text-gray-800 sm:text-base'>
                  {formatCurrency(row.totalPrice)}
                </span>
              </div>
              <div className='text-xs text-gray-700 sm:text-sm'>
                <div className='font-medium'>
                  {columns[1].renderCell(row, rowIndex)}
                </div>
                <div className='text-gray-600'>Qty: {row.quantity}</div>
                <div className='text-gray-600'>
                  Price: {formatCurrency(row.productPrice)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table Layout */}
      <div className='hidden overflow-x-auto md:block lg:block'>
        <table className='w-full min-w-[500px] border-collapse sm:min-w-[600px]'>
          <thead>
            <tr className='bg-dark-900 text-white'>
              {columns?.map((column, index) => (
                <th
                  key={index}
                  className='p-2 text-left text-xs font-bold sm:p-3 sm:text-sm md:p-4 md:text-base lg:text-lg'
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className='border-b border-gray-100 hover:bg-gray-50'
              >
                {columns?.map((column, index) => (
                  <td
                    key={index}
                    className='p-2 text-left text-xs text-gray-700 sm:p-3 sm:text-sm md:p-4 md:text-base'
                  >
                    {column.renderCell(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='bg-gray-100 font-bold'>
              {columns?.map((column, index) => (
                <td
                  key={index}
                  className='border-t-2 border-gray-300 p-2 text-left text-xs font-bold sm:p-3 sm:text-sm md:p-4 md:text-base lg:text-lg'
                >
                  {modifiedFooterData[column.label]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
