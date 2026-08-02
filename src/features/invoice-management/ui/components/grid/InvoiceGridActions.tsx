// src/features/invoice-management/ui/components/grid/InvoiceGridActions.tsx
// Invoice grid actions component - direct action buttons

'use client';

import React, { useState } from 'react';
import {
  FaFileInvoice,
  FaMoneyBillWave,
  FaTrash,
  FaDownload,
  FaWhatsapp,
} from 'react-icons/fa';
import { BsPrinter } from 'react-icons/bs';
import printHtmlAsPdf from '@/utils/printHtmlAsPdf';
import { printWithThermalPrinter } from '@/utils/thermalPrinter';
import ErrorModal from '@/components/ErrorModal';

interface InvoiceGridActionsProps {
  invoice: any;
  onPreview: (invoice: any) => void;
  onEditInvoice: (invoice: any) => void;
  onAddPayment: (invoice: any) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoiceGridActions: React.FC<InvoiceGridActionsProps> = ({
  invoice,
  onPreview,
  onEditInvoice,
  onAddPayment,
  onDeleteInvoice,
}) => {
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

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case 'preview':
        onPreview(invoice);
        break;
      case 'edit':
        onEditInvoice(invoice);
        break;
      case 'payment':
        onAddPayment(invoice);
        break;
      case 'delete':
        onDeleteInvoice(invoice.id);
        break;
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a temporary div with invoice content for download
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateInvoiceHtml(invoice);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);
    printHtmlAsPdf(tempDiv);
    document.body.removeChild(tempDiv);
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await printWithThermalPrinter(invoice);
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Print Failed',
        message: 'Failed to print invoice. Please check your printer settings.',
        details: error.message || 'Unknown error',
      });
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = generateWhatsAppMessage(invoice);
    
    if (invoice.customerContactNumber) {
      const cleanPhone = invoice.customerContactNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('92')
        ? cleanPhone
        : `92${cleanPhone}`;
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const generateWhatsAppMessage = (invoice: any) => {
    const initialReceived = Number(invoice.receivedAmount) || 0;
    const additionalPayments = invoice.additionalPayment || [];
    const totalAdditionalReceived = additionalPayments.reduce(
      (sum: number, payment: any) => sum + Number(payment.amount),
      0
    );
    const totalReceived = initialReceived + totalAdditionalReceived;

    const consolidatedAmount =
      invoice.previousAmounts?.reduce(
        (sum: number, amount: number) => sum + amount,
        0
      ) || 0;
    const subtotalAmount =
      invoice.products?.reduce(
        (sum: number, product: any) => sum + product.totalPrice,
        0
      ) || 0;

    const totalAmount =
      invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0
        ? subtotalAmount + consolidatedAmount
        : subtotalAmount;

    const batteriesRate = Number(invoice.batteriesRate) || 0;
    const actualRemaining = totalAmount - totalReceived - batteriesRate;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://mudasirtraders.com');

    return `*INVOICE RECEIPT*
================================

*MUDASIR TRADERS-DG KHAN*

Phone: +923349627745 | +923215392445
Location: General Bus Stand, Badozai Market, Dera Ghazi Khan

--------------------------------

*INVOICE INFORMATION*

Invoice No: *${invoice.invoiceNo}*
Customer: *${invoice.customerName}*
Contact: *${invoice.customerContactNumber}*

--------------------------------

*PAYMENT DETAILS*

Total Amount: *Rs ${totalAmount.toLocaleString()}*
${
  actualRemaining > 0
    ? `Payment Status: *PENDING*\nOutstanding: *Rs ${actualRemaining.toLocaleString()}*`
    : `Payment Status: *PAID IN FULL*`
}

--------------------------------

*VIEW FULL INVOICE*

${baseUrl}/invoice/${invoice._id || invoice.id || 'unknown'}

================================

*Thank you for choosing us!*

Questions? Call us at:
+923349627745

================================`;
  };

  const generateInvoiceHtml = (invoice: any) => {
    const { convertDate } = require('@/utils/convertTime');
    const { removeParentheses, formatCurrency } = require('@/utils/formatters');
    const { getAllSum } = require('@/utils/getTotalSum');
    const { formatRupees } = require('@/utils/formatRupees');

    const dateTime = invoice?.createdDate ? convertDate(invoice.createdDate).dateTime : '';
    const customerName = removeParentheses(invoice?.customerName);
    const customerContact = invoice?.customerContactNumber;
    const customerAddress = invoice?.customerAddress || 'N/A';

    // Calculate totals
    const initialReceived = Number(invoice?.receivedAmount) || 0;
    const additionalPayments = invoice?.additionalPayment || [];
    const totalAdditionalReceived = additionalPayments.reduce(
      (sum: number, payment: any) => sum + Number(payment.amount),
      0
    );
    const totalReceived = initialReceived + totalAdditionalReceived;

    const consolidatedAmount =
      invoice?.previousAmounts?.reduce(
        (sum: number, amount: number) => sum + amount,
        0
      ) || 0;
    const subtotalAmount = Number(getAllSum(invoice?.products, 'totalPrice')) || 0;
    const totalAmount =
      invoice?.consolidatedFrom && invoice?.consolidatedFrom.length > 0
        ? subtotalAmount + consolidatedAmount
        : subtotalAmount;

    const batteriesRate = Number(invoice?.batteriesRate) || 0;
    const actualRemaining = totalAmount - totalReceived - batteriesRate;

    // Generate product rows
    const productRows = invoice?.products?.map((p: any, index: number) => {
      const details = p?.batteryDetails;
      const name = details
        ? `${p.brandName} - ${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : `${p.brandName} - ${p.series}`;
      const displayName = removeParentheses(name);
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${displayName}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${p.quantity}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(p.productPrice)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(p.totalPrice)}</td>
        </tr>
      `;
    }).join('') || '';

    const totalQty = getAllSum(invoice?.products, 'quantity');
    const totalPrice = formatCurrency(getAllSum(invoice?.products, 'totalPrice'));
    const inWords = formatRupees(getAllSum(invoice?.products, 'totalPrice')) + ' Rupees Only';
    const paymentMethods = invoice?.paymentMethod?.join(' + ') || '';

    // Generate warranty section
    const warrantySection = invoice?.products
      ?.filter((product: any) => !product.isChargingService)
      .map((product: any) => `
        <div style="margin-bottom: 4px;">
          <strong>Warranty (${product.series || 'Item'}):</strong> ${product.warrentyCode}
        </div>
      `).join('') || '';

    // Generate additional payments section
    const additionalPaymentsSection = invoice?.additionalPayment?.map((payment: any) => {
      const paymentDate = payment?.addedDate ? convertDate(payment.addedDate).dateTime : '';
      return `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding: 4px 0;">
          <span>${paymentDate}</span>
          <span>- Rs ${formatCurrency(payment?.amount)}</span>
        </div>
      `;
    }).join('') || '';

    // Generate consolidation section
    const consolidationSection = invoice?.consolidatedFrom && invoice?.consolidatedFrom.length > 0 ? `
      <div style="border: 1px solid #ddd; background-color: #f3e8ff; padding: 12px; margin: 8px 0;">
        ${invoice?.consolidatedInvoiceNumbers?.length > 0
          ? invoice?.consolidatedInvoiceNumbers?.map(
              (invoiceNo: string, index: number) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #7c3aed; font-weight: 500;">#${invoiceNo}</span>
                  <span style="color: #581c87; font-weight: bold;">Rs ${formatCurrency(invoice?.previousAmounts?.[index] || 0)}</span>
                </div>
              `
            ).join('')
          : invoice?.consolidatedFrom?.map((id: string, index: number) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #7c3aed; font-weight: 500;">#INV-${id.slice(-6)}</span>
                <span style="color: #581c87; font-weight: bold;">Rs ${formatCurrency(invoice?.previousAmounts?.[index] || 0)}</span>
              </div>
            `).join('')}
      </div>
    ` : '';

    return `
      <div style="font-family: Arial, sans-serif; width: 794px; margin: 0 auto; background: white; padding: 32px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h1 style="font-size: 40px; font-weight: bold; text-transform: uppercase; margin: 0; color: #000;">INVOICE</h1>
        </div>

        <!-- Date and Invoice No -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: bold; font-size: 14px; color: #000;">Date & Time : </span>
            <span style="font-size: 14px; color: #6b7280;">${dateTime}</span>
          </div>
          <div style="text-align: right; font-weight: bold; text-transform: uppercase; font-size: 24px; color: #000;">
            No:Inv-${invoice?.invoiceNo}
          </div>
        </div>

        <!-- From and To -->
        <div style="display: flex; gap: 16px; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 16px 0; margin-bottom: 24px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 24px; margin-bottom: 4px; color: #000;">Invoice From:</div>
            <div style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #6b7280;">Mudasir Traders-DG Khan</div>
            <div style="font-size: 14px; color: #6b7280;">+923349627745</div>
            <div style="font-size: 14px; line-height: 1.25; color: #6b7280;">Gen. Bus Stand, Dera Ghazi Khan</div>
          </div>
          <div style="width: 1px; background-color: #e5e7eb;"></div>
          <div style="flex: 1; text-align: right;">
            <div style="font-weight: bold; font-size: 24px; margin-bottom: 4px; color: #000;">Invoice To:</div>
            <div style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #6b7280;">${customerName}</div>
            <div style="font-size: 14px; color: #6b7280;">${customerContact}</div>
            <div style="font-size: 14px; line-height: 1.25; color: #6b7280;">${customerAddress}</div>
          </div>
        </div>

        <!-- Products Table -->
        <div style="margin-bottom: 24px; overflow-x: auto; overflow-y: hidden;">
          <div style="min-width: 500px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Qty</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Price</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
                <tr style="background-color: #f9fafb; font-weight: bold;">
                  <td style="border: 1px solid #ddd; padding: 8px;"></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">Total</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${totalQty}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;"></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${totalPrice}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Summary and Pricing -->
        <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; flex-wrap: wrap; gap: 24px;">
            <!-- Summary -->
            <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 12px;">
              <div style="font-size: 14px;">
                <strong>In Words: </strong>
                <span style="font-style: italic;">${inWords}</span>
              </div>
              <div style="font-size: 14px;">
                <strong>Payment: </strong>
                <span>${paymentMethods}</span>
              </div>
              ${warrantySection ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; font-size: 14px;">${warrantySection}</div>` : ''}
            </div>

            <!-- Pricing -->
            <div style="flex: 1; min-width: 300px; border: 1px solid #f3f4f6; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 12px; color: white;">
                <span style="font-weight: bold; font-size: 14px;">SubTotal</span>
                <span style="font-weight: bold; font-size: 14px;">Rs ${formatCurrency(getAllSum(invoice?.products, 'totalPrice'))}</span>
              </div>

              ${consolidationSection}

              ${batteriesRate > 0 ? `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding: 8px 12px; color: #000;">
                  <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280;">${invoice?.batteriesCountAndWeight || 'Old Battery'}</span>
                  <span style="font-size: 12px; font-weight: bold;">- Rs ${formatCurrency(batteriesRate)}</span>
                </div>
              ` : ''}

              ${initialReceived > 0 ? `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding: 8px 12px; color: #000;">
                  <span style="font-size: 12px; font-weight: bold; color: #6b7280;">Received:</span>
                  <span style="font-size: 12px; font-weight: bold;">- Rs ${formatCurrency(initialReceived)}</span>
                </div>
              ` : ''}

              ${additionalPaymentsSection ? `
                <div style="background-color: #f9fafb; padding: 12px; margin-top: 8px;">
                  ${additionalPaymentsSection}
                </div>
              ` : ''}

              <div style="display: flex; justify-content: space-between; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 12px; color: white;">
                <span style="font-weight: bold; font-size: 14px;">${actualRemaining === 0 ? 'Total' : 'Balance Due'}</span>
                <span style="font-weight: bold; font-size: 14px;">${actualRemaining === 0 ? 'PAID' : `Rs ${formatCurrency(actualRemaining)}`}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Thank You Footer -->
        <div style="margin-bottom: 12px; margin-top: 32px; display: flex; justify-content: center;">
          <span style="font-family: 'Dancing Script', cursive; font-size: 48px; font-weight: 400; text-align: center;">
            Thank You !
          </span>
        </div>

      </div>
    `;
  };

  return (
    <>
      <div className='flex items-center gap-1'>
        <button
          onClick={handleDownload}
          className='rounded p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors'
          title='Download'
        >
          <FaDownload className='h-4 w-4' />
        </button>

        <button
          onClick={handlePrint}
          className='rounded p-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-colors'
          title='Print'
        >
          <BsPrinter className='h-4 w-4' />
        </button>

        <button
          onClick={handleWhatsApp}
          className='rounded p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors'
          title='Share via WhatsApp'
        >
          <FaWhatsapp className='h-4 w-4' />
        </button>

        {invoice.paymentStatus !== 'paid' &&
          invoice.status !== 'voided' && (
            <button
              onClick={(e) => handleAction('payment', e)}
              className='rounded p-1.5 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors'
              title='Add Payment'
            >
              <FaMoneyBillWave className='h-4 w-4' />
            </button>
          )}

        <button
          onClick={(e) => handleAction('delete', e)}
          className='rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors'
          title='Delete'
        >
          <FaTrash className='h-4 w-4' />
        </button>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />
    </>
  );
};
