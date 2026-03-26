'use server';
import { 
  getInvoices, 
  getInvoicesPaginated,
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  getInvoiceById,
  getInvoicesByCustomer,
  getInvoicesByDateRange,
  updateInvoicePaymentStatus,
  getCustomerPendingInvoices,
  createConsolidatedInvoice,
  getInvoiceTransferChain,
  generateInvoiceNumber
} from '@/actions/invoiceActions';

export async function GET(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const customerName = searchParams.get('customerName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const pendingOnly = searchParams.get('pendingOnly');
    const transferChain = searchParams.get('transferChain');

    if (id) {
      // Get single invoice by ID
      const result = await getInvoiceById(id);
      return Response.json(result);
    } else if (transferChain) {
      // Get invoice transfer chain (audit trail)
      const result = await getInvoiceTransferChain(transferChain);
      return Response.json(result);
    } else if (customerName && pendingOnly === 'true') {
      // Get customer pending invoices for consolidation
      const result = await getCustomerPendingInvoices(customerName);
      return Response.json(result);
    } else if (customerName) {
      // Get invoices by customer
      const result = await getInvoicesByCustomer(customerName);
      return Response.json(result);
    } else if (startDate && endDate) {
      // Get invoices by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const result = await getInvoicesByDateRange(start, end);
      return Response.json(result);
    } else if (page || limit) {
      // Get paginated invoices
      const pageNum = page ? parseInt(page) : 1;
      const limitNum = limit ? parseInt(limit) : 50;
      const result = await getInvoicesPaginated(pageNum, limitNum);
      return Response.json(result);
    } else {
      // Get all invoices
      const result = await getInvoices();
      return Response.json(result);
    }
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: any) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    if (action === 'consolidate') {
      // Create consolidated invoice
      const result = await createConsolidatedInvoice(
        data.customerName,
        data.customerPhone,
        data.customerAddress,
        data.pendingInvoices,
        data.paymentMethod,
        data.notes
      );
      return Response.json(result);
    } else if (action === 'generateNumber') {
      // Generate next invoice number
      const invoiceNumber = await generateInvoiceNumber();
      return Response.json({ 
        success: true, 
        data: { invoiceNumber } 
      });
    } else {
      // Create regular invoice
      const result = await createInvoice(data);
      return Response.json(result);
    }
  } catch (err: any) {
    return Response.json({ 
      success: false,
      error: err.message 
    }, { status: 500 });
  }
}

export async function PUT(req: any) {
  try {
    const { id, action, ...updateData } = await req.json();
    
    if (!id) {
      return Response.json({ 
        success: false,
        error: 'Invoice ID is required' 
      }, { status: 400 });
    }
    
    if (action === 'paymentStatus') {
      // Update payment status only
      const result = await updateInvoicePaymentStatus(id, updateData.paymentStatus);
      return Response.json(result);
    } else {
      // Update invoice using the existing invoice action
      const result = await updateInvoice(id, updateData);
      return Response.json(result);
    }
  } catch (err: any) {
    return Response.json({ 
      success: false,
      error: err.message 
    }, { status: 500 });
  }
}

export async function DELETE(req: any) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return Response.json({ 
        success: false,
        error: 'Invoice ID is required' 
      }, { status: 400 });
    }
    
    // Delete invoice using the existing invoice action
    const result = await deleteInvoice(id);
    
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ 
      success: false,
      error: err.message 
    }, { status: 500 });
  }
}
