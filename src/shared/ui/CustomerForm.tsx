// src/shared/ui/CustomerForm.tsx
// Customer form component - <100 lines

import React from 'react';
import Input from '@/components/customInput';
import Button from '@/components/button';
import { CustomerFormData } from '@/entities/customer/model/types';

interface CustomerFormProps {
  form: CustomerFormData;
  onFormChange: (form: CustomerFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending?: boolean;
  isEdit?: boolean;
  className?: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  form,
  onFormChange,
  onSubmit,
  onCancel,
  isPending = false,
  isEdit = false,
  className = ''
}) => {
  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    onFormChange({
      ...form,
      [field]: value
    });
  };

  return (
    <div className={`mt-4 flex flex-col gap-4 ${className}`}>
      <Input
        label='Customer Name'
        name='customerName'
        value={form.customerName}
        onChange={(e) => handleInputChange('customerName', e.target.value)}
        required
      />
      
      <Input
        label='Phone Number'
        name='phoneNumber'
        value={form.phoneNumber}
        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
        required
      />
      
      <Input
        label='Address'
        name='address'
        value={form.address}
        onChange={(e) => handleInputChange('address', e.target.value)}
      />
      
      <Input
        label='Email'
        name='email'
        type='email'
        value={form.email || ''}
        onChange={(e) => handleInputChange('email', e.target.value)}
      />
      
      <div className='flex gap-3'>
        <Button
          type='button'
          variant='outline'
          text='Cancel'
          onClick={onCancel}
        />
        <Button
          type='submit'
          variant='fill'
          text={isPending ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
          disabled={isPending}
        />
      </div>
    </div>
  );
};
