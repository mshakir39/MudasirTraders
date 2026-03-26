import { NextRequest, NextResponse } from 'next/server';
import { createConsolidatedInvoice } from '@/actions/invoiceActions';
import { InvoiceDataUtil } from '@/utils/invoiceDataUtil';

// POST /api/invoices/consolidate
// Create a consolidated invoice and void pending invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const {
      customerName,
      customerPhone,
      customerAddress,
      newProducts,
      pendingInvoiceIds,
      previousAmounts,
      notes,
      receivedAmount, // Allow payment during consolidation
      paymentMethod, // Allow payment method selection
      batteriesCountAndWeight, // Add battery count and weight
      batteriesRate, // Add battery rate
      customerType, // Add customer type
      customerId, // Add customer ID
      vehicleNo, // Add vehicle number
    } = body;

    // Required fields validation
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    if (
      !newProducts ||
      !Array.isArray(newProducts) ||
      newProducts.length === 0
    ) {
      return NextResponse.json(
        { error: 'At least one new product is required' },
        { status: 400 }
      );
    }

    // Validate received amount if provided
    if (receivedAmount !== undefined && receivedAmount !== null) {
      const parsedAmount = parseFloat(receivedAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return NextResponse.json(
          { error: 'Invalid received amount. Must be a positive number.' },
          { status: 400 }
        );
      }
    }

    // Validate batteries rate if provided
    if (batteriesRate !== undefined && batteriesRate !== null) {
      const parsedRate = parseFloat(batteriesRate);
      if (isNaN(parsedRate) || parsedRate < 0) {
        return NextResponse.json(
          { error: 'Invalid batteries rate. Must be a positive number.' },
          { status: 400 }
        );
      }
    }

    // Validate new products using InvoiceDataUtil (support payment during consolidation)
    const productValidation = InvoiceDataUtil.validateInvoice({
      customerName,
      customerContactNumber: customerPhone,
      customerAddress,
      products: newProducts,
      receivedAmount: receivedAmount || 0, // Allow payment during consolidation
      paymentMethod: paymentMethod || ['Cash'], // Allow payment method selection
    });

    if (!productValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid product data',
          details: productValidation.errors,
        },
        { status: 400 }
      );
    }

    console.log('🔍 Debug - Backend received:', {
      pendingInvoiceIds,
      previousAmounts,
      newProductsCount: newProducts.length,
      customerName,
    });

    if (
      !pendingInvoiceIds ||
      !Array.isArray(pendingInvoiceIds) ||
      pendingInvoiceIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'At least one pending invoice ID is required' },
        { status: 400 }
      );
    }

    if (
      !previousAmounts ||
      !Array.isArray(previousAmounts) ||
      previousAmounts.length === 0
    ) {
      return NextResponse.json(
        { error: 'Previous amounts are required' },
        { status: 400 }
      );
    }

    if (pendingInvoiceIds.length !== previousAmounts.length) {
      return NextResponse.json(
        {
          error:
            'Pending invoice IDs and previous amounts must have the same length',
        },
        { status: 400 }
      );
    }

    // Validate new products structure
    for (const product of newProducts) {
      if (
        !product.brandName ||
        !product.series ||
        !product.unitPrice ||
        !product.quantity
      ) {
        return NextResponse.json(
          {
            error:
              'Each product must have brandName, series, unitPrice, and quantity',
            details: product,
          },
          { status: 400 }
        );
      }

      if (
        parseFloat(product.unitPrice) <= 0 ||
        parseInt(product.quantity) <= 0
      ) {
        return NextResponse.json(
          {
            error: 'Product price and quantity must be positive numbers',
            details: product,
          },
          { status: 400 }
        );
      }
    }

    // Validate previous amounts
    for (const amount of previousAmounts) {
      if (typeof amount !== 'number' || amount < 0) {
        return NextResponse.json(
          { error: 'Previous amounts must be positive numbers' },
          { status: 400 }
        );
      }
    }

    // Create consolidated invoice
    const result = await createConsolidatedInvoice(
      customerName,
      customerPhone,
      customerAddress || '',
      newProducts,
      pendingInvoiceIds,
      previousAmounts,
      notes,
      parseFloat(receivedAmount || '0') || 0, // Convert to number
      paymentMethod || ['Cash'], // Pass payment method
      batteriesCountAndWeight, // Pass battery count and weight
      parseFloat(batteriesRate || '0') || 0, // Convert to number
      customerType, // Pass customer type
      customerId, // Pass customer ID
      vehicleNo // Pass vehicle number
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create consolidated invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newInvoice: result.data?.newInvoice,
        voidedInvoices: result.data?.voidedInvoices,
        consolidatedCount: result.data?.consolidatedCount,
        message: `Successfully consolidated ${result.data?.consolidatedCount || 0} invoices`,
      },
    });
  } catch (error: any) {
    console.error('API Error - POST consolidate invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
