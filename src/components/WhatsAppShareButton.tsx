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
  className = ''
}) => {
  // Create the invoice message
  const totalAmount = invoiceData.products?.reduce((sum: number, product: any) => sum + product.totalPrice, 0) || 0;
  const remainingAmount = invoiceData.remainingAmount || 0;
  
  const message = `📋 *Invoice Details*

🏢 *MUDASIR TRADERS-DG KHAN*
📞 +923349627745, +923215392445
📍 General Bus Stand, near Badozai Market, Dera Ghazi Khan

📄 *Invoice #:* ${invoiceData.invoiceNo}
👤 *Customer:* ${invoiceData.customerName}
📞 *Contact:* ${invoiceData.customerContactNumber}

💰 *Total Amount:* Rs ${totalAmount}
${remainingAmount > 0 ? `💳 *Remaining:* Rs ${remainingAmount}` : '✅ *Status:* Paid in Full'}

📱 *Thank you for your business!*
For any queries, contact us at +923349627745`;

  const handleWhatsAppClick = async () => {
    try {
      // Use the exact same download handler as the download button
      const invoiceModal = document.querySelector('[data-invoice-modal]') as HTMLElement;
      
      if (invoiceModal) {
        // Use the same printHtmlAsPdf function as downloadHandler
        await printHtmlAsPdf(invoiceModal);
        
        // Open WhatsApp after PDF generation
        if (invoiceData.customerContactNumber) {
          const cleanPhone = invoiceData.customerContactNumber.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('92') ? cleanPhone : `92${cleanPhone}`;
          
          // Use wa.me format which opens WhatsApp desktop app
          const whatsappUrl = `https://wa.me/${formattedPhone}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        } else {
          // If no phone number, open WhatsApp without specific contact
          const whatsappUrl = `https://wa.me/`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };




  return (
    <button
      onClick={handleWhatsAppClick}
      className={`whatsapp-share-button ${className}`}
      title="Share via WhatsApp"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        borderRadius: '50%',
        transition: 'all 0.3s ease'
      }}
    >
      <FaWhatsapp 
        size={size} 
        color="#25D366"
        style={{
          transition: 'all 0.3s ease'
        }}
      />
    </button>
  );
};

export default WhatsAppShareButton;
