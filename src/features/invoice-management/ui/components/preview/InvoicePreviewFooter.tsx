// src/features/invoice-management/ui/components/preview/InvoicePreviewFooter.tsx
// Invoice preview footer component - <30 lines

'use client';

import React from 'react';
import { Dancing_Script } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

interface InvoicePreviewFooterProps {
  children?: React.ReactNode;
}

export const InvoicePreviewFooter: React.FC<InvoicePreviewFooterProps> = ({
  children,
}) => {
  return (
    <div className='mb-3 mt-8 flex justify-center md:mb-4 md:mt-12'>
      <span
        className={`text-center text-3xl md:text-4xl lg:text-6xl ${dancingScript?.className}`}
      >
        Thank You !
      </span>
    </div>
  );
};
