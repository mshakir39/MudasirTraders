// src/features/invoice-management/ui/components/InvoicePaymentSection.tsx
// Invoice payment section - <150 lines

'use client';

import React, { useEffect } from 'react';
import Button from '@/components/button';
import { InvoiceFormData } from '@/entities/invoice';

interface InvoicePaymentSectionProps {
  invoiceData: InvoiceFormData;
  setInvoiceData: (data: InvoiceFormData) => void;
  previousRemainingAmount?: number;
}

export const InvoicePaymentSection: React.FC<InvoicePaymentSectionProps> = ({
  invoiceData,
  setInvoiceData,
  previousRemainingAmount = 0,
}) => {
  const totalAmount = invoiceData.totalAmount || 0;
  const receivedAmount = invoiceData.receivedAmount || 0;
  const batteriesRate = invoiceData.batteriesRate || 0;

  // Calculate effective total (subtract battery amount if Old Battery is selected)
  const effectiveTotalAmount = invoiceData.paymentMethod?.includes(
    'Old Battery'
  )
    ? totalAmount - batteriesRate
    : totalAmount;

  const remainingAmount = effectiveTotalAmount - receivedAmount;
  const hasRemainingAmount = remainingAmount > 0;

  // Auto-handle Pay Later checkbox based on remaining amount
  useEffect(() => {
    const currentMethods = invoiceData.paymentMethod || [];
    const hasPayLater = currentMethods.includes('Pay Later');

    console.log('🔍 Pay Later Debug:', {
      totalAmount,
      receivedAmount,
      effectiveTotalAmount,
      remainingAmount,
      hasRemainingAmount,
      currentMethods,
      hasPayLater,
      shouldUpdate: hasRemainingAmount !== hasPayLater,
    });

    // Only update if there's a mismatch between remaining amount and Pay Later status
    if (hasRemainingAmount !== hasPayLater) {
      if (hasRemainingAmount) {
        // Add Pay Later if there's remaining amount but it's not selected
        console.log('🔧 Adding Pay Later to payment methods');
        setInvoiceData({
          ...invoiceData,
          paymentMethod: [...currentMethods, 'Pay Later'],
        });
      } else {
        // Remove Pay Later if no remaining amount but it's selected
        console.log('🔧 Removing Pay Later from payment methods');
        setInvoiceData({
          ...invoiceData,
          paymentMethod: currentMethods.filter((m) => m !== 'Pay Later'),
        });
      }
    }
  }, [hasRemainingAmount]); // Only depend on hasRemainingAmount

  // Additional effect to handle initial mount and ensure Pay Later is set correctly
  useEffect(() => {
    const currentMethods = invoiceData.paymentMethod || [];
    const hasPayLater = currentMethods.includes('Pay Later');

    console.log('🔍 Initial Mount Debug:', {
      totalAmount,
      receivedAmount,
      effectiveTotalAmount,
      remainingAmount,
      hasRemainingAmount,
      currentMethods,
      hasPayLater,
    });

    // Force update on mount if there's remaining amount but no Pay Later
    if (hasRemainingAmount && !hasPayLater) {
      console.log('🔧 Force adding Pay Later on mount');
      setInvoiceData({
        ...invoiceData,
        paymentMethod: [...currentMethods, 'Pay Later'],
      });
    }
  }, []); // Run once on mount

  const updatePaymentMethod = (method: string, checked: boolean) => {
    const currentMethods = invoiceData.paymentMethod || [];

    if (checked) {
      setInvoiceData({
        ...invoiceData,
        paymentMethod: [...currentMethods, method],
      });
    } else {
      setInvoiceData({
        ...invoiceData,
        paymentMethod: currentMethods.filter((m) => m !== method),
      });
    }
  };

  return (
    <div className='space-y-3'>
      <h3 className='text-lg font-semibold'>Payment Information</h3>

      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          Payment Methods
        </label>
        <div className='flex flex-wrap gap-3'>
          {[
            'Cash',
            'Bank Transfer',
            'JazzCash',
            'EasyPaisa',
            'Old Battery',
            'Pay Later',
            'Other',
          ].map((method) => (
            <label key={method} className='flex items-center'>
              <input
                type='checkbox'
                checked={invoiceData.paymentMethod?.includes(method) || false}
                onChange={(e) => updatePaymentMethod(method, e.target.checked)}
                className='mr-2'
                disabled={
                  (method === 'Pay Later' && hasRemainingAmount) || // Disabled when auto-selected
                  (method === 'Pay Later' && !hasRemainingAmount) // Also disabled when no remaining amount
                }
                title={
                  method === 'Pay Later' && hasRemainingAmount
                    ? 'Pay Later is automatically enabled when there is remaining amount'
                    : method === 'Pay Later' && !hasRemainingAmount
                      ? 'Pay Later is not needed when payment is complete'
                      : ''
                }
              />
              <span
                className={`text-sm ${
                  method === 'Pay Later' ? 'text-gray-500' : ''
                }`}
                title={
                  method === 'Pay Later' && hasRemainingAmount
                    ? 'Pay Later is automatically enabled when there is remaining amount'
                    : method === 'Pay Later' && !hasRemainingAmount
                      ? 'Pay Later is not needed when payment is complete'
                      : ''
                }
              >
                {method}
                {method === 'Pay Later' &&
                  (hasRemainingAmount ? ' (Auto)' : ' (Not Needed)')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Battery fields when Old Battery is selected */}
      {invoiceData.paymentMethod?.includes('Old Battery') && (
        <div className='flex gap-3'>
          <div className='flex-1'>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Battery Count and Weight
            </label>
            <input
              type='text'
              value={invoiceData.batteriesCountAndWeight || ''}
              onChange={(e) =>
                setInvoiceData({
                  ...invoiceData,
                  batteriesCountAndWeight: e.target.value,
                })
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='e.g., 21kg, 2 batteries'
              maxLength={50}
            />
          </div>
          <div className='flex-1'>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Batteries Total Rate
            </label>
            <input
              type='number'
              value={invoiceData.batteriesRate || ''}
              onChange={(e) =>
                setInvoiceData({
                  ...invoiceData,
                  batteriesRate: parseFloat(e.target.value) || 0,
                })
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Enter battery total rate'
              min='0'
              step='0.01'
            />
          </div>
        </div>
      )}

      {/* Pay Later warning */}
      {invoiceData.paymentMethod?.includes('Pay Later') && (
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3'>
          <p className='text-sm text-yellow-800'>
            💡 <strong>Pay Later:</strong> Customer can pay any amount now and
            the remaining balance can be paid later using the "Add Payment"
            button.
          </p>
        </div>
      )}

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Received Amount
        </label>
        <div className='flex gap-2'>
          <input
            type='number'
            value={receivedAmount}
            onChange={(e) =>
              setInvoiceData({
                ...invoiceData,
                receivedAmount: parseFloat(e.target.value) || 0,
              })
            }
            className='flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter received amount'
            min='0'
            step='0.01'
          />
          <Button
            variant='fill'
            text=''
            onClick={() =>
              setInvoiceData({
                ...invoiceData,
                receivedAmount: remainingAmount,
              })
            }
            title='Add remaining amount'
            className='px-3 py-2'
            icon={
              <svg
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Summary with battery deduction */}
      <div className='rounded-lg bg-gray-50 p-4'>
        <div className='grid grid-cols-1 gap-2 text-sm'>
          <div className='flex justify-between'>
            <span className='font-medium'>Total Amount:</span>
            <span className='font-bold'>Rs {totalAmount.toLocaleString()}</span>
          </div>
          {invoiceData.paymentMethod?.includes('Old Battery') &&
            batteriesRate > 0 && (
              <div className='flex justify-between'>
                <span className='font-medium'>Battery Amount:</span>
                <span className='font-bold text-blue-600'>
                  -Rs {batteriesRate.toLocaleString()}
                </span>
              </div>
            )}
          <div className='flex justify-between'>
            <span className='font-medium'>Effective Total:</span>
            <span className='font-bold'>
              Rs {effectiveTotalAmount.toLocaleString()}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='font-medium'>Received:</span>
            <span className='font-bold'>
              Rs {receivedAmount.toLocaleString()}
            </span>
          </div>
          {previousRemainingAmount > 0 && (
            <div className='flex justify-between'>
              <span className='font-medium text-orange-600'>
                Previous Remaining:
              </span>
              <span className='font-bold text-orange-600'>
                Rs {previousRemainingAmount.toLocaleString()}
              </span>
            </div>
          )}
          <div className='flex justify-between border-t pt-2'>
            <span className='font-medium text-red-600'>Remaining:</span>
            <span className='font-bold text-red-600'>
              Rs {(remainingAmount + previousRemainingAmount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
