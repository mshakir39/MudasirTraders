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
      console.log("for print", data);
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
      const lastTwoTds = Array.from(tfoot.rows[0].cells).slice(-2) as HTMLTableCellElement[];
      let Widths = lastTwoTds.map((td) => `${td.offsetWidth}`) as string[];
      setTdWidths(Widths);
    }
  };

  const handleModalClose = () => {
    onClose();
    setTdWidths([]);
  };

  console.log("data", data);

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
        <div className='flex flex-row justify-between items-center mb-4 md:mb-6'>
          <div className='text-2xl md:text-3xl lg:text-[40px] font-bold uppercase text-black'>
            Invoice
          </div>
          <div className='print-hide flex flex-row items-center gap-2 md:gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm'>
            <FaDownload
              className='cursor-pointer text-xl md:text-2xl text-[#021B3B] hover:text-[#0056b3]'
              onClick={downloadHandler}
            />
            <BsPrinter
              className='cursor-pointer text-xl md:text-2xl text-[#021B3B] hover:text-[#0056b3]'
              onClick={printHandler}
            />
            <WhatsAppShareButton invoiceData={data} size={24} className='cursor-pointer' />
          </div>
        </div>

        {/* Invoice Number */}
        <div className='text-right text-sm md:text-base lg:text-lg font-bold uppercase text-black mb-3 md:mb-4'>
          <span>No:Inv-{data?.invoiceNo}</span>
        </div>

        {/* FROM and TO */}
        <div className='flex flex-row w-full gap-3 md:gap-4 border-y border-gray-100 py-3 md:py-4'>
          <div className='flex flex-1 flex-col'>
            <span className='text-base md:text-lg lg:text-xl font-bold text-black mb-1'>Invoice From:</span>
            <span className='text-xs md:text-sm lg:text-base text-[#6B6B6B] font-semibold uppercase'>Mudasir Traders-DG Khan</span>
            <span className='text-xs md:text-sm lg:text-base text-[#6B6B6B]'>+923349627745</span>
            <span className='text-xs md:text-sm lg:text-base text-[#6B6B6B] leading-tight'>Gen. Bus Stand, Dera Ghazi Khan</span>
          </div>

          <div className='w-[1px] bg-gray-200'></div>

          <div className='flex flex-1 flex-col text-right'>
            <span className='text-base md:text-lg lg:text-xl font-bold text-black mb-1'>Invoice To:</span>
            <span className='text-xs md:text-sm lg:text-base text-[#6B6B6B] font-semibold uppercase truncate'>
              {removeParentheses(data?.customerName)}
            </span>
            <span className='text-xs md:text-sm lg:text-base text-[#6B6B6B]'>{data?.customerContactNumber}</span>
            <span className='text-xs md:text-sm lg:text-base text-[#6B6B6B] leading-tight truncate'>
              {data?.customerAddress || 'N/A'}
            </span>
          </div>
        </div>

        {/* Date and Time */}
        <div className='mt-3 md:mt-4 flex items-center gap-2'>
          <span className='text-sm md:text-base font-bold text-black'>Date & Time :</span>
          <span className='text-sm md:text-base text-[#6B6B6B]'>
            {data?.createdDate ? convertDate(data.createdDate).dateTime : ''}
          </span>
        </div>

        {/* Table */}
        <div className='mt-6 md:mt-8 overflow-x-auto overflow-y-hidden'>
          <div className='min-w-[500px]'>
            <BasicTable data={data?.products} columns={columns} footerData={footerData} />
          </div>
        </div>

        {/* Bottom Details Section */}
        <div className='mt-6 md:mt-8 flex flex-col lg:flex-row w-full gap-4 md:gap-6'>
          <div className='flex w-full lg:w-[55%] flex-col space-y-3 md:space-y-4'>
            {/* In Words */}
            <div className='text-xs md:text-sm'>
              <span className='font-bold text-[#6B6B6B]'>In Words: </span>
              <span className='italic'>{formatRupees(getAllSum(data?.products, 'totalPrice'))} Rupees Only</span>
            </div>

            {/* Payment */}
            <div className='text-xs md:text-sm'>
              <span className='font-bold text-[#6B6B6B]'>Payment: </span>
              <span>{data?.paymentMethod?.join(' + ')}</span>
            </div>

            {/* Warranty */}
            <div className='space-y-1'>
              {data?.products?.map((product: any, idx: number) => (
                <div key={idx} className='text-xs md:text-sm flex flex-wrap'>
                  <span className='font-bold text-[#6B6B6B] mr-1'>Warranty ({product.series || 'Item'}):</span>
                  <span className='break-all'>{product.warrentyCode}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Column */}
          <div className='flex w-full lg:w-[45%] flex-col border border-gray-100'>
            <div className='flex justify-between items-center bg-[#021B3B] text-white p-2 md:p-3'>
              <span className='font-bold text-sm md:text-base lg:text-lg'>SubTotal</span>
              <span className='font-bold text-sm md:text-base lg:text-lg'>Rs {getAllSum(data?.products, 'totalPrice')}</span>
            </div>

            {(Number(data?.batteriesRate) || 0) > 0 && (
              <div className='flex justify-between items-center p-2 md:p-3 border-b border-gray-50 text-black'>
                <span className='font-bold text-xs md:text-sm text-gray-500 uppercase'>
                  {data?.batteriesCountAndWeight || 'Old Battery'}
                </span>
                <span className='font-bold text-xs md:text-sm'>- Rs {data?.batteriesRate}</span>
              </div>
            )}

            {Number(data?.receivedAmount) > 0 && (
              <div className='flex justify-between items-center p-2 md:p-3 border-b border-gray-50 text-black'>
                <span className='font-bold text-xs md:text-sm text-gray-500'>Received:</span>
                <span className='font-bold text-xs md:text-sm'>- Rs {data?.receivedAmount}</span>
              </div>
            )}

            {/* Additional Payments */}
            {data?.additionalPayment && data?.additionalPayment.length > 0 ? (
              <div className='mt-2 p-3 bg-gray-50'>
                {data?.additionalPayment?.map((payment: any, idx: number) => (
                  <div key={idx} className='flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0'>
                    {/* ✅ FIXED: use convertDate() to show full date + time */}
                    <span className='font-bold text-xs md:text-sm text-gray-500'>
                      {payment?.addedDate ? convertDate(payment.addedDate).dateTime : ''}
                    </span>
                    <span className='font-bold text-xs md:text-sm'>- Rs {payment?.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className='mt-2 p-3 bg-gray-50 rounded-lg border'></div>
            )}

            <div className='flex justify-between items-center bg-[#021B3B] text-white p-2 md:p-3'>
              <span className='font-bold text-sm md:text-base lg:text-lg'>
                {data?.remainingAmount === 0 ? 'Total' : 'Balance Due'}
              </span>
              <span className='font-bold text-sm md:text-base lg:text-lg'>
                {data?.remainingAmount === 0 ? 'PAID' : `Rs ${data?.remainingAmount}`}
              </span>
            </div>
          </div>
        </div>

        {/* Thank You */}
        <div className='mt-8 md:mt-12 mb-3 md:mb-4 flex justify-center'>
          <span className={`text-3xl md:text-4xl lg:text-6xl text-center ${dancingScript?.className}`}>
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