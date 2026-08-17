'use client';

import { useEffect, useState } from 'react';
import { Dancing_Script } from 'next/font/google';
import { convertDate } from '@/utils/convertTime';
import { getAllSum } from '@/utils/getTotalSum';
import { formatRupees } from '@/utils/formatRupees';
import { removeParentheses } from '@/utils/formatters';
import InvoiceTable from '@/components/InvoiceTable';
import LoadingSpinner from '@/components/LoadingSpinner';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

const columns = [
  { label: 'ID', renderCell: (_: any, index: number) => index + 1 },
  {
    label: 'Name',
    renderCell: (item: any) => {
      const details = item?.batteryDetails;
      const name = details
        ? `${item.brandName} - ${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : `${item.brandName} - ${item.series}`;
      return (
        <span className='block max-w-[260px] break-words'>
          {removeParentheses(name)}
        </span>
      );
    },
  },
  { label: 'Qty', renderCell: (item: any) => item.quantity },
  { label: 'Price', renderCell: (item: any) => `Rs ${item.productPrice}` },
  { label: 'Amount', renderCell: (item: any) => `Rs ${item.totalPrice}` },
];

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Get invoice ID from URL path
        const pathParts = window.location.pathname.split('/');
        const invoiceId = pathParts[pathParts.length - 1];
        
        console.log('Fetching invoice with ID:', invoiceId);
        
        if (!invoiceId) {
          setError('No invoice ID found in URL');
          setLoading(false);
          return;
        }
        
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.NODE_ENV === 'production'
            ? 'https://mudasirtraders.com'
            : 'http://localhost:3000');

        const url = `${baseUrl}/api/invoice/${invoiceId}`;
        console.log('Fetching from URL:', url);
        
        const res = await fetch(url);
        console.log('Response status:', res.status);
        
        const result = await res.json();
        console.log('Response data:', result);

        if (!result.success) {
          console.error('API returned unsuccessful:', result);
          setError(result.error || 'Invoice not found');
          setLoading(false);
          return;
        }

        setInvoice(result.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice: ' + (err as Error).message);
        setLoading(false);
      }
    };

    fetchInvoice();
  }, []);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4'>
        <div className='max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-xl'>
          {/* Icon */}
          <div className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100'>
            <svg
              className='h-12 w-12 text-red-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className='mb-2 text-3xl font-bold text-gray-900'>
            Invoice Not Found
          </h1>

          {/* Description */}
          <p className='mb-6 text-gray-600'>
            {error || 'The invoice you are looking for does not exist or has been removed.'}
          </p>

          {/* Actions */}
          <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
            <button
              onClick={() => window.history.back()}
              className='rounded-lg bg-sidebar-gradient px-6 py-3 font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg'
            >
              Go Back
            </button>
            <a
              href='/dashboard'
              className='rounded-lg border-2 border-blue-500 px-6 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50'
            >
              Go to Dashboard
            </a>
          </div>

          {/* Help Text */}
          <p className='mt-6 text-sm text-gray-500'>
            Need help? Contact support at{' '}
            <a
              href='mailto:Owner@mudasirtraders.com'
              className='text-blue-600 hover:underline'
            >
              Owner@mudasirtraders.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const footerData = {
    ID: 'Total',
    Quantity: getAllSum(invoice?.products, 'quantity'),
    Amount: `Rs ${getAllSum(invoice?.products, 'totalPrice')}`,
  };

  return (
    <div className='min-h-screen bg-gray-50 px-2 py-4 sm:px-4 sm:py-6'>
      <div className='mx-auto min-h-screen max-w-5xl rounded-lg bg-white shadow-lg print:bg-white print:shadow-none'>
        <div className='p-4 sm:p-6 md:p-8'>
          {/* Header */}
          <div className='mb-2 text-xl font-bold uppercase sm:text-2xl md:text-3xl lg:text-4xl'>
            Invoice
          </div>
          <div className='mb-4 text-right text-sm font-bold sm:text-base md:text-lg'>
            No: Inv-{invoice?.invoiceNo}
          </div>

          {/* From / To */}
          <div className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2'>
            <div>
              <div className='text-sm font-bold sm:text-base md:text-lg'>Invoice From:</div>
              <p className='text-xs text-gray-600 sm:text-sm md:text-base'>
                MUDASIR TRADERS-DG KHAN <br />
                +923349627745, +923215392445 <br />
                General Bus Stand, near Badozai Market <br />
                Owner@mudasirtraders.com
              </p>
            </div>

            <div className='sm:text-right'>
              <div className='text-sm font-bold sm:text-base md:text-lg'>Invoice To:</div>
              <p className='text-xs text-gray-600 sm:text-sm md:text-base'>
                {removeParentheses(invoice?.customerName)} <br />
                {invoice?.customerContactNumber} <br />
                {invoice?.customerAddress}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className='mt-4 text-xs sm:text-sm md:text-base'>
            <span className='font-bold'>Date:</span>{' '}
            {invoice?.createdDate
              ? convertDate(invoice.createdDate).dateTime
              : ''}
          </div>

          {/* Table */}
          <div className='mt-4 overflow-x-auto sm:mt-6'>
            <InvoiceTable
              data={invoice?.products}
              columns={columns}
              footerData={footerData}
            />
          </div>

          {/* Bottom Section */}
          <div className='mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2'>
            {/* Left */}
            <div className='space-y-2 text-xs sm:text-sm md:text-base'>
              <div>
                <b>Amount in Words:</b>{' '}
                {formatRupees(getAllSum(invoice?.products, 'totalPrice'))}{' '}
                Rupees Only
              </div>

              <div>
                <b>Payment Method:</b> {invoice?.paymentMethod?.join(' + ')}
              </div>

              {invoice?.products?.map((p: any, i: number) => (
                <div key={i}>
                  <b>Warranty ({p.series || p.batteryDetails?.name}):</b>{' '}
                  {p.warrentyCode}
                </div>
              ))}
            </div>

            {/* Right Totals */}
            <div className='space-y-2 text-xs sm:text-sm md:text-base'>
              <div className='flex justify-between bg-sidebar-gradient p-2 text-white sm:p-3'>
                <span className='text-xs sm:text-sm md:text-base'>SubTotal</span>
                <span className='text-xs sm:text-sm md:text-base'>Rs {getAllSum(invoice?.products, 'totalPrice')}</span>
              </div>

              {Number(invoice?.batteriesRate) > 0 && (
                <div className='flex justify-between p-2 sm:p-3'>
                  <span className='text-xs sm:text-sm md:text-base'>
                    {invoice?.batteriesCountAndWeight || 'Old Battery'}
                  </span>
                  <span className='text-xs sm:text-sm md:text-base'>- Rs {invoice?.batteriesRate}</span>
                </div>
              )}

              {Number(invoice?.receivedAmount) > 0 && (
                <div className='flex justify-between p-2 sm:p-3'>
                  <span className='text-xs sm:text-sm md:text-base'>Received</span>
                  <span className='text-xs sm:text-sm md:text-base'>- Rs {invoice?.receivedAmount}</span>
                </div>
              )}

              {invoice?.additionalPayment?.map((p: any, i: number) => {
                const { dateTime } = convertDate(p.addedDate);
                return (
                  <div key={i} className='flex justify-between p-2 sm:p-3'>
                    <span className='text-xs sm:text-sm md:text-base'>Received ({dateTime})</span>
                    <span className="text-xs sm:text-sm md:text-base">- Rs {p.amount}</span>
                  </div>
                );
              })}

              <div className='mt-2 flex justify-between bg-sidebar-gradient p-2 text-white sm:p-3'>
                <span className='text-xs sm:text-sm md:text-base'>
                  {invoice?.remainingAmount === 0 ? 'Total' : 'Remaining'}
                </span>
                <span className='text-xs sm:text-sm md:text-base'>
                  {invoice?.remainingAmount === 0
                    ? 'Paid'
                    : `Rs ${invoice?.remainingAmount}`}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`mt-8 text-center text-2xl sm:text-4xl md:text-5xl lg:text-6xl ${dancingScript.className}`}
          >
            Thank You!
          </div>
        </div>
      </div>
    </div>
  );
}
