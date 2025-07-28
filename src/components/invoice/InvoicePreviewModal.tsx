import React, { useRef, useState } from 'react';
import { FaDownload } from 'react-icons/fa6';
import { Dancing_Script } from 'next/font/google';
import { convertDate } from '@/utils/convertTime';
import { getAllSum } from '@/utils/getTotalSum';
import { formatRupees } from '@/utils/formatRupees';
import printHtmlAsPdf from '@/utils/printHtmlAsPdf';
import Modal from '@/components/modal';
import BasicTable from '@/components/basicTable';

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
      return details
        ? `${item.brandName} - ${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : `${item.brandName} - ${item.series}`;
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
  const downloadRef = useRef(null);

  const footerData = {
    ID: 'Total',
    Quantity: getAllSum(data?.products, 'quantity'),
    Amount: 'Rs ' + getAllSum(data?.products, 'totalPrice'),
  };

  const printHandler = () => {
    if (downloadRef.current) {
      printHtmlAsPdf(downloadRef.current);
    }
  };

  const handleModalOpen = () => {
    const tfoot = document.querySelector('tfoot') as HTMLTableSectionElement;
    const lastTwoTds = Array.from(tfoot.rows[0].cells).slice(-2) as HTMLTableCellElement[];

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
    >
      <div className='relative flex h-full w-full flex-col' ref={downloadRef}>
        <div className='text-[40px] font-bold uppercase text-black'>Invoice</div>
        <FaDownload
          className='absolute left-[98%] cursor-pointer text-2xl text-[#021B3B]'
          onClick={printHandler}
        />
        <div className='text-end text-lg font-bold uppercase text-black'>
          <span>No:Inv-{data?.invoiceNo}</span>
        </div>
        
        <div className='mt-12 flex'>
          <div className='flex w-[50%] flex-col'>
            <span className='text-xl font-bold text-black'>Invoice From:</span>
            <span className='text-base text-[#6B6B6B]'>MUDASIR TRADERS-DG KHAN</span>
            <span className='text-base text-[#6B6B6B]'>+923349627745, +923215392445</span>
            <span className='text-base text-[#6B6B6B]'>General Bus Stand, near Badozai Market, Dera Ghazi Khan</span>
            <span className='text-base text-[#6B6B6B]'>Owner@mudasirtraders.com</span>
          </div>
          <div className='flex w-[50%] flex-col text-right'>
            <span className='text-xl font-bold text-black'>Invoice To:</span>
            <span className='text-base text-[#6B6B6B]'>{data?.customerName}</span>
            <span className='text-base text-[#6B6B6B]'>{data?.customerContactNumber}</span>
            <span className='text-base text-[#6B6B6B]'>{data?.customerAddress}</span>
          </div>
        </div>

        <div className='mt-6 flex items-center'>
          <span className='text-base font-bold text-black'>Date & Time :</span>
          <span className='text-base text-[#6B6B6B]'>
            {data?.createdDate ? convertDate(data.createdDate).dateTime : ''}
          </span>
        </div>

        <div className='mt-12'>
          <BasicTable data={data?.products} columns={columns} footerData={footerData} />
          
          <div className='flex w-full'>
            <div className='mt-4 flex w-[56%] flex-col'>
              <div className='flex'>
                <span className='mr-2 font-bold text-[#6B6B6B]'>Invoice Amount In Words: </span>
                <span className='w-96'>
                  {formatRupees(getAllSum(data?.products, 'totalPrice')) + ' Rupees Only'}
                </span>
              </div>
              
              <div className='mt-6 flex'>
                <span className='mr-2 font-bold text-[#6B6B6B]'>Payment Method:</span>
                <span className='w-96'>{data?.paymentMethod?.join(' + ')}</span>
              </div>
              
              {data?.products?.map((product: any, idx: number) => (
                <div key={idx} className='mt-1 flex items-center'>
                  <span className='mr-2 font-bold text-[#6B6B6B]'>
                    Warranty Code ({product.series || product.batteryDetails?.name}):
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

              {data?.batteriesCountAndWeight && data?.batteriesRate && (
                <div className='width-transition flex h-[60.5px] w-full items-center justify-end bg-transparent text-lg text-black'>
                  <div
                    style={{ width: tdWidths[0] ? tdWidths[0] + 'px' : '100px' }}
                    className='width-transition p-[16px] font-bold'
                  >
                    {data?.batteriesCountAndWeight}
                  </div>
                  <div
                    style={{ width: tdWidths[1] ? tdWidths[1] + 'px' : '150px' }}
                    className='width-transition relative p-[5.4px] font-bold'
                  >
                    <span>-</span> {' Rs ' + data?.batteriesRate}
                  </div>
                </div>
              )}

              {data?.receivedAmount !== '0' && data?.receivedAmount && (
                <div className='width-transition flex h-[60.5px] w-full items-center justify-end bg-transparent text-lg text-black'>
                  <div
                    style={{ width: tdWidths[0] ? tdWidths[0] + 'px' : '100px' }}
                    className='width-transition p-[16px] font-bold'
                  >
                    Received:
                  </div>
                  <div
                    style={{ width: tdWidths[1] ? tdWidths[1] + 'px' : '150px' }}
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
                      style={{ width: tdWidths[0] ? tdWidths[0] + 'px' : '100px' }}
                      className='width-transition p-[16px] font-bold'
                    >
                      Received: {dateTime}
                    </div>
                    <div
                      style={{ width: tdWidths[1] ? tdWidths[1] + 'px' : '150px' }}
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
                  {data?.remainingAmount === 0 ? 'Paid' : data?.remainingAmount}
                </div>
              </div>

              <span className={`my-36 flex justify-center text-6xl ${dancingScript?.className}`}>
                Thank You !
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;