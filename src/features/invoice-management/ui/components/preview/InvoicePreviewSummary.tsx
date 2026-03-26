// src/features/invoice-management/ui/components/preview/InvoicePreviewSummary.tsx
// Invoice preview summary component - <80 lines

'use client';

import React from 'react';
import { getAllSum } from '@/utils/getTotalSum';
import { formatRupees } from '@/utils/formatRupees';
import { convertDate } from '@/utils/convertTime';

interface InvoicePreviewSummaryProps {
  data: any;
}

export const InvoicePreviewSummary: React.FC<InvoicePreviewSummaryProps> = ({
  data,
}) => {
  return (
    <div className='flex w-full flex-col space-y-3 md:space-y-4 lg:w-[55%]'>
      {/* In Words */}
      <div className='text-xs md:text-sm'>
        <span className='font-bold text-muted'>In Words: </span>
        <span className='italic'>
          {formatRupees(getAllSum(data?.products, 'totalPrice'))} Rupees Only
        </span>
      </div>

      {/* Payment */}
      <div className='text-xs md:text-sm'>
        <span className='font-bold text-muted'>Payment: </span>
        <span>{data?.paymentMethod?.join(' + ')}</span>
      </div>

      {/* Warranty - Show only for non-charging service products */}
      {data?.products?.filter((product: any) => !product.isChargingService)
        .length > 0 && (
        <div className='space-y-1'>
          {data?.products
            ?.filter((product: any) => !product.isChargingService)
            .map((product: any, idx: number) => (
              <div key={idx} className='flex flex-wrap text-xs md:text-sm'>
                <span className='mr-1 font-bold text-muted'>
                  Warranty ({product.series || 'Item'}):
                </span>
                <span className='break-all'>{product.warrentyCode}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
