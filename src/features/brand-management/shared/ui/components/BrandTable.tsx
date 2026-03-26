// src/features/brand-management/shared/ui/components/BrandTable.tsx
// Reusable brand table component

'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Brand } from '@/features/brand-management/entities/brand/model/types';
import { FaTrash } from 'react-icons/fa';
import Table from '@/components/table';

interface BrandTableProps {
  brands: Brand[];
  onDeleteBrand: (id: string) => void;
  onAddBrand?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const BrandTable: React.FC<BrandTableProps> = ({
  brands,
  onDeleteBrand,
  onAddBrand,
  isLoading = false,
  className = '',
}) => {
  const columns = React.useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        accessorKey: 'brandName',
        header: 'Brand Name',
        cell: (info) => (
          <span className='font-medium'>{info.getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBrand(row.original.id);
            }}
            className='text-red-500 transition-colors hover:text-red-700'
            title='Delete Brand'
            disabled={isLoading}
          >
            <FaTrash />
          </button>
        ),
      },
    ],
    [onDeleteBrand, isLoading]
  );

  return (
    <div className={className}>
      <Table
        data={brands}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search brands...'
        showButton={true}
        buttonTitle='Add Brand'
        buttonOnClick={onAddBrand || (() => {})}
      />
    </div>
  );
};
