// src/features/invoice-management/ui/components/InvoiceModals.tsx
// Invoice modals component - <80 lines

'use client';

import React, { useState } from 'react';
import {
  Invoice,
  InvoiceModalState,
  InvoiceModalType,
} from '@/entities/invoice';

// Import the existing modals for full functionality
import { default as InvoicePreviewModal } from './InvoicePreviewModal';
import { InvoiceEditModal } from './index';
// Import the new smaller modal components
import { InvoiceCreateModal, InvoicePaymentModal } from './index';

interface InvoiceModalsProps {
  modalState: InvoiceModalState;
  onClose: () => void;
  onCreateInvoice: (data: Partial<Invoice>) => void;
  onUpdateInvoice: (data: Partial<Invoice>) => void;
  onAddPayment: (invoiceId: string, amount: number, method: string) => void;
  categories: any[];
  stock: any[];
  isLoading: boolean;
  className?: string;
  customers?: any[];
  brandOptions?: any[];
  accordionMethods?: any;
  accordionData?: any;
  products?: any[];
}

export const InvoiceModals: React.FC<InvoiceModalsProps> = ({
  modalState,
  onClose,
  onCreateInvoice,
  onUpdateInvoice,
  onAddPayment,
  categories,
  stock,
  isLoading,
  className = '',
  customers = [],
  brandOptions = [],
  accordionMethods = null,
  accordionData = {},
}) => {
  // No need for useInvoiceForm hook since new modals handle their own state
  const renderModalContent = () => {
    switch (modalState.type) {
      case 'create':
        // Use the new InvoiceCreateModal for full create functionality
        return (
          <InvoiceCreateModal
            isOpen={modalState.isOpen}
            onClose={onClose}
            onSubmit={onCreateInvoice}
            isLoading={isLoading}
            categories={categories}
            customers={customers}
            stock={stock}
          />
        );

      case 'edit':
        // Use the existing EditInvoiceModal for full edit functionality
        return (
          <InvoiceEditModal
            isOpen={modalState.isOpen}
            onClose={onClose}
            invoice={modalState.data as Invoice}
            onSubmit={onUpdateInvoice}
            isLoading={isLoading}
            categories={categories}
            customers={customers}
            stock={stock}
          />
        );

      case 'preview':
        // Use the existing InvoicePreviewModal with full functionality
        return (
          <InvoicePreviewModal
            isOpen={modalState.isOpen}
            onClose={onClose}
            data={modalState.data}
          />
        );

      case 'payment':
        // Use the new InvoicePaymentModal for payment functionality
        return (
          <InvoicePaymentModal
            isOpen={modalState.isOpen}
            onClose={onClose}
            invoice={modalState.data as Invoice}
            onSubmit={(amount, method) => {
              onAddPayment(modalState.data?.id || '', amount, method);
            }}
            isLoading={isLoading}
          />
        );

      case 'productDetail':
        return (
          <div className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>Product Details</h3>
            <div className='space-y-4'>
              <div className='max-h-96 overflow-y-auto'>
                {modalState.data?.products?.map((product, index) => (
                  <div
                    key={index}
                    className='mb-3 border-b border-gray-200 pb-3 last:border-b-0'
                  >
                    <div className='font-medium'>
                      {product.brandName} {product.series}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Quantity: {product.quantity} × Rs{' '}
                      {product.productPrice?.toLocaleString() || '0'} = Rs{' '}
                      {product.totalPrice?.toLocaleString() || '0'}
                    </div>
                    {product.warrentyCode && (
                      <div className='text-sm text-gray-600'>
                        Warranty: {product.warrentyCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className='flex justify-end'>
                <button
                  onClick={onClose}
                  className='rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // For create modal, return the InvoiceCreateModal directly
  if (modalState.type === 'create' && modalState.isOpen) {
    return (
      <InvoiceCreateModal
        isOpen={modalState.isOpen}
        onClose={onClose}
        onSubmit={onCreateInvoice}
        isLoading={isLoading}
        categories={categories}
        customers={customers}
        stock={stock}
      />
    );
  }

  // For preview modal, return the InvoicePreviewModal directly to get the full functionality
  if (modalState.type === 'preview' && modalState.isOpen) {
    return (
      <InvoicePreviewModal
        isOpen={modalState.isOpen}
        onClose={onClose}
        data={modalState.data}
      />
    );
  }

  // For edit modal, return the EditInvoiceModal directly
  if (modalState.type === 'edit' && modalState.isOpen) {
    return (
      <InvoiceEditModal
        isOpen={modalState.isOpen}
        onClose={onClose}
        invoice={modalState.data as Invoice}
        onSubmit={onUpdateInvoice}
        isLoading={isLoading}
        categories={categories}
        customers={customers}
        stock={stock}
      />
    );
  }

  // For payment modal, return the InvoicePaymentModal directly
  if (modalState.type === 'payment' && modalState.isOpen) {
    return (
      <InvoicePaymentModal
        isOpen={modalState.isOpen}
        onClose={onClose}
        invoice={modalState.data as Invoice}
        onSubmit={(amount, method) => {
          onAddPayment(modalState.data?.id || '', amount, method);
        }}
        isLoading={isLoading}
      />
    );
  }

  // For other modals, use the custom modal implementation
  if (!modalState.isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl'>
        {renderModalContent()}
      </div>
    </div>
  );
};
