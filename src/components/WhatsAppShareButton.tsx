import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import printHtmlAsPdf from '@/utils/printHtmlAsPdf';
import './WhatsAppShareButton.css';

interface WhatsAppShareButtonProps {
  invoiceData: any;
  size?: number;
  className?: string;
}

const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  invoiceData,
  size = 32,
  className = '',
}) => {
  // Create the invoice message - match InvoicePreviewPricing calculations
  const initialReceived = Number(invoiceData.receivedAmount) || 0;
  const additionalPayments = invoiceData.additionalPayment || [];
  const totalAdditionalReceived = additionalPayments.reduce(
    (sum: number, payment: any) => sum + Number(payment.amount),
    0
  );
  const totalReceived = initialReceived + totalAdditionalReceived;

  // Calculate amounts for consolidated invoices
  const consolidatedAmount =
    invoiceData.previousAmounts?.reduce(
      (sum: number, amount: number) => sum + amount,
      0
    ) || 0;
  const subtotalAmount =
    invoiceData.products?.reduce(
      (sum: number, product: any) => sum + product.totalPrice,
      0
    ) || 0;

  // For consolidated invoices, total includes both consolidated amount and new items
  const totalAmount =
    invoiceData.consolidatedFrom && invoiceData.consolidatedFrom.length > 0
      ? subtotalAmount + consolidatedAmount
      : subtotalAmount;

  const batteriesRate = Number(invoiceData.batteriesRate) || 0;
  const actualRemaining = totalAmount - totalReceived - batteriesRate;

  const message = `*INVOICE RECEIPT*
================================

*MUDASIR TRADERS-DG KHAN*

Phone: +923349627745 | +923215392445
Location: General Bus Stand, Badozai Market, Dera Ghazi Khan

--------------------------------

*INVOICE INFORMATION*

Invoice No: *${invoiceData.invoiceNo}*
Customer: *${invoiceData.customerName}*
Contact: *${invoiceData.customerContactNumber}*

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

${
  process.env.NEXT_PUBLIC_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://mudasirtraders.com')
}/invoice/${invoiceData._id || invoiceData.id || 'unknown'}

================================

*Thank you for choosing us!*

Questions? Call us at:
+923349627745

================================`;

  const handleWhatsAppClick = async () => {
    try {
      // Generate PDF and get it as base64 or blob
      const invoiceModal = document.querySelector(
        '[data-invoice-modal]'
      ) as HTMLElement;

      if (invoiceModal) {
        // For now, we'll use the text-only approach since direct PDF sharing isn't possible
        // You could implement cloud upload here if needed

        if (invoiceData.customerContactNumber) {
          const cleanPhone = invoiceData.customerContactNumber.replace(
            /\D/g,
            ''
          );
          const formattedPhone = cleanPhone.startsWith('92')
            ? cleanPhone
            : `92${cleanPhone}`;

          // Create WhatsApp message with text only
          const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        } else {
          // If no phone number, open WhatsApp without specific contact
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (error) {}
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`whatsapp-share-button ${className}`}
      title='Share via WhatsApp'
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
      }}
    >
      <FaWhatsapp
        size={size}
        color='var(--color-whatsapp)'
        style={{
          transition: 'all 0.3s ease',
        }}
      />
    </button>
  );
};

export default WhatsAppShareButton;
