import { convertDate } from './convertTime';
import { formatRupees } from './formatRupees';
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
}

class ThermalPrinter {
  // Print invoice using browser print functionality with thermal printer formatting
  async printInvoice(data: PrinterData): Promise<void> {
    try {
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
        <html>
        <head>
          <title>Invoice ${data.invoiceNo}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 10px;
              width: 80mm;
              max-width: 80mm;
            }
            .receipt {
              width: 100%;
              white-space: pre;
              word-wrap: normal;
              overflow-wrap: normal;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 5px 0; }
            @media screen {
              body { background: #f5f5f5; }
              .receipt { background: white; padding: 20px; margin: 20px auto; max-width: 80mm; }
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

      // Wait a moment for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

    } catch (error) {
      console.error('Print failed:', error);
      throw error;
    }
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
    content += centerText('INVOICE');
    content += centerText(`INV-${data.invoiceNo}`);
    content += line('=');

    // Company info
    content += centerText('MUDASIR TRADERS-DG KHAN');
    content += centerText('+923349627745, +923215392445');
    content += centerText('General Bus Stand, near Badozai Market');
    content += centerText('Dera Ghazi Khan');
    content += centerText('Owner@mudasirtraders.com');
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

    // Products header
    content += 'No  Description        Qty  Rate    Total\n';
    content += line('-');

    // Products
    data.products.forEach((item: any, index: number) => {
      const name = item?.batteryDetails 
        ? `${item.brandName}-${item.batteryDetails.name}` 
        : `${item.brandName}-${item.series}`;
      
      const no = String(index + 1).padStart(2);
      // Ensure description doesn't exceed 18 characters
      const description = name.length > 18 ? name.substring(0, 15) + '...' : name.padEnd(18);
      const qty = String(item.quantity).padStart(3);
      const rate = String(item.productPrice).padStart(6);
      const total = String(item.totalPrice).padStart(7);

      // Verify total line length doesn't exceed width
      const line = `${no}  ${description} ${qty} ${rate} ${total}`;
      if (line.length <= width) {
        content += `${line}\n`;
      } else {
        // If line is too long, truncate description further
        const maxDescLength = width - no.length - 2 - 3 - 6 - 7 - 4; // account for spaces
        const truncatedDesc = name.substring(0, Math.max(0, maxDescLength - 3)) + '...';
        content += `${no}  ${truncatedDesc.padEnd(18)} ${qty} ${rate} ${total}\n`;
      }
    });

    // Totals
    const grandTotal = getAllSum(data.products, 'totalPrice');
    content += line('=');
    content += createRow('TOTAL:', `Rs ${grandTotal}`);

    // Payment details
    if (data.receivedAmount && data.receivedAmount !== '0') {
      content += createRow('RECEIVED:', `Rs ${data.receivedAmount}`);
    }
    
    if (data.remainingAmount > 0) {
      content += createRow('BALANCE:', `Rs ${data.remainingAmount}`);
    }

    // Payment method
    content += line('-');
    content += `${wrapText(`Payment: ${data.paymentMethod.join(' + ')}`)}\n`;

    // Warranty codes
    content += 'Warranty Codes:\n';
    data.products.forEach((p: any) => {
      const productName = p.series || p.batteryDetails?.name || '';
      const warrantyCode = p.warrentyCode || '';
      
      if (warrantyCode) {
        const warrantyLine = `(${productName}): ${warrantyCode}`;
        content += `${wrapText(warrantyLine)}\n`;
      }
    });

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