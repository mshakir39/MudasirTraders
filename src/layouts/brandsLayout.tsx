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
import { POST } from '@/utils/api';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { IBrand } from '../../interfaces';
import { useBrandStore } from '@/store/brandStore';

const BrandsLayout: React.FC = () => {
  unstable_noStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [brand, setBrand] = useState<{ brandName: string }>({ brandName: '' });

  const brands = useBrandStore((s) => s.brands);
  const fetchBrands = useBrandStore((s) => s.fetchBrands);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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
        await fetchBrands(); // Refresh store after delete
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
        await fetchBrands(); // Refresh store after add
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
