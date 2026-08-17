// src/features/invoice-management/ui/components/preview/InvoicePreviewDetails.tsx
// Invoice preview details component - <80 lines

'use client';

import React from 'react';
import { convertDate } from '@/utils/convertTime';
import { removeParentheses } from '@/utils/formatters';

interface InvoicePreviewDetailsProps {
  data: any;
}

export const InvoicePreviewDetails: React.FC<InvoicePreviewDetailsProps> = ({
  data,
}) => {
  return (
    <>
      {/* Date and Time */}
      <div className='mb-2 flex flex-col items-start justify-between gap-1 sm:mb-3 sm:flex-row sm:items-center sm:gap-2 md:mb-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-bold text-black sm:text-sm md:text-base'>
            Date & Time :
          </span>
          <span className='text-xs text-muted sm:text-sm md:text-base'>
            {data?.createdDate ? convertDate(data.createdDate).dateTime : ''}
          </span>
        </div>
        <div className='text-right text-xs font-bold uppercase text-black sm:text-sm md:text-base lg:text-lg'>
          <span>No:Inv-{data?.invoiceNo}</span>
        </div>
      </div>

      {/* FROM and TO */}
      <div className='flex w-full flex-col gap-3 border-y border-gray-100 py-2 sm:flex-row sm:gap-4 sm:py-3 md:py-4'>
        <div className='flex flex-1 flex-col'>
          <span className='mb-1 text-sm font-bold text-black sm:text-base md:text-lg lg:text-xl'>
            Invoice From:
          </span>
          <span className='text-xs font-semibold uppercase text-muted sm:text-xs md:text-sm lg:text-base'>
            Mudasir Traders-DG Khan
          </span>
          <span className='text-xs text-muted sm:text-xs md:text-sm lg:text-base'>
            +923349627745
          </span>
          <span className='text-xs leading-tight text-muted sm:text-xs md:text-sm lg:text-base'>
            Gen. Bus Stand, Dera Ghazi Khan
          </span>
        </div>

        <div className='hidden w-[1px] bg-gray-200 sm:block'></div>

        <div className='flex flex-1 flex-col sm:text-right'>
          <span className='mb-1 text-sm font-bold text-black sm:text-base md:text-lg lg:text-xl'>
            Invoice To:
          </span>
          <span className='truncate text-xs font-semibold uppercase text-muted sm:text-xs md:text-sm lg:text-base'>
            {removeParentheses(data?.customerName)}
          </span>
          <span className='text-xs text-muted sm:text-xs md:text-sm lg:text-base'>
            {data?.customerContactNumber}
          </span>
          <span className='truncate text-xs leading-tight text-muted sm:text-xs md:text-sm lg:text-base'>
            {data?.customerAddress || 'N/A'}
          </span>
        </div>
      </div>
    </>
  );
};
