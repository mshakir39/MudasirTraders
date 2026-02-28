'use client';

import { StockBatteryData } from '@/interfaces';
import React from 'react';
import { FaHistory, FaTrash } from 'react-icons/fa';

interface MobileStockListProps {
  tableData: StockBatteryData[];
  currentBrandName: string;
  onEdit: (row: StockBatteryData) => void;
  onHistory: (brandName: string, series: string) => void;
  onDelete: (row: StockBatteryData) => void;
}

export function MobileStockList({
  tableData,
  currentBrandName,
  onEdit,
  onHistory,
  onDelete,
}: MobileStockListProps) {
  if (!tableData || tableData.length === 0) {
    return (
      <div className='p-8 text-center'>
        <div className='mb-2 text-gray-400'>
          <svg
            className='mx-auto h-12 w-12'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
            />
          </svg>
        </div>
        <h3 className='mb-1 text-sm font-medium text-gray-900'>
          No stock items
        </h3>
        <p className='text-sm text-gray-500'>
          Get started by adding your first stock item.
        </p>
      </div>
    );
  }

  return (
    <div className='divide-y divide-gray-200'>
      {tableData.map((row, index) => (
        <div key={index} className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-gray-900'>
                {row.series}
              </h3>
              <div className='mt-1 flex items-center gap-4 text-xs text-gray-500'>
                <span>Stock: {row.inStock}</span>
                <span>
                  Cost: PKR {Number(row.productCost)?.toLocaleString()}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => onEdit(row)}
                className='touch-manipulation rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </button>
              <button
                onClick={() => onHistory(currentBrandName, row.series)}
                className='touch-manipulation rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200'
                title='View History'
              >
                <FaHistory className='h-4 w-4' />
              </button>
              <button
                onClick={() => onDelete(row)}
                className='touch-manipulation rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200'
                title='Delete Stock'
              >
                <FaTrash className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
