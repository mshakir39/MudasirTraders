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
  { label: 'Quantity', renderCell: (item: any) => item.quantity },
  { label: 'Price/Item', renderCell: (item: any) => 'Rs ' + item.productPrice },
  { label: 'Amount', renderCell: (item: any) => 'Rs ' + item.totalPrice },
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
    ID: 'Total',
    Quantity: getAllSum(data?.products, 'quantity'),
    Amount: 'Rs ' + getAllSum(data?.products, 'totalPrice'),
  };

  const downloadHandler = () => {
    console.log('Download button clicked!');
    if (downloadRef.current) {
      printHtmlAsPdf(downloadRef.current);
    } else {
      console.log('downloadRef.current is null');
    }
  };

  const printHandler = async () => {
    if (!data) {
      console.log('Print button clicked, but no data available yet.');
      return;
    }
    console.log('Print button clicked!');
    setShowPrinterInstructions(true);
  };

  // WhatsApp handler is now handled by the WhatsAppShareButton component

  const handlePrintConfirm = async () => {
    try {
      await printWithThermalPrinter(data);
      console.log('Print successful!');
    } catch (error: any) {
      console.error('Print failed:', error);
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
    const lastTwoTds = Array.from(tfoot.rows[0].cells).slice(
      -2
    ) as HTMLTableCellElement[];

    let Widths = lastTwoTds.map((td) => `${td.offsetWidth}`) as string[];
    setTdWidths(Widths);
    if (Widths && Widths.length > 0) {
      console.log(Widths);
    } else {
      console.log('Undefined or no elements found');
    }
  };

  const handleModalClose = () => {
    onClose();
    setTdWidths([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      dialogPanelClass='w-[794px]'
      parentClass={''}
      onClose={handleModalClose}
      onOpen={handleModalOpen}
      title=''
      size='large'
    >
      <div className='relative flex h-full w-full flex-col' ref={downloadRef} data-invoice-modal>
        <div className='thermal-print-title text-[40px] font-bold uppercase text-black'>
          Invoice
        </div>
        <div className='print-hide absolute right-0 top-0 z-10 flex flex-row items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-lg'>
          <FaDownload
            className='cursor-pointer text-2xl text-[#021B3B] transition-colors hover:text-[#0056b3]'
            onClick={downloadHandler}
            title='Download PDF'
          />
          <BsPrinter
            className='cursor-pointer text-2xl text-[#021B3B] transition-colors hover:text-[#0056b3]'
            onClick={printHandler}
            title='Print to Thermal Printer'
          />
          <WhatsAppShareButton
            invoiceData={data}
            size={32}
            className='cursor-pointer'
          />
        </div>
        <div className='text-end text-lg font-bold uppercase text-black'>
          <span>No:Inv-{data?.invoiceNo}</span>
        </div>

        <div className='mt-12 flex'>
          <div className='flex w-[50%] flex-col'>
            <span className='text-xl font-bold text-black'>Invoice From:</span>
            <span className='text-base text-[#6B6B6B]'>
              MUDASIR TRADERS-DG KHAN
            </span>
            <span className='text-base text-[#6B6B6B]'>
              +923349627745, +923215392445
            </span>
            <span className='text-base text-[#6B6B6B]'>
              General Bus Stand, near Badozai Market, Dera Ghazi Khan
            </span>
            <span className='text-base text-[#6B6B6B]'>
              Owner@mudasirtraders.com
            </span>
          </div>
          <div className='flex w-[50%] flex-col text-right'>
            <span className='text-xl font-bold text-black'>Invoice To:</span>
            <span className='text-base text-[#6B6B6B]'>
              {removeParentheses(data?.customerName)}
            </span>
            <span className='text-base text-[#6B6B6B]'>
              {data?.customerContactNumber}
            </span>
            <span className='text-base text-[#6B6B6B]'>
              {data?.customerAddress}
            </span>
          </div>
        </div>

        <div className='mt-6 flex items-center'>
          <span className='text-base font-bold text-black'>Date & Time :</span>
          <span className='text-base text-[#6B6B6B]'>
            {data?.createdDate ? convertDate(data.createdDate).dateTime : ''}
          </span>
        </div>

        <div className='mt-12'>
          <BasicTable
            data={data?.products}
            columns={columns}
            footerData={footerData}
          />

          <div className='flex w-full'>
            <div className='mt-4 flex w-[56%] flex-col'>
              <div className='flex'>
                <span className='mr-2 font-bold text-[#6B6B6B]'>
                  Invoice Amount In Words:{' '}
                </span>
                <span className='w-96'>
                  {formatRupees(getAllSum(data?.products, 'totalPrice')) +
                    ' Rupees Only'}
                </span>
              </div>

              <div className='mt-6 flex'>
                <span className='mr-2 font-bold text-[#6B6B6B]'>
                  Payment Method:
                </span>
                <span className='w-96'>{data?.paymentMethod?.join(' + ')}</span>
              </div>

              {data?.products?.map((product: any, idx: number) => (
                <div key={idx} className='mt-1 flex items-center'>
                  <span className='mr-2 font-bold text-[#6B6B6B]'>
                    Warranty Code (
                    {product.series || product.batteryDetails?.name}):
                  </span>
                  <span>{product.warrentyCode}</span>
                </div>
              ))}
            </div>

            <div className='flex w-[44%] flex-col'>
              <div className='width-transition flex h-[60.5px] w-full items-center justify-end bg-[#021B3B] text-lg text-white'>
                <div
                  style={{ width: tdWidths[0] ? tdWidths[0] + 'px' : '100px' }}
                  className='width-transition p-[16px] font-bold'
                >
                  SubTotal
                </div>
                <div
                  style={{ width: tdWidths[1] ? tdWidths[1] + 'px' : '150px' }}
                  className='width-transition p-[16px] font-bold'
                >
                  {'Rs ' + getAllSum(data?.products, 'totalPrice')}
                </div>
              </div>

              {data?.batteriesRate && data?.batteriesRate > 0 && (
                <div className='width-transition flex h-[60.5px] w-full items-center justify-end bg-transparent text-lg text-black'>
                  <div
                    style={{
                      width: tdWidths[0] ? tdWidths[0] + 'px' : '100px',
                    }}
                    className='width-transition p-[16px] font-bold'
                  >
                    {data?.batteriesCountAndWeight && data?.batteriesCountAndWeight !== '-' 
                      ? data.batteriesCountAndWeight 
                      : 'Old Battery'
                    }
                  </div>
                  <div
                    style={{
                      width: tdWidths[1] ? tdWidths[1] + 'px' : '150px',
                    }}
                    className='width-transition relative p-[5.4px] font-bold'
                  >
                    <span>-</span> {' Rs ' + data?.batteriesRate}
                  </div>
                </div>
              )}

              {data?.receivedAmount !== '0' && data?.receivedAmount && (
                <div className='width-transition flex h-[60.5px] w-full items-center justify-end bg-transparent text-lg text-black'>
                  <div
                    style={{
                      width: tdWidths[0] ? tdWidths[0] + 'px' : '100px',
                    }}
                    className='width-transition p-[16px] font-bold'
                  >
                    Received:
                  </div>
                  <div
                    style={{
                      width: tdWidths[1] ? tdWidths[1] + 'px' : '150px',
                    }}
                    className='width-transition relative p-[5.4px] font-bold'
                  >
                    <span>-</span> {' Rs ' + data?.receivedAmount}
                  </div>
                </div>
              )}

              {data?.additionalPayment?.map((paymentData: any, index: any) => {
                const { dateTime } = convertDate(paymentData?.addedDate);
                return (
                  <div
                    key={index}
                    className='width-transition flex h-[60.5px] w-full items-center justify-end bg-transparent text-lg text-black'
                  >
                    <div
                      style={{
                        width: tdWidths[0] ? tdWidths[0] + 'px' : '100px',
                      }}
                      className='width-transition p-[16px] font-bold'
                    >
                      Received: {dateTime}
                      {paymentData?.paymentMethod && (
                        <div className='mt-1 text-xs text-gray-600'>
                          ({paymentData.paymentMethod.join(' + ')})
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        width: tdWidths[1] ? tdWidths[1] + 'px' : '150px',
                      }}
                      className='width-transition relative p-[5.4px] font-bold'
                    >
                      <span>-</span> {' Rs ' + paymentData?.amount}
                    </div>
                  </div>
                );
              })}

              <div className='width-transition flex h-[60.5px] w-full items-center justify-end bg-[#021B3B] text-lg text-white'>
                <div
                  style={{ width: tdWidths[0] ? tdWidths[0] + 'px' : '100px' }}
                  className='width-transition p-[16px] font-bold'
                >
                  {data?.remainingAmount === 0 ? 'Total' : 'Total Remaining'}
                </div>
                <div
                  style={{ width: tdWidths[1] ? tdWidths[1] + 'px' : '150px' }}
                  className='width-transition relative p-[16px] font-bold'
                >
                  {data?.remainingAmount === 0
                    ? 'Paid'
                    : `Rs ${data?.remainingAmount}`}
                </div>
              </div>

              <span
                className={`my-36 flex justify-center text-6xl ${dancingScript?.className}`}
              >
                Thank You !
              </span>
            </div>
          </div>
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
