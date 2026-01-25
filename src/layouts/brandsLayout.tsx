'use client';
import React, {
  useEffect,
  useState,
  useCallback,
  useOptimistic,
  useActionState,
} from 'react';
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
  serverTimestamp?: number; // React 19: Optional server timestamp for cache invalidation
}

const BrandsLayout: React.FC<BrandsLayoutProps> = ({ initialBrands }) => {
  unstable_noStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [brand, setBrand] = useState<{ brandName: string }>({ brandName: '' });

  const { brands, fetchBrands, setBrands } = useBrandStore();

  // React 19: Optimistic updates for brand creation
  const [optimisticBrands, addOptimisticBrand] = useOptimistic(
    brands,
    (state, newBrand: IBrand) => [
      ...state,
      { ...newBrand, id: `temp-${Date.now()}` },
    ]
  );

  // React 19: useActionState for form handling
  const [createState, createAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const brandName = formData.get('brandName') as string;

      if (!brandName?.trim()) {
        toast.error('Brand name is required');
        return { error: 'Brand name is required' };
      }

      try {
        // Add optimistic update
        addOptimisticBrand({ brandName: brandName.trim() } as IBrand);

        const response = await fetch('/api/brands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brandName: brandName.trim() }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Brand created successfully');
          setBrand({ brandName: '' });
          setIsModalOpen(false);
          await fetchBrands(); // Refresh store after create
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to create brand');
          return { error: result.error || 'Failed to create brand' };
        }
      } catch (error) {
        toast.error('An error occurred while creating the brand');
        return { error: 'An error occurred while creating the brand' };
      }
    },
    null
  );

  useEffect(() => {
    // Initialize brands from server-side props
    if (initialBrands && initialBrands.length > 0) {
      setBrands(initialBrands);
    } else {
      fetchBrands();
    }

    // React 19: Cleanup function to prevent memory leaks
    return () => {
      // Cleanup any pending operations if needed
    };
  }, [initialBrands, setBrands, fetchBrands]);

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

  // React 19: Enhanced useMemo with dependency tracking
  const columns = React.useMemo<ColumnDef<IBrand>[]>(
    () => [
      {
        accessorKey: 'brandName',
        header: 'Brand Name',
        // React 19: Better cell rendering with automatic memoization
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
        data={optimisticBrands}
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
        {/* React 19: Modern form with useActionState */}
        <form action={createAction} className='space-y-4'>
          <Input
            type='text'
            label='Brand Name'
            placeholder='Enter brand name'
            name='brandName'
            value={brand.brandName}
            onChange={(e) => setBrand({ brandName: e.target.value })}
            parentClass='w-full'
            required
          />

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              text='Cancel'
              onClick={() => setIsModalOpen(false)}
            />
            <Button
              type='submit'
              variant='fill'
              text={isPending ? 'Creating...' : 'Create Brand'}
              disabled={isPending}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BrandsLayout;
