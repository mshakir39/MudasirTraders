// src/features/invoice-management/ui/components/InvoiceDeleteModal.tsx
// Invoice deletion confirmation modal - <50 lines

'use client';

import React from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';

interface InvoiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceNo: string;
  isLoading: boolean;
}

export const InvoiceDeleteModal: React.FC<InvoiceDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  invoiceNo,
  isLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete Invoice ${invoiceNo}`}
      size='small'
    >
      <div className='space-y-3 sm:space-y-4'>
        <p className='text-sm text-gray-700 sm:text-base'>
          Are you sure you want to <strong>completely revert</strong> invoice{' '}
          <strong>{invoiceNo}</strong>?
        </p>

        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4'>
          <h4 className='mb-2 text-sm font-semibold text-yellow-800 sm:text-base'>
            ⚠️ This action will:
          </h4>
          <ul className='list-inside list-disc space-y-1 text-xs text-yellow-700 sm:text-sm'>
            <li>
              <strong>Restore stock quantities</strong> - Add back all product
              quantities
            </li>
            <li>
              <strong>Preserve warranty data</strong> - Move warranties to
              history
            </li>
            <li>
              <strong>Delete sales record</strong> - Remove from sales history
            </li>
            <li>
              <strong>Delete invoice record</strong> - Remove from invoice list
            </li>
            <li>
              <strong>Archive data</strong> - Keep audit trail in archived
              records
            </li>
          </ul>
        </div>

        <div className='rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4'>
          <h4 className='mb-2 text-sm font-semibold text-red-800 sm:text-base'>🚨 Important:</h4>
          <p className='text-xs text-red-700 sm:text-sm'>
            This action <strong>cannot be undone</strong>. All invoice data will
            be permanently removed (except for warranty history which is
            preserved for tracking purposes).
          </p>
        </div>

        <div className='flex justify-end gap-2 pt-3 sm:gap-3 sm:pt-4'>
          <Button
            variant='outline'
            text='Cancel'
            onClick={onClose}
            disabled={isLoading}
            className='border-gray-300 text-gray-700 hover:bg-gray-50'
          />
          <Button
            variant='fill'
            text='Delete Invoice'
            onClick={onConfirm}
            disabled={isLoading}
            className='bg-red-600 hover:bg-red-700'
            isPending={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};
