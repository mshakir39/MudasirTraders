// app/api/customers/[customerId]/invoices/route.ts
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // React 19/Next.js 15+: Await params before using
    const { customerId } = await params;

    // Validate if customerId is a valid ObjectId or number
    let customerIdValue: any;
    if (ObjectId.isValid(customerId) && customerId.length === 24) {
      customerIdValue = new ObjectId(customerId);
    } else {
      const numericId = parseInt(customerId, 10);
      if (isNaN(numericId)) {
        return Response.json(
          { error: 'Invalid customer ID format' },
          { status: 400 }
        );
      }
      customerIdValue = numericId;
    }

    const db = await connectToMongoDB();
    if (!db) {
      return Response.json(
        { error: 'Failed to connect to database' },
        { status: 500 }
      );
    }

    const customerOr: any[] = [];
    if (customerIdValue instanceof ObjectId) {
      customerOr.push({ _id: customerIdValue });
    }
    customerOr.push({ _id: customerId });
    customerOr.push({ id: customerId });
    if (typeof customerIdValue === 'number') {
      customerOr.push({ id: customerIdValue });
      customerOr.push({ _id: customerIdValue });
    }

    const customer = await db.collection('customers').findOne({
      $or: customerOr,
    });

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerObjId =
      ObjectId.isValid(customerId) && customerId.length === 24
        ? new ObjectId(customerId)
        : null;
    const numericId = parseInt(customerId, 10);
    const hasNumericId = !isNaN(numericId);

    const customerName = (customer as any)?.customerName?.trim();
    const customerPhone = (
      (customer as any)?.phoneNumber || (customer as any)?.customerContactNumber
    )?.trim();

    const orConditions: any[] = [];

    // Match by ID references
    if (customerObjId) {
      orConditions.push({ clientId: customerObjId });
      orConditions.push({ customerId: customerObjId });
    }
    orConditions.push({ clientId: customerId });
    orConditions.push({ customerId: customerId });
    if (hasNumericId) {
      orConditions.push({ clientId: numericId });
      orConditions.push({ customerId: numericId });
    }

    // Match by customer name and phone
    if (customerName && customerPhone) {
      orConditions.push({
        customerName: customerName,
        customerContactNumber: customerPhone,
      });
    }

    // Match by customer name
    if (customerName) {
      orConditions.push({ customerName: customerName });
    }

    // Match by phone
    if (customerPhone) {
      orConditions.push({ customerContactNumber: customerPhone });
    }

    const rawInvoices = await db
      .collection('invoices')
      .find({ $or: orConditions })
      .toArray();

    // Map and sort invoices by newest first
    const sortedInvoices = rawInvoices
      .map((inv: any) => ({
        ...inv,
        id: inv._id ? inv._id.toString() : inv.id,
        _id: inv._id ? inv._id.toString() : inv._id,
      }))
      .sort(
        (a: any, b: any) =>
          new Date(b.createdDate || b.createdAt || 0).getTime() -
          new Date(a.createdDate || a.createdAt || 0).getTime()
      );

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
