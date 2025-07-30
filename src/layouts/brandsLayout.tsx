'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import { revalidatePathCustom } from '@/actions/revalidatePathCustom';
import { deleteBrand } from '@/actions/brandActions';
import { useBrandStore } from '@/store/brandStore';
import { IBrand } from '@/interfaces';
import { FaTrash } from 'react-icons/fa';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';

interface BrandsLayoutProps {
  initialBrands: IBrand[];
}

const BrandsLayout: React.FC<BrandsLayoutProps> = ({ initialBrands }) => {
  unstable_noStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [brand, setBrand] = useState<{ brandName: string }>({ brandName: '' });

  const { brands, fetchBrands, setBrands } = useBrandStore();

  useEffect(() => {
    // Initialize brands from server-side props
    if (initialBrands && initialBrands.length > 0) {
      setBrands(initialBrands);
    } else {
      fetchBrands();
    }
  }, [initialBrands, setBrands, fetchBrands]);

  const handleDelete = useCallback(async (id: string | undefined) => {
    if (!id) {
      toast.error('Cannot delete brand: ID is missing');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      const result = await deleteBrand(id);

      if (result.success) {
        toast.success('Brand deleted successfully');
        await revalidatePathCustom('/brands');
        await fetchBrands(); // Refresh store after delete
      } else {
        toast.error(result.error || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('An error occurred while deleting the brand');
    }
  }, [fetchBrands]);

  const columns = React.useMemo<ColumnDef<IBrand>[]>(() => [
    { 
      accessorKey: 'brandName',
      header: 'Brand Name',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.original.id);
          }}
          className='text-red-500 hover:text-red-700 transition-colors'
          title='Delete Brand'
        >
          <FaTrash />
        </button>
      ),
    },
  ], [handleDelete]);

  return (
    <div className='md:p-6 p-0 py-6'>
      <h1 className="text-2xl font-bold">Brands</h1>
      
      <Table
        data={brands}
        columns={columns}
        enableSearch={true}
        searchPlaceholder="Search brands..."
        showButton={false}
      />
    </div>
  );
};

export default BrandsLayout;
