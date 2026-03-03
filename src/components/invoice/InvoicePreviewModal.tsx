import React, { useRef, useState } from 'react';
import { FaDownload } from 'react-icons/fa6';
import { BsPrinter } from 'react-icons/bs';
import { Dancing_Script } from 'next/font/google';
import { convertDate } from '@/utils/convertTime';
import { getAllSum } from '@/utils/getTotalSum';
import { formatRupees } from '@/utils/formatRupees';
import { removeParentheses } from '@/utils/formatters';
import printHtmlAsPdf from '@/utils/printHtmlAsPdf';
import { printWithThermalPrinter } from '@/utils/thermalPrinter';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import Modal from '@/components/modal';
import BasicTable from '@/components/basicTable';
import PrinterInstructionsModal from '@/components/PrinterInstructionsModal';
import ErrorModal from '@/components/ErrorModal';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const columns = [
  { label: 'ID', renderCell: (item: any, index: number) => index + 1 },
  {
    label: 'Name',
    renderCell: (item: any) => {
      const details = item?.batteryDetails;
      const name = details
        ? `${item.brandName} - ${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : `${item.brandName} - ${item.series}`;
      return removeParentheses(name);
    },
  },
  { label: 'Qty', renderCell: (item: any) => item.quantity },
  { label: 'Price', renderCell: (item: any) => 'Rs ' + item.productPrice },
  { label: 'Total', renderCell: (item: any) => 'Rs ' + item.totalPrice },
];

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [tdWidths, setTdWidths] = useState<String[]>([]);
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

  const footerData = {
    ID: '',
    Name: 'Total',
    Qty: getAllSum(data?.products, 'quantity'),
    Price: '',
    Total: 'Rs ' + getAllSum(data?.products, 'totalPrice'),
  };

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
      console.log('for print', data);
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

  const handleModalOpen = () => {
    const tfoot = document.querySelector('tfoot') as HTMLTableSectionElement;
    if (tfoot && tfoot.rows.length > 0) {
      const lastTwoTds = Array.from(tfoot.rows[0].cells).slice(
        -2
      ) as HTMLTableCellElement[];
      let Widths = lastTwoTds.map((td) => `${td.offsetWidth}`) as string[];
      setTdWidths(Widths);
    }
  };

  const handleModalClose = () => {
    onClose();
    setTdWidths([]);
  };

  console.log('data', data);

  return (
    <Modal
      isOpen={isOpen}
      dialogPanelClass='w-full max-w-[95vw] md:max-w-[794px] mx-auto'
      parentClass={'p-2 md:p-4'}
      onClose={handleModalClose}
      onOpen={handleModalOpen}
      title=''
      size='large'
    >
      <div
        className='relative flex h-full w-full flex-col bg-white p-4 md:p-8'
        ref={downloadRef}
        data-invoice-modal
      >
        {/* Header Section */}
        <div className='mb-4 flex flex-row items-center justify-between md:mb-6'>
          <div className='text-2xl font-bold uppercase text-black md:text-3xl lg:text-[40px]'>
            Invoice
          </div>
          <div className='print-hide flex flex-row items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm md:gap-3'>
            <FaDownload
              className='cursor-pointer text-xl text-[#021B3B] hover:text-[#0056b3] md:text-2xl'
              onClick={downloadHandler}
            />
            <BsPrinter
              className='cursor-pointer text-xl text-[#021B3B] hover:text-[#0056b3] md:text-2xl'
              onClick={printHandler}
            />
            <WhatsAppShareButton
              invoiceData={data}
              size={24}
              className='cursor-pointer'
            />
          </div>
        </div>

        {/* Invoice Number */}
        <div className='mb-3 text-right text-sm font-bold uppercase text-black md:mb-4 md:text-base lg:text-lg'>
          <span>No:Inv-{data?.invoiceNo}</span>
        </div>

        {/* FROM and TO */}
        <div className='flex w-full flex-row gap-3 border-y border-gray-100 py-3 md:gap-4 md:py-4'>
          <div className='flex flex-1 flex-col'>
            <span className='mb-1 text-base font-bold text-black md:text-lg lg:text-xl'>
              Invoice From:
            </span>
            <span className='text-xs font-semibold uppercase text-[#6B6B6B] md:text-sm lg:text-base'>
              Mudasir Traders-DG Khan
            </span>
            <span className='text-xs text-[#6B6B6B] md:text-sm lg:text-base'>
              +923349627745
            </span>
            <span className='text-xs leading-tight text-[#6B6B6B] md:text-sm lg:text-base'>
              Gen. Bus Stand, Dera Ghazi Khan
            </span>
          </div>

          <div className='w-[1px] bg-gray-200'></div>

          <div className='flex flex-1 flex-col text-right'>
            <span className='mb-1 text-base font-bold text-black md:text-lg lg:text-xl'>
              Invoice To:
            </span>
            <span className='truncate text-xs font-semibold uppercase text-[#6B6B6B] md:text-sm lg:text-base'>
              {removeParentheses(data?.customerName)}
            </span>
            <span className='text-xs text-[#6B6B6B] md:text-sm lg:text-base'>
              {data?.customerContactNumber}
            </span>
            <span className='truncate text-xs leading-tight text-[#6B6B6B] md:text-sm lg:text-base'>
              {data?.customerAddress || 'N/A'}
            </span>
          </div>
        </div>

        {/* Date and Time */}
        <div className='mt-3 flex items-center gap-2 md:mt-4'>
          <span className='text-sm font-bold text-black md:text-base'>
            Date & Time :
          </span>
          <span className='text-sm text-[#6B6B6B] md:text-base'>
            {data?.createdDate ? convertDate(data.createdDate).dateTime : ''}
          </span>
        </div>

        {/* Table */}
        <div className='mt-6 overflow-x-auto overflow-y-hidden md:mt-8'>
          <div className='min-w-[500px]'>
            <BasicTable
              data={data?.products}
              columns={columns}
              footerData={footerData}
            />
          </div>
        </div>

        {/* Bottom Details Section */}
        <div className='mt-6 flex w-full flex-col gap-4 md:mt-8 md:gap-6 lg:flex-row'>
          <div className='flex w-full flex-col space-y-3 md:space-y-4 lg:w-[55%]'>
            {/* In Words */}
            <div className='text-xs md:text-sm'>
              <span className='font-bold text-[#6B6B6B]'>In Words: </span>
              <span className='italic'>
                {formatRupees(getAllSum(data?.products, 'totalPrice'))} Rupees
                Only
              </span>
            </div>

            {/* Payment */}
            <div className='text-xs md:text-sm'>
              <span className='font-bold text-[#6B6B6B]'>Payment: </span>
              <span>{data?.paymentMethod?.join(' + ')}</span>
            </div>

            {/* Warranty - Show only for non-charging service products */}
            {data?.products?.filter(
              (product: any) => !product.isChargingService
            ).length > 0 && (
              <div className='space-y-1'>
                {data?.products?.filter(
                  (product: any) => !product.isChargingService
                ).map((product: any, idx: number) => (
                  <div key={idx} className='flex flex-wrap text-xs md:text-sm'>
                    <span className='mr-1 font-bold text-[#6B6B6B]'>
                      Warranty ({product.series || 'Item'}):
                    </span>
                    <span className='break-all'>{product.warrentyCode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Column */}
          <div className='flex w-full flex-col border border-gray-100 lg:w-[45%]'>
            <div className='flex items-center justify-between bg-[#021B3B] p-2 text-white md:p-3'>
              <span className='text-sm font-bold md:text-base lg:text-lg'>
                SubTotal
              </span>
              <span className='text-sm font-bold md:text-base lg:text-lg'>
                Rs {getAllSum(data?.products, 'totalPrice')}
              </span>
            </div>

            {(Number(data?.batteriesRate) || 0) > 0 && (
              <div className='flex items-center justify-between border-b border-gray-50 p-2 text-black md:p-3'>
                <span className='text-xs font-bold uppercase text-gray-500 md:text-sm'>
                  {data?.batteriesCountAndWeight || 'Old Battery'}
                </span>
                <span className='text-xs font-bold md:text-sm'>
                  - Rs {data?.batteriesRate}
                </span>
              </div>
            )}

            {Number(data?.receivedAmount) > 0 && (
              <div className='flex items-center justify-between border-b border-gray-50 p-2 text-black md:p-3'>
                <span className='text-xs font-bold text-gray-500 md:text-sm'>
                  Received:
                </span>
                <span className='text-xs font-bold md:text-sm'>
                  - Rs {data?.receivedAmount}
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
                    {/* ✅ FIXED: use convertDate() to show full date + time */}
                    <span className='text-xs font-bold text-gray-500 md:text-sm'>
                      {payment?.addedDate
                        ? convertDate(payment.addedDate).dateTime
                        : ''}
                    </span>
                    <span className='text-xs font-bold md:text-sm'>
                      - Rs {payment?.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className='mt-2 rounded-lg border bg-gray-50 p-3'></div>
            )}

            <div className='flex items-center justify-between bg-[#021B3B] p-2 text-white md:p-3'>
              <span className='text-sm font-bold md:text-base lg:text-lg'>
                {data?.remainingAmount === 0 ? 'Total' : 'Balance Due'}
              </span>
              <span className='text-sm font-bold md:text-base lg:text-lg'>
                {data?.remainingAmount === 0
                  ? 'PAID'
                  : `Rs ${data?.remainingAmount}`}
              </span>
            </div>
          </div>
        </div>

        {/* Thank You */}
        <div className='mb-3 mt-8 flex justify-center md:mb-4 md:mt-12'>
          <span
            className={`text-center text-3xl md:text-4xl lg:text-6xl ${dancingScript?.className}`}
          >
            Thank You !
          </span>
        </div>
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

export default InvoicePreviewModal;
