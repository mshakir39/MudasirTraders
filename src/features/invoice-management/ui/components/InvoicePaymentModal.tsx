// src/features/invoice-management/ui/components/InvoicePaymentModal.tsx
// Payment modal for adding payments - <60 lines

'use client';

import React from 'react';
import Modal from '@/components/modal';
import { Invoice } from '@/entities/invoice';

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSubmit: (amount: number, method: string) => void;
  isLoading: boolean;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
  isLoading,
}) => {
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');

  // Calculate correct total and remaining amounts for consolidated invoices
  // Use useMemo to recalculate when invoice data changes
  const { totalAmount, remainingAmount } = React.useMemo(() => {
    let totalAmount;
    let remainingAmount;

    if (invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0) {
      // For consolidated invoices, total includes both consolidated amount and new items
      const consolidatedAmount =
        invoice.previousAmounts?.reduce(
          (sum: number, amount: number) => sum + amount,
          0
        ) || 0;
      const newItemsAmount =
        invoice.products?.reduce(
          (sum: number, product: any) => sum + (product.totalPrice || 0),
          0
        ) || 0;
      totalAmount = consolidatedAmount + newItemsAmount;

      // Calculate remaining amount for consolidated invoices
      const initialReceived = invoice.receivedAmount || 0;
      const additionalPayments = invoice.additionalPayment || [];
      const batteriesRate = invoice.batteriesRate || 0;
      const totalAdditionalReceived = additionalPayments.reduce(
        (sum: number, payment: any) => sum + Number(payment.amount),
        0
      );
      const totalReceived = initialReceived + totalAdditionalReceived;
      remainingAmount = totalAmount - totalReceived - batteriesRate;
    } else {
      // For normal invoices, use the stored amounts
      totalAmount = invoice.totalAmount || 0;
      remainingAmount = invoice.remainingAmount || 0;
    }

    return { totalAmount, remainingAmount };
  }, [
    invoice.consolidatedFrom,
    invoice.previousAmounts,
    invoice.products,
    invoice.totalAmount,
    invoice.remainingAmount,
    invoice.receivedAmount,
    invoice.additionalPayment,
    invoice.batteriesRate,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > remainingAmount) {
      alert('Payment amount cannot exceed remaining amount');
      return;
    }

    onSubmit(amount, paymentMethod);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Payment - Invoice #${invoice.invoiceNo}`}
      size='medium'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='rounded-lg bg-gray-50 p-4'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='font-medium'>Total Amount:</span> Rs{' '}
              {totalAmount.toLocaleString()}
            </div>
            <div>
              <span className='font-medium'>Received:</span> Rs{' '}
              {invoice.receivedAmount?.toLocaleString() || '0'}
            </div>
            <div className='col-span-2'>
              <span className='font-medium text-red-600'>Remaining:</span> Rs{' '}
              {remainingAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Payment Amount *
          </label>
          <input
            type='number'
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter payment amount'
            min='0'
            step='0.01'
            max={remainingAmount}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Payment Method *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          >
            <option value='Cash'>Cash</option>
            <option value='Bank Transfer'>Bank Transfer</option>
            <option value='Credit Card'>Credit Card</option>
            <option value='JazzCash'>JazzCash</option>
            <option value='EasyPaisa'>EasyPaisa</option>
          </select>
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isLoading}
            className='rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300'
          >
            {isLoading ? 'Processing...' : 'Add Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
