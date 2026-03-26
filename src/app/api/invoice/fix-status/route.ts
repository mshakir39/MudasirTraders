import { NextRequest, NextResponse } from 'next/server';
import { updateInvoicePaymentStatus } from '@/actions/invoiceActions';

// POST /api/invoice/fix-status
// Fix payment status inconsistencies
export async function POST(request: NextRequest) {
  try {
    const { invoiceId, paymentStatus } = await request.json();

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    if (!paymentStatus || !['pending', 'partial', 'paid'].includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Valid payment status is required (pending, partial, paid)' },
        { status: 400 }
      );
    }

    // Update the payment status
    const result = await updateInvoicePaymentStatus(invoiceId, paymentStatus);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update payment status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payment status updated to "${paymentStatus}" successfully`,
      invoiceId: invoiceId,
      newStatus: paymentStatus
    });

  } catch (error: any) {
    console.error('API Error - POST fix payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
