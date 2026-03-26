// src/features/invoice-management/ui/components/InvoicePreviewModalRefactored.tsx
// Refactored invoice preview modal - <250 lines (using slice components)

'use client';

import React, { useRef, useState } from 'react';
import printHtmlAsPdf from '@/utils/printHtmlAsPdf';
import { printWithThermalPrinter } from '@/utils/thermalPrinter';
import Modal from '@/components/modal';
import PrinterInstructionsModal from '@/components/PrinterInstructionsModal';
import ErrorModal from '@/components/ErrorModal';

// Import slice components
import { InvoicePreviewHeader } from './preview/InvoicePreviewHeader';
import { InvoicePreviewDetails } from './preview/InvoicePreviewDetails';
import { InvoicePreviewTable } from './preview/InvoicePreviewTable';
import { InvoicePreviewSummary } from './preview/InvoicePreviewSummary';
import { InvoicePreviewPricing } from './preview/InvoicePreviewPricing';
import { InvoicePreviewFooter } from './preview/InvoicePreviewFooter';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const InvoicePreviewModalRefactored: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  console.log('🔍 InvoicePreviewModal Debug - Invoice data:', {
    invoiceId: data?.id,
    invoiceNo: data?.invoiceNo,
    consolidatedFrom: data?.consolidatedFrom,
    previousAmounts: data?.previousAmounts,
    productsCount: data?.products?.length,
    products: data?.products,
    isConsolidated: !!(
      data?.consolidatedFrom && data?.consolidatedFrom.length > 0
    ),
  });

  const [showPrinterInstructions, setShowPrinterInstructions] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const downloadRef = useRef(null);

  const downloadHandler = () => {
    if (downloadRef.current) {
      printHtmlAsPdf(downloadRef.current);
    }
  };

  const printHandler = async () => {
    if (!data) return;
    setShowPrinterInstructions(true);
  };

  const handlePrintConfirm = async () => {
    try {
      await printWithThermalPrinter(data);
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Print Failed',
        message: 'Failed to print invoice. Please check your printer settings.',
        details: error.message || 'Unknown error',
      });
    }
  };

  const handleModalClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      dialogPanelClass='w-full max-w-[95vw] md:max-w-[794px] mx-auto'
      parentClass={'p-2 md:p-4'}
      onClose={handleModalClose}
      title=''
      size='large'
    >
      <div
        className='relative flex h-full w-full flex-col bg-white p-4 md:p-8'
        ref={downloadRef}
        data-invoice-modal
      >
        {/* Header */}
        <InvoicePreviewHeader
          data={data}
          onDownload={downloadHandler}
          onPrint={printHandler}
        />

        {/* Invoice Details */}
        <InvoicePreviewDetails data={data} />

        {/* Table */}
        <InvoicePreviewTable data={data} />

        {/* Bottom Details Section */}
        <div className='mt-6 flex w-full flex-col gap-4 md:mt-8 md:gap-6 lg:flex-row'>
          {/* Summary Column */}
          <InvoicePreviewSummary data={data} />

          {/* Pricing Column */}
          <InvoicePreviewPricing data={data} />
        </div>

        {/* Footer */}
        <InvoicePreviewFooter />
      </div>

      <PrinterInstructionsModal
        isOpen={showPrinterInstructions}
        onClose={() => setShowPrinterInstructions(false)}
        onConfirm={handlePrintConfirm}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />
    </Modal>
  );
};

export default InvoicePreviewModalRefactored;
