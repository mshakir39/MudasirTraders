import { NextRequest, NextResponse } from 'next/server';
import { getCustomerPendingInvoices } from '@/actions/invoiceActions';

// GET /api/customers/[customerId]/pending-invoices
// Get all pending and partial invoices for a specific customer (for consolidation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // Await params for Next.js 15
    const resolvedParams = await params;
    let customerId: string | undefined = resolvedParams.customerId;

    // Fallback: try to extract from URL if params is undefined
    if (!customerId) {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/');
      const customerIndex = pathSegments.indexOf('customers') + 1;
      if (customerIndex < pathSegments.length) {
        customerId = pathSegments[customerIndex];
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Decode the customer name from URL
    const customerName = decodeURIComponent(customerId);

    // Get pending invoices for the customer
    const result = await getCustomerPendingInvoices(customerName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch pending invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: Array.isArray(result.data) ? result.data.length : 0,
    });
  } catch (error: any) {
    console.error('API Error - GET pending invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
