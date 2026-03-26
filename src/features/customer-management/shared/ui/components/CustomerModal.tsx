// src/features/customer-management/shared/ui/components/CustomerModal.tsx
// Customer creation/editing modal component

'use client';

import React from 'react';
import {
  Customer,
  CustomerFormData,
} from '@/features/customer-management/entities/customer/model/types';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<boolean>;
  isLoading?: boolean;
  initialData?: Customer | null;
  title?: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
  title = 'Add Customer',
}) => {
  const [formData, setFormData] = React.useState<CustomerFormData>({
    customerName: '',
    phoneNumber: '',
    address: '',
    email: '',
  });

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: initialData.customerName || '',
        phoneNumber: initialData.phoneNumber || '',
        address: initialData.address || '',
        email: initialData.email || '',
      });
    } else {
      setFormData({
        customerName: '',
        phoneNumber: '',
        address: '',
        email: '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.customerName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.address.trim()
    ) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        customerName: '',
        phoneNumber: '',
        address: '',
        email: '',
      });
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        customerName: '',
        phoneNumber: '',
        address: '',
        email: '',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input
          type='text'
          label='Customer Name'
          placeholder='Enter customer name'
          name='customerName'
          value={formData.customerName}
          onChange={(e) =>
            setFormData({ ...formData, customerName: e.target.value })
          }
          parentClass='w-full'
          required
          disabled={isLoading}
        />

        <Input
          type='tel'
          label='Phone Number'
          placeholder='Enter phone number'
          name='phoneNumber'
          value={formData.phoneNumber}
          onChange={(e) =>
            setFormData({ ...formData, phoneNumber: e.target.value })
          }
          parentClass='w-full'
          required
          disabled={isLoading}
        />

        <Input
          type='text'
          label='Address'
          placeholder='Enter address'
          name='address'
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          parentClass='w-full'
          required
          disabled={isLoading}
        />

        <Input
          type='email'
          label='Email (Optional)'
          placeholder='Enter email address'
          name='email'
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          parentClass='w-full'
          disabled={isLoading}
        />

        <div className='flex justify-end gap-3 pt-4'>
          <Button
            type='button'
            variant='outline'
            text='Cancel'
            onClick={handleClose}
            disabled={isLoading}
          />
          <Button
            type='submit'
            variant='fill'
            text={
              isLoading
                ? 'Saving...'
                : initialData
                  ? 'Update Customer'
                  : 'Create Customer'
            }
            disabled={
              isLoading ||
              !formData.customerName.trim() ||
              !formData.phoneNumber.trim() ||
              !formData.address.trim()
            }
          />
        </div>
      </form>
    </Modal>
  );
};
