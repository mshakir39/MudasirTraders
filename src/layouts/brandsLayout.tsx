'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';

import { useBrandStore } from '@/store/brandStore';
import { IBrand } from '@/interfaces';
import { FaTrash, FaPlus } from 'react-icons/fa';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';

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

  const handleCreateBrand = useCallback(async () => {
    if (!brand.brandName.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brandName: brand.brandName.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Brand created successfully');
        setBrand({ brandName: '' });
        setIsModalOpen(false);
        await fetchBrands(); // Refresh store after create
      } else {
        toast.error(result.error || 'Failed to create brand');
      }
    } catch (error) {
      toast.error('An error occurred while creating the brand');
    } finally {
      setIsLoading(false);
    }
  }, [brand.brandName, fetchBrands]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    setBrand({ brandName: '' });
  }, []);

  const handleDelete = useCallback(
    async (id: string | undefined) => {
      if (!id) {
        toast.error('Cannot delete brand: ID is missing');
        return;
      }

      if (!confirm('Are you sure you want to delete this brand?')) return;

      try {
        const response = await fetch('/api/brands', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Brand deleted successfully');
          await fetchBrands(); // Refresh store after delete
        } else {
          toast.error(result.error || 'Failed to delete brand');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the brand');
      }
    },
    [fetchBrands]
  );

  const columns = React.useMemo<ColumnDef<IBrand>[]>(
    () => [
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
            className='text-red-500 transition-colors hover:text-red-700'
            title='Delete Brand'
          >
            <FaTrash />
          </button>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <div className='p-0 py-6 md:p-6'>
      <h1 className='text-2xl font-bold'>Brands</h1>

      <Table
        data={brands}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search brands...'
        showButton={true}
        buttonTitle='Add Brand'
        buttonOnClick={handleOpenModal}
      />

      {/* Create Brand Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title='Add New Brand'
      >
        <div className='space-y-4'>
          <Input
            type='text'
            label='Brand Name'
            placeholder='Enter brand name'
            value={brand.brandName}
            onChange={(e) => setBrand({ brandName: e.target.value })}
            parentClass='w-full'
          />

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              variant='outline'
              text='Cancel'
              onClick={() => setIsModalOpen(false)}
            />
            <Button
              variant='fill'
              text={isLoading ? 'Creating...' : 'Create Brand'}
              onClick={handleCreateBrand}
              disabled={isLoading}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BrandsLayout;
