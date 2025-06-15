'use client';
import React, { useState } from 'react';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';

// Components
import Table from '@/components/table';
import Button from '@/components/button';
import Modal from '@/components/modal';
import Input from '@/components/customInput';

// Utils and Types
import { POST } from '@/utils/api';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { IBrand } from '../../interfaces';

interface BrandsLayoutProps {
  brands: IBrand[];
}

const BrandsLayout: React.FC<BrandsLayoutProps> = ({ brands }) => {
  unstable_noStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [brand, setBrand] = useState<{ brandName: string }>({ brandName: '' });

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    console.log('id', id);
    try {
      const response = await fetch('/api/brands', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Brand deleted successfully');
        await revalidatePathCustom('/brands');
      } else {
        toast.error(data.error || 'Failed to delete brand');
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
      const response: any = await POST('api/brands', brand);

      if (response?.message) {
        toast.success(response?.message);
        await revalidatePathCustom('/brands');
        setBrand({ brandName: '' });
      }

      if (response?.error) {
        toast.error(response?.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('An error occurred while adding the brand');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBrand({ ...brand, [name]: value });
  };

  return (
    <div className=''>
      <div className='flex w-full justify-between py-2'>
        <span className='text-3xl font-medium'>Brands</span>
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
