// src/features/invoice-management/ui/components/grid/InvoiceGridActions.tsx
// Invoice grid actions menu component - <80 lines

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaFileInvoice,
  FaEdit,
  FaMoneyBillWave,
  FaTrash,
} from 'react-icons/fa';

interface InvoiceGridActionsProps {
  invoice: any;
  onPreview: (invoice: any) => void;
  onEditInvoice: (invoice: any) => void;
  onAddPayment: (invoice: any) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoiceGridActions: React.FC<InvoiceGridActionsProps> = ({
  invoice,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate menu position when opening
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 192 + window.scrollX, // 192 is the menu width (w-48)
      });
    }
    setIsOpen(!isOpen);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'preview':
        onPreview(invoice);
        break;
      case 'edit':
        onEditInvoice(invoice);
        break;
      case 'payment':
        onAddPayment(invoice);
        break;
      case 'delete':
        onDeleteInvoice(invoice.id);
        break;
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className='relative inline-block text-left'>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className='inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0'
          id='actions-menu-button'
          aria-expanded={isOpen}
          aria-haspopup='true'
        >
          <svg
            className='h-5 w-5'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <circle cx='10' cy='5' r='1.5' />
            <circle cx='10' cy='10' r='1.5' />
            <circle cx='10' cy='15' r='1.5' />
          </svg>
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <div className='py-1'>
              <div
                className='flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                onClick={() => handleAction('preview')}
              >
                <FaFileInvoice className='text-green-600' />
                Preview
              </div>
              {invoice.status !== 'voided' && (
                <div
                  className='flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  onClick={() => handleAction('edit')}
                >
                  <FaEdit className='text-indigo-600' />
                  Edit
                </div>
              )}
              {invoice.paymentStatus !== 'paid' &&
                invoice.status !== 'voided' && (
                  <div
                    className='flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    onClick={() => handleAction('payment')}
                  >
                    <FaMoneyBillWave className='text-yellow-600' />
                    Add Payment
                  </div>
                )}
              <div
                className='flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                onClick={() => handleAction('delete')}
              >
                <FaTrash className='text-red-600' />
                Delete
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
