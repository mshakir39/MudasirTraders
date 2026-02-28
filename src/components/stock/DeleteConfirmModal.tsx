'use client';

import React from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { FaTrash } from 'react-icons/fa';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  title: string;
  description: React.ReactNode;
  warningContent: React.ReactNode;
  confirmText: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  isDeleting,
  title,
  description,
  warningContent,
  confirmText,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      dialogPanelClass='w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto'
    >
      <div className='space-y-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <FaTrash className='h-8 w-8 text-red-600' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>{title}</h3>
          <p className='text-sm text-gray-500'>{description}</p>
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
            <div className='ml-3'>{warningContent}</div>
          </div>
        </div>

        <div className='flex flex-col gap-3 pt-4'>
          <Button
            className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
            variant='fill'
            text={confirmText}
            onClick={onConfirm}
            isPending={isDeleting}
            disabled={isDeleting}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          />
          <Button
            className='h-12 w-full text-base focus:outline-none focus:ring-0'
            variant='outline'
            text='Cancel'
            type='button'
            onClick={onClose}
            disabled={isDeleting}
          />
        </div>
      </div>
    </Modal>
  );
}
