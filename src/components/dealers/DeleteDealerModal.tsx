'use client';
import React from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { FaTrash } from 'react-icons/fa';
import { IDealer } from '@/interfaces';

interface DeleteDealerModalProps {
  isOpen: boolean;
  isLoading: boolean;
  dealerToDelete: IDealer | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteDealerModal: React.FC<DeleteDealerModalProps> = ({
  isOpen,
  isLoading,
  dealerToDelete,
  onClose,
  onConfirm,
}) => {
  if (!dealerToDelete) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Delete Dealer' size='small'>
      <div className='space-y-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <FaTrash className='h-8 w-8 text-red-600' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            Delete Dealer
          </h3>
          <p className='text-sm text-gray-500'>
            Are you sure you want to delete{' '}
            <strong>{dealerToDelete.dealerName}</strong>? This will permanently
            remove the dealer and all associated bills and images. This action
            cannot be undone.
          </p>
        </div>

        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-red-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h4 className='text-sm font-medium text-red-800'>
                Warning: Permanent Action
              </h4>
              <div className='mt-2 text-sm text-red-700'>
                <p>
                  <strong>Dealer:</strong> {dealerToDelete.dealerName}
                </p>
                <p>
                  <strong>Total Bills:</strong>{' '}
                  {dealerToDelete.totalBillsCount || 0}
                </p>
                <p>
                  <strong>Outstanding Amount:</strong> Rs{' '}
                  {dealerToDelete.currentBillOutstanding || 0}
                </p>
                <p className='mt-2 text-xs'>
                  This will delete all bills, payments, and associated images
                  from cloud storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3 pt-4'>
          <Button
            className='h-12 w-full bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-0'
            variant='fill'
            text={`Delete ${dealerToDelete.dealerName}`}
            onClick={onConfirm}
            isPending={isLoading}
            disabled={isLoading}
          />
          <Button
            className='h-12 w-full text-base focus:outline-none focus:ring-0'
            variant='outline'
            text='Cancel'
            onClick={onClose}
            disabled={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DeleteDealerModal;
