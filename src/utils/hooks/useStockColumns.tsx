'use client';

import React, { useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FaEdit, FaHistory, FaTrash } from 'react-icons/fa';
import { ICategory, StockBatteryData } from '../../interfaces';
import { getMaxRetailPrice } from '../stockUtils';

interface UseStockColumnsParams {
  currentBrandName: string;
  categories: ICategory[];
  onEdit: (item: StockBatteryData, brandName: string) => void;
  onDelete: (item: StockBatteryData, brandName: string) => void;
  onHistory: (brandName: string, series: string) => void;
}

export function useStockColumns({
  currentBrandName,
  categories,
  onEdit,
  onDelete,
  onHistory,
}: UseStockColumnsParams): ColumnDef<StockBatteryData>[] {
  return React.useMemo(
    () => [
      {
        accessorKey: 'series',
        header: 'Series',
        cell: ({ row }) => {
          const bd = row.original.batteryDetails;
          return bd ? (
            <div>
              <div>{bd.name}</div>
              <div className='text-xs text-gray-500'>
                {bd.ah}AH{bd.type && `, ${bd.type}`}
              </div>
            </div>
          ) : (
            row.original.series
          );
        },
      },
      {
        id: 'plates',
        header: 'Plates',
        cell: ({ row }) => row.original.batteryDetails?.plate || 'N/A',
      },
      {
        id: 'productCost',
        header: 'Product Cost',
        accessorFn: (row) => {
          const num = Number(String(row.productCost).replace(/,/g, ''));
          return isNaN(num) ? 0 : num;
        },
        cell: ({ row }) =>
          `Rs ${Number(row.original.productCost).toLocaleString()}`,
      },
      {
        id: 'maxRetailPrice',
        header: () => {
          const category = categories.find(
            (cat) => cat.brandName === currentBrandName
          );
          return `Max Retail Price (${category?.salesTax || 0}% Tax)`;
        },
        accessorFn: (row) => {
          const priceData = getMaxRetailPrice(
            categories,
            currentBrandName,
            row.series
          );
          const num = Number(
            String(priceData.maxRetailPrice).replace(/,/g, '')
          );
          return isNaN(num) ? 0 : num;
        },
        cell: ({ row }) => {
          const priceData = getMaxRetailPrice(
            categories,
            currentBrandName,
            row.original.series
          );
          if (priceData.maxRetailPrice === 'N/A') {
            return (
              <div className='flex w-full items-center justify-start'>
                <span className='font-medium text-gray-500'>Rs N/A</span>
              </div>
            );
          }
          return (
            <div className='flex w-full items-center justify-start'>
              <span className='font-medium text-gray-900'>
                Rs {Number(priceData.maxRetailPrice).toLocaleString()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'inStock',
        header: 'In Stock',
        cell: ({ row }) => Number(row.original.inStock).toLocaleString(),
      },
      {
        accessorKey: 'soldCount',
        header: 'Sold Count',
        cell: ({ row }) => Number(row.original.soldCount || 0).toLocaleString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original, currentBrandName);
              }}
              className='p-2 text-blue-600 transition-colors hover:text-blue-800'
              title='Edit Stock'
            >
              <FaEdit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHistory(currentBrandName, row.original.series);
              }}
              className='p-2 text-gray-600 transition-colors hover:text-gray-800'
              title='View History'
            >
              <FaHistory size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original, currentBrandName);
              }}
              className='p-2 text-red-600 transition-colors hover:text-red-800'
              title='Delete Stock'
            >
              <FaTrash size={16} />
            </button>
          </div>
        ),
      },
    ],
    [currentBrandName, categories, onEdit, onDelete, onHistory]
  );
}
