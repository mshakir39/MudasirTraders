// app/api/customers/[customerId]/invoices/route.ts
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

// Place this at the top level, outside of GET
function isCustomerWithName(val: unknown): val is { customerName: string } {
  return (
    !!val &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    Object.prototype.hasOwnProperty.call(val, 'customerName')
  );
}

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    console.log('🔍 Fetching invoices for customer ID:', params.customerId);

    // Validate if customerId is a valid ObjectId or number
    let customerId: any;

    // Check if it's a MongoDB ObjectId
    if (
      ObjectId.isValid(params.customerId) &&
      params.customerId.length === 24
    ) {
      customerId = new ObjectId(params.customerId);
      console.log('🆔 Using ObjectId format:', customerId);
    } else {
      // Try to parse as number
      const numericId = parseInt(params.customerId);
      if (isNaN(numericId)) {
        console.error('❌ Invalid customer ID format:', params.customerId);
        return Response.json(
          { error: 'Invalid customer ID format' },
          { status: 400 }
        );
      }
      customerId = numericId;
      console.log('🔢 Using numeric ID:', customerId);
    }

    // First, let's check if the customer exists using findOne
    const customer = await executeOperation('customers', 'findOne', {
      $or: [{ _id: customerId }, { id: customerId }],
    });

    if (!customer) {
      console.log('❌ Customer not found with ID:', customerId);
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Use the type guard to safely log the customer name
    if (isCustomerWithName(customer)) {
      console.log('✅ Customer found:', customer.customerName);
    } else {
      console.log('⚠️ Customer not found or invalid:', customer);
    }

    // Get all invoices using findAll or getAll (check which operation your executeOperation supports)
    let allInvoices;
    try {
      // Try different operation names that might be supported
      allInvoices = await executeOperation('invoices', 'findAll');
    } catch (error) {
      try {
        allInvoices = await executeOperation('invoices', 'getAll');
      } catch (error2) {
        try {
          allInvoices = await executeOperation('invoices', 'find', {});
        } catch (error3) {
          console.error('❌ Could not fetch invoices with any operation');
          return Response.json(
            { error: 'Database operation not supported' },
            { status: 500 }
          );
        }
      }
    }

    console.log(
      '📊 Total invoices found:',
      Array.isArray(allInvoices) ? allInvoices.length : 'Not an array'
    );

    // Filter invoices for this customer
    const customerInvoices = Array.isArray(allInvoices)
      ? allInvoices.filter((invoice: any) => {
          // Try multiple matching strategies
          return (
            (invoice.customerId === customerId ||
              invoice.customerId === params.customerId ||
              invoice.customerId?.toString() === params.customerId ||
              invoice.clientName ===
                (isCustomerWithName(customer) ? customer.customerName : undefined)) &&
            invoice.customerType === 'Regular'
          );
        })
      : [];

    console.log('🎯 Filtered customer invoices:', customerInvoices.length);

    // Sort by creation date (newest first)
    const sortedInvoices = customerInvoices.sort(
      (a: any, b: any) =>
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );

    console.log('✅ Returning sorted invoices:', sortedInvoices.length);
    return Response.json(sortedInvoices);
  } catch (error: any) {
    console.error('💥 Error fetching customer invoices:', error);
    return Response.json(
      {
        error: error.message || 'Failed to fetch customer invoices',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
