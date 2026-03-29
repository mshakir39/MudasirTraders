// src/features/invoice-management/ui/components/preview/InvoicePreviewPricing.tsx
// Invoice preview pricing component - <80 lines

'use client';

import React from 'react';
import { getAllSum } from '@/utils/getTotalSum';
import { convertDate } from '@/utils/convertTime';
import { formatCurrency } from '@/utils/formatters';  

interface InvoicePreviewPricingProps {
  data: any;
}

export const InvoicePreviewPricing: React.FC<InvoicePreviewPricingProps> = ({
  data,
}) => {
  // Calculate total received amount including additional payments
  const initialReceived = Number(data?.receivedAmount) || 0;
  const additionalPayments = data?.additionalPayment || [];
  const totalAdditionalReceived = additionalPayments.reduce(
    (sum: number, payment: any) => sum + Number(payment.amount),
    0
  );
  const totalReceived = initialReceived + totalAdditionalReceived;

  // Calculate amounts for consolidated invoices
  const consolidatedAmount =
    data?.previousAmounts?.reduce(
      (sum: number, amount: number) => sum + amount,
      0
    ) || 0;
  const subtotalAmount = Number(getAllSum(data?.products, 'totalPrice')) || 0;

  // Debug logging
  console.log('🔍 Consolidated Invoice Debug:', {
    consolidatedAmount,
    subtotalAmount,
    products: data?.products,
    previousAmounts: data?.previousAmounts,
    isConsolidated: data?.consolidatedFrom && data?.consolidatedFrom.length > 0,
    calculatedTotal: consolidatedAmount + subtotalAmount,
    // Check for any additional fields that might affect total
    taxAmount: data?.taxAmount,
    subtotal: data?.subtotal,
    batteriesRate: data?.batteriesRate,
    receivedAmount: data?.receivedAmount,
    remainingAmount: data?.remainingAmount,
    totalAmount: data?.totalAmount,
  });

  // For consolidated invoices, total includes both consolidated amount and new items
  const totalAmount =
    data?.consolidatedFrom && data?.consolidatedFrom.length > 0
      ? subtotalAmount + consolidatedAmount
      : subtotalAmount;

  const batteriesRate = Number(data?.batteriesRate) || 0;
  const actualRemaining = totalAmount - totalReceived - batteriesRate;

  return (
    <div className='flex w-full flex-col border border-gray-100 lg:w-[45%]'>
      <div className='flex items-center justify-between bg-sidebar-gradient p-2 text-white md:p-3'>
        <span className='text-sm font-bold md:text-base lg:text-lg'>
          SubTotal
        </span>
        <span className='text-sm font-bold md:text-base lg:text-lg'>
          {formatCurrency(getAllSum(data?.products, 'totalPrice'))}
        </span>
      </div>

      {/* Consolidation Details - Only show for consolidated invoices */}
      {data?.consolidatedFrom && data?.consolidatedFrom.length > 0 && (
        <div className='border border-purple-200 bg-purple-50 p-3'>
          <div className='flex flex-col space-y-1 text-sm'>
            {data?.consolidatedInvoiceNumbers?.length > 0
              ? // New format: Use actual invoice numbers if available
                data?.consolidatedInvoiceNumbers?.map(
                  (invoiceNo: string, index: number) => (
                    <div
                      key={invoiceNo}
                      className='flex items-center justify-between'
                    >
                      <span className='font-medium text-purple-700'>
                        #{invoiceNo}
                      </span>
                      <span className='font-bold text-purple-900'>
                        {formatCurrency(data?.previousAmounts?.[index] || 0)}
                      </span>
                    </div>
                  )
                )
              : // Fallback: Use truncated IDs for existing invoices
                data?.consolidatedFrom?.map((id: string, index: number) => (
                  <div key={id} className='flex items-center justify-between'>
                    <span className='font-medium text-purple-700'>
                      #INV-{id.slice(-6)}
                    </span>
                    <span className='font-bold text-purple-900'>
                      {formatCurrency(data?.previousAmounts?.[index] || 0)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      )}

      {(Number(data?.batteriesRate) || 0) > 0 && (
        <div className='flex items-center justify-between border-b border-gray-50 p-2 text-black md:p-3'>
          <span className='text-xs font-bold uppercase text-gray-500 md:text-sm'>
            {data?.batteriesCountAndWeight || 'Old Battery'}
          </span>
          <span className='text-xs font-bold md:text-sm'>
            - {formatCurrency(data?.batteriesRate)}
          </span>
        </div>
      )}

      {(Number(data?.batteriesRate) || 0) === 0 &&
        data?.batteriesCountAndWeight && (
          <div className='flex items-center justify-between border-b border-gray-50 p-2 text-black md:p-3'>
            <span className='text-xs font-bold uppercase text-gray-500 md:text-sm'>
              {data?.batteriesCountAndWeight}
            </span>
            <span className='text-xs font-bold md:text-sm'>- Old Battery</span>
          </div>
        )}

      {Number(data?.receivedAmount) > 0 && (
        <div className='flex items-center justify-between border-b border-gray-50 p-2 text-black md:p-3'>
          <span className='text-xs font-bold text-gray-500 md:text-sm'>
            Received:
          </span>
          <span className='text-xs font-bold md:text-sm'>
            - {formatCurrency(data?.receivedAmount)}
          </span>
        </div>
      )}

      {/* Additional Payments */}
      {data?.additionalPayment && data?.additionalPayment.length > 0 ? (
        <div className='mt-2 bg-gray-50 p-3'>
          {data?.additionalPayment?.map((payment: any, idx: number) => (
            <div
              key={idx}
              className='flex items-center justify-between border-b border-gray-200 py-1 last:border-b-0'
            >
              <span className='text-xs font-bold text-gray-500 md:text-sm'>
                {payment?.addedDate
                  ? convertDate(payment.addedDate).dateTime
                  : ''}
              </span>
              <span className='text-xs font-bold md:text-sm'>
                - {formatCurrency(payment?.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className='mt-2 rounded-lg border bg-gray-50 p-3'></div>
      )}

      <div className='flex items-center justify-between bg-sidebar-gradient p-2 text-white md:p-3'>
        <span className='text-sm font-bold md:text-base lg:text-lg'>
          {actualRemaining === 0 ? 'Total' : 'Balance Due'}
        </span>
        <span className='text-sm font-bold md:text-base lg:text-lg'>
          {actualRemaining === 0 ? 'PAID' : formatCurrency(actualRemaining)}
        </span>
      </div>
    </div>
  );
};
