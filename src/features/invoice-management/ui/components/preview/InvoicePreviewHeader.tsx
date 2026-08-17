// src/features/invoice-management/ui/components/preview/InvoicePreviewHeader.tsx
// Invoice preview header component - <50 lines

'use client';

import React from 'react';
import { FaDownload } from 'react-icons/fa6';
import { BsPrinter } from 'react-icons/bs';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';

interface InvoicePreviewHeaderProps {
  data: any;
  onDownload: () => void;
  onPrint: () => void;
}

export const InvoicePreviewHeader: React.FC<InvoicePreviewHeaderProps> = ({
  data,
  onDownload,
  onPrint,
}) => {
  return (
    <div className='mb-3 flex flex-row items-center justify-between gap-2 sm:mb-4 md:mb-6'>
      <div className='text-xl font-bold uppercase text-black sm:text-2xl md:text-3xl lg:text-[40px]'>
        Invoice
      </div>
      <div className='print-hide flex flex-row items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2 md:gap-3'>
        <FaDownload
          className='cursor-pointer text-lg text-dark-900 hover:text-primary-600 sm:text-xl md:text-2xl'
          onClick={onDownload}
        />
        <BsPrinter
          className='cursor-pointer text-lg text-dark-900 hover:text-primary-600 sm:text-xl md:text-2xl'
          onClick={onPrint}
        />
        <WhatsAppShareButton
          invoiceData={data}
          size={18}
          className='cursor-pointer'
        />
      </div>
    </div>
  );
};
