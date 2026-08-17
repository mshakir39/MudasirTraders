// components/Table.tsx
import React from 'react';

interface TableProps<T> {
  data: T[];
  columns: {
    label: string;
    renderCell: (item: T, index: number) => React.ReactNode;
    className?: string;
  }[];
  footerData: any;
}

const Table: React.FC<TableProps<any>> = ({ data, columns, footerData }) => {
  return (
    <table className='w-full min-w-[400px] border-collapse sm:min-w-[500px]'>
      <thead>
        <tr className='bg-sidebar-gradient text-white'>
          {columns?.map((column, index) => (
            <th key={index} className={`p-2 text-xs font-bold sm:p-3 sm:text-sm md:p-4 md:text-base lg:text-lg ${column.className || 'text-left'}`}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, rowIndex) => (
          <tr key={rowIndex} className='hover:bg-gray-100'>
            {columns?.map((column, index) => (
              <td key={index} className={`border-b border-gray-200 p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base ${column.className || 'text-left'}`}>
                {column.renderCell(row, rowIndex)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className='bg-gray-100'>
          {columns?.map((column, index) => (
            <td key={index} className={`p-2 text-xs font-bold sm:p-3 sm:text-sm md:p-4 md:text-base lg:text-lg ${column.className || 'text-left'}`}>
              {footerData[column.label]}
            </td>
          ))}
        </tr>
        {/* <tr className="bg-transparent text-white pt-12">
  
  {Array(columns?.length - 2).fill(null).map(() => (
    <td key={Math.random()} />
  ))}
  <td className="p-4 text-lg font-bold bg-sidebar-gradient  ">Subtotal</td>
  <td className="p-4 text-lg font-bold bg-sidebar-gradient">{footerData.totalPrice || 0}</td>
</tr> */}
      </tfoot>
    </table>
  );
};

export default Table;
