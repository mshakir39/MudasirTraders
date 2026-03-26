// src/features/category-management/shared/ui/components/CategoryTable.tsx
// Reusable category table component

'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  CategoryWithBatteryData,
  BatteryData,
} from '@/features/category-management/entities/category/model/types';
import { FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import Table from '@/components/table';

interface CategoryTableProps {
  categories: CategoryWithBatteryData[];
  onViewDetails: (category: CategoryWithBatteryData) => void;
  onEditCategory: (category: CategoryWithBatteryData) => void;
  onDeleteCategory: (category: CategoryWithBatteryData) => void;
  isLoading?: boolean;
  className?: string;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  onViewDetails,
  onEditCategory,
  onDeleteCategory,
  isLoading = false,
  className = '',
}) => {
  const columns = React.useMemo<ColumnDef<CategoryWithBatteryData>[]>(
    () => [
      {
        accessorKey: 'brandName',
        header: 'Brand Name',
        cell: (info) => (
          <span className='font-medium'>{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'series',
        header: 'Series Count',
        cell: (info) => {
          const series = info.getValue<BatteryData[]>();
          return (
            <span className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
              {series?.length || 0}
            </span>
          );
        },
      },
      {
        accessorKey: 'salesTax',
        header: 'Sales Tax',
        cell: (info) => {
          const tax = info.getValue<number>();
          return tax ? (
            <span className='font-medium text-green-600'>{tax}%</span>
          ) : (
            <span className='text-gray-400'>-</span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated Date',
        cell: (info) => {
          const updatedAt = info.getValue<string | Date>();
          if (!updatedAt) return <span className='text-gray-400'>Never</span>;

          const date = new Date(updatedAt);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return <div className='text-sm text-gray-600'>{formattedDate}</div>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <button
              onClick={() => onViewDetails(row.original)}
              className='text-blue-500 transition-colors hover:text-blue-700'
              title='View Details'
              disabled={isLoading}
            >
              <FaEye />
            </button>
            <button
              onClick={() => onEditCategory(row.original)}
              className='text-green-500 transition-colors hover:text-green-700'
              title='Edit Category'
              disabled={isLoading}
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onDeleteCategory(row.original)}
              className='text-red-500 transition-colors hover:text-red-700'
              title='Delete Category'
              disabled={isLoading}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [onViewDetails, onEditCategory, onDeleteCategory, isLoading]
  );

  return (
    <div className={className}>
      <Table
        data={categories}
        columns={columns}
        enableSearch={false}
        searchPlaceholder='Search categories...'
        showButton={false}
        buttonTitle='Add Category'
        buttonOnClick={() => {}} // Will be handled by parent
        emptyMessage='No categories found. Try adjusting your search or create a new category.'
      />
    </div>
  );
};
