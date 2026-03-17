import { convertDate } from './convertTime';
import { getAllSum } from './getTotalSum';
import { removeParentheses } from './formatters';

interface PrinterData {
  invoiceNo: string;
  customerName: string;
  customerContactNumber: string;
  customerAddress: string;
  products: any[];
  paymentMethod: string[];
  receivedAmount: string;
  remainingAmount: number;
  createdDate: string;
  additionalPayment?: any[];
  batteriesCountAndWeight?: string;
  batteriesRate?: string;
}

class ThermalPrinter {
  // Print invoice using browser print functionality with thermal printer formatting
  async printInvoice(data: PrinterData): Promise<void> {
    // Create the receipt content
    const receiptContent = this.createReceiptContent(data);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Write the HTML content with thermal printer styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <head>
        <title>Invoice ${data.invoiceNo}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              font-weight: 900;
              line-height: 1.1;
            }
            .receipt {
              width: 80mm;
              max-width: 80mm;
              white-space: pre;
              word-wrap: normal;
              overflow-wrap: normal;
              margin: 0;
              padding: 5px;
            }
            .company-name {
              font-size: 16px;
              font-weight: 900;
              text-align: center;
              margin: 5px 0;
            }
            .contact-info {
              font-size: 11px;
              font-weight: 700;
              text-align: center;
              margin: 2px 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.1;
            margin: 0;
            padding: 5px;
            width: 80mm;
            max-width: 80mm;
          }
          .receipt {
            width: 100%;
            white-space: pre;
            word-wrap: normal;
            overflow-wrap: normal;
          }
          .company-name {
            font-size: 16px;
            font-weight: 900;
            text-align: center;
            margin: 5px 0;
          }
          .contact-info {
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            margin: 2px 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
${receiptContent}
        </div>
      </body>
    </html>
    `);

    printWindow.document.close();

    // Simple print - no loops, no complex logic
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  }

  private createReceiptContent(data: PrinterData): string {
    const width = 48; // Standard thermal printer width

    const centerText = (text: string): string => {
      const spaceCount = Math.floor((width - text.length) / 2);
      const spaces = ' '.repeat(Math.max(0, spaceCount));
      return `${spaces}${text}\n`;
    };

    const createRow = (left: string, right: string): string => {
      const spaceCount = width - left.length - right.length;
      const spaces = ' '.repeat(Math.max(0, spaceCount));
      return `${left}${spaces}${right}\n`;
    };

    const line = (char: string = '-'): string => `${char.repeat(width)}\n`;

    const wrapText = (text: string, maxWidth: number = width): string => {
      if (text.length <= maxWidth) {
        return text;
      }
      // Split text into chunks that fit within maxWidth
      const chunks = [];
      for (let i = 0; i < text.length; i += maxWidth) {
        chunks.push(text.substring(i, i + maxWidth));
      }
      return chunks.join('\n');
    };

    let content = '';

    // Header
    content += `<div style="text-align: center; font-size: 14px; font-weight: 900; margin-bottom: 5px;">INVOICE</div>`;
    content += `<div style="text-align: center; font-size: 13px; font-weight: 700; margin-bottom: 5px;">INV-${data.invoiceNo}</div>`;
    content += line('=');

    // Company info - Use HTML div for larger font with logo
    content += `<div class="company-name" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cdefs%3E%3Cfilter id='shadow' x='-50%25' y='-50%25' width='200%25' height='200%25'%3E%3CfeDropShadow dx='0' dy='2' stdDeviation='4' floodOpacity='0.15'/%3E%3C/filter%3E%3C/defs%3E%3Crect x='0' y='0' width='48' height='48' rx='12' fill='%232563EB' filter='url(%23shadow)'/%3E%3Cpath d='M26 12L18 26H24L22 36L30 22H24L26 12Z' fill='white' stroke='white' stroke-width='0.5' stroke-linejoin='round'/%3E%3C/svg%3E" alt="Mudasir Traders Logo" style="width: 20px; height: 20px;">
      <span>MUDASIR TRADERS</span>
    </div>\n`;
    content += `<div class="contact-info">+923349627745, +923215392445</div>`;
    content += `<div class="contact-info">General Bus Stand, near Badozai Market</div>`;
    content += `<div class="contact-info">Dera Ghazi Khan</div>`;
    content += `<div class="contact-info">Owner@mudasirtraders.com</div>`;
    content += line('-');

    // Customer info
    content += 'BILL TO:\n';
    content += `${wrapText(removeParentheses(data.customerName))}\n`;
    if (data.customerContactNumber) {
      content += `${wrapText(data.customerContactNumber)}\n`;
    }
    if (data.customerAddress) {
      content += `${wrapText(data.customerAddress)}\n`;
    }
    content += line('-');

    // Date
    content += `Date: ${convertDate(data.createdDate).dateTime}\n`;
    content += line('=');

    // Products header aligned with column values
    const noWidth = 3; // "No" column width
    const descWidth = 18; // Description column width
    const qtyWidth = 5; // Quantity column width
    const rateWidth = 9; // Rate column width
    const totalWidth = 9; // Total column width

    // Create header with proper alignment
    const noHeader = 'No'.padStart(noWidth);
    const descHeader = 'Description'.padEnd(descWidth);
    const qtyHeader = 'Qty'.padStart(qtyWidth);
    const rateHeader = 'Rate'.padStart(rateWidth);
    const totalHeader = 'Total'.padStart(totalWidth);

    content += `${noHeader} ${descHeader} ${qtyHeader} ${rateHeader} ${totalHeader}\n`;
    content += line('-');

    // Products with proper column alignment
    data.products.forEach((item: any, index: number) => {
      let name = item?.batteryDetails
        ? `${item.brandName}-${item.batteryDetails.name}`
        : `${item.brandName}-${item.series}`;

      // Add battery specifications if available
      if (item?.batteryDetails) {
        const specs = [];
        if (item.batteryDetails.plate)
          specs.push(`${item.batteryDetails.plate} plates`);
        if (item.batteryDetails.ah) specs.push(`${item.batteryDetails.ah}AH`);
        if (item.batteryDetails.type) specs.push(item.batteryDetails.type);

        if (specs.length > 0) {
          name += ` (${specs.join(', ')})`;
        }
      }

      // Format each column with proper alignment
      const no = String(index + 1).padStart(noWidth);
      const description =
        name.length > descWidth
          ? name.substring(0, descWidth - 3) + '...'
          : name.padEnd(descWidth);
      const qty = String(item.quantity).padStart(qtyWidth);
      const rate = String(item.productPrice).padStart(rateWidth);
      const total = String(item.totalPrice).padStart(totalWidth);

      // Create the line with proper spacing
      const line = `${no} ${description} ${qty} ${rate} ${total}`;

      // Check if line fits within width
      if (line.length <= width) {
        content += `${line}\n`;
      } else {
        // If line is too long, truncate description further
        const availableWidth =
          width - noWidth - 1 - qtyWidth - 1 - rateWidth - 1 - totalWidth - 1; // account for spaces
        const truncatedDesc =
          name.substring(0, Math.max(0, availableWidth - 3)) + '...';
        content += `${no} ${truncatedDesc.padEnd(availableWidth)} ${qty} ${rate} ${total}\n`;
      }
    });

    // Totals
    const grandTotal = getAllSum(data.products, 'totalPrice');
    const totalQuantity = data.products.reduce((sum: number, item: any) => {
      // Try different possible quantity field names
      const qty = Number(item.quantity) || Number(item.qty) || Number(item.count) || 1;
      return sum + qty;
    }, 0);
    
    content += line('=');
    
    // Create totals row with less right alignment
    const totalLabel = 'TOTAL'.padEnd(descWidth);
    const qtyTotal = String(totalQuantity).padStart(qtyWidth + 1); // Reduce to 1 extra space
    const rateEmpty = ''.padStart(rateWidth);
    const totalAmount = String(grandTotal).padStart(totalWidth); // Move 1 space to the left
    
    // Match the exact structure: ${no} ${description} ${qty} ${rate} ${total}
    content += `   ${totalLabel} ${qtyTotal} ${rateEmpty} ${totalAmount}\n`;

    // Batteries count and weight (if available)
    if (data.batteriesCountAndWeight && data.batteriesRate) {
      content += createRow(
        data.batteriesCountAndWeight,
        `Rs ${data.batteriesRate}`
      );
    }

    // Payment details
    if (data.receivedAmount && data.receivedAmount !== '0') {
      content += createRow('RECEIVED:', `Rs ${data.receivedAmount}`);
    }

    // Additional payments
    if (data.additionalPayment && data.additionalPayment.length > 0) {
      data.additionalPayment.forEach((payment: any) => {
        const paymentDate = convertDate(payment.addedDate).dateTime;
        const paymentMethod = payment.paymentMethod
          ? ` (${payment.paymentMethod.join(' + ')})`
          : '';
        
        // Create the full text and wrap it if needed
        const fullText = `Received ${paymentDate}${paymentMethod}:`;
        const rightText = `Rs ${payment.amount}`;
        
        // Check if text needs wrapping
        if (fullText.length > 25) { // Leave space for amount
          // Split into two lines
          const line1 = `Received ${paymentDate}:`;
          const line2 = paymentMethod ? paymentMethod.replace(/[()]/g, '').trim() : '';
          
          content += createRow(line1, rightText);
          if (line2) {
            content += createRow(line2, '');
          }
        } else {
          content += createRow(fullText, rightText);
        }
      });
    }

    if (data.remainingAmount > 0) {
      content += createRow('BALANCE:', `Rs ${data.remainingAmount}`);
    }

    // Final total line
    content += line('=');
    if (data.remainingAmount === 0) {
      content += createRow('TOTAL:', 'PAID');
    } else {
      content += createRow('TOTAL REMAINING:', `Rs ${data.remainingAmount}`);
    }

    // Payment method
    content += line('-');
    content += `${wrapText(`Payment: ${data.paymentMethod.join(' + ')}`)}\n`;

    // Warranty codes - Hidden only for charging services
    if (!data.products.some((p: any) => p.isChargingService)) {
      content += 'Warranty Codes:\n';
      data.products.forEach((p: any) => {
        const productName = p.series || p.batteryDetails?.name || '';
        const warrantyCode = p.warrentyCode || '';

        if (warrantyCode) {
          const warrantyLine = `(${productName}): ${warrantyCode}`;
          content += `${wrapText(warrantyLine)}\n`;
        }
      });
    }

    // Footer
    content += '\n\n';
    content += centerText('Thank You!');
    content += centerText('Visit Again');
    content += '\n\n\n';

    return content;
  }
}

// Main function to print with thermal printer
export const printWithThermalPrinter = async (invoiceData: PrinterData) => {
  const printer = new ThermalPrinter();
  await printer.printInvoice(invoiceData);
};

export { ThermalPrinter };
