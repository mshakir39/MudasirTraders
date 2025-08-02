'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface InvoiceItem {
  brandName: string;
  series: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'partial';
  invoiceDate: Date;
  dueDate?: Date;
  notes?: string;
}

export async function createInvoice(data: InvoiceData) {
  try {
    const result = await executeOperation('invoices', 'insertOne', {
      ...data,
      createdAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoice(id: string, data: Partial<InvoiceData>) {
  try {
    const result = await executeOperation('invoices', 'updateOne', {
      documentId: id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const result = await executeOperation('invoices', 'delete', {
      documentId: id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoices() {
  try {
    const invoices = await executeOperation('invoices', 'findAll');

    // Sort invoices by creation date (newest first)
    if (Array.isArray(invoices)) {
      invoices.sort((a: any, b: any) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await executeOperation('invoices', 'findOne', {
      documentId: id,
    });
    return { success: true, data: invoice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByCustomer(customerName: string) {
  try {
    const invoices = await executeOperation('invoices', 'find', {
      customerName: customerName,
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByDateRange(startDate: Date, endDate: Date) {
  try {
    const invoices = await executeOperation('invoices', 'find', {
      invoiceDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoicePaymentStatus(
  id: string,
  paymentStatus: 'pending' | 'paid' | 'partial'
) {
  try {
    const result = await executeOperation('invoices', 'updateOne', {
      documentId: id,
      paymentStatus,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
