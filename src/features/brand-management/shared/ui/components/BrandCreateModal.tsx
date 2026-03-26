// src/features/brand-management/shared/ui/components/BrandCreateModal.tsx
// Brand creation modal component

'use client';

import React from 'react';
import { BrandFormData } from '@/features/brand-management/entities/brand/model/types';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';

interface BrandCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BrandFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: BrandFormData;
}

export const BrandCreateModal: React.FC<BrandCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = { brandName: '' },
}) => {
  const [formData, setFormData] = React.useState<BrandFormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName.trim()) return;
    
    await onSubmit(formData);
    setFormData({ brandName: '' });
  };

  const handleClose = () => {
    setFormData({ brandName: '' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Add New Brand'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input
          type='text'
          label='Brand Name'
          placeholder='Enter brand name'
          name='brandName'
          value={formData.brandName}
          onChange={(e) => setFormData({ brandName: e.target.value })}
          parentClass='w-full'
          required
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
            text={isLoading ? 'Creating...' : 'Create Brand'}
            disabled={isLoading || !formData.brandName.trim()}
          />
        </div>
      </form>
    </Modal>
  );
};
