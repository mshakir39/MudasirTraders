'use client';
import React, { useState, useEffect } from 'react';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';

// Components
import Table from '@/components/table';
import Button from '@/components/button';
import Modal from '@/components/modal';
import Input from '@/components/customInput';

// Utils and Types
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { createBrand, deleteBrand } from '@/actions/brandActions';
import { IBrand } from '../../interfaces';
import { useBrandStore } from '@/store/brandStore';

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

  const columns = [
    { label: 'Brand Name', renderCell: (item: IBrand) => item.brandName },
    {
      label: 'Actions',
      renderCell: (item: IBrand) => (
        <button
          onClick={() => handleDelete(item.id)}
          className='text-red-500 hover:text-red-700'
          title='Delete Brand'
        >
          <FaTrash />
        </button>
      ),
    },
  ];

  const handleDelete = async (id: string | undefined) => {
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
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const result = await createBrand({ brandName: brand.brandName });

      if (result.success) {
        toast.success('Brand created successfully');
        await revalidatePathCustom('/brands');
        setBrand({ brandName: '' });
        await fetchBrands(); // Refresh store after add
        setIsModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('An error occurred while adding the brand');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBrand({ ...brand, [name]: value });
  };

  return (
    <div className='md:p-6 p-0 py-6'>
     <div className='flex items-center justify-between py-2'>
        <span className='text-2xl font-bold'>Brands</span>
      </div>
      <Table
        columns={columns}
        data={brands}
        buttonTitle='Add Brand'
        buttonOnClick={() => setIsModalOpen(true)}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title='Add Brand'
      >
        <form onSubmit={handleSubmit}>
          <div className='mt-4 flex w-full flex-col gap-2'>
            <Input
              type='text'
              label='Brand Name'
              name='brandName'
              value={brand.brandName}
              onChange={handleChange}
              required
            />
            <Button
              className='w-fit'
              variant='fill'
              text='Save'
              type='submit'
              isPending={isLoading}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BrandsLayout;
