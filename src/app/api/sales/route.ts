import {
  getSales,
  getSalesPaginated,
  getSalesCustomerNames,
} from '@/actions/salesActions';
import { SALES_BATCH_SIZE } from '@/lib/salesQuery';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all');
    const customersOnly = searchParams.get('customers');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerName = searchParams.get('customerName');

    if (customersOnly === 'true') {
      const result = await getSalesCustomerNames();
      return Response.json(result);
    }

    if (all === 'true') {
      const result = await getSales();
      return Response.json(result);
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : SALES_BATCH_SIZE;
    const options: {
      startDate?: Date;
      endDate?: Date;
      customerName?: string;
    } = {};

    if (startDate && endDate) {
      options.startDate = new Date(startDate);
      options.endDate = new Date(endDate);
    }
    if (customerName) {
      options.customerName = customerName;
    }

    const result = await getSalesPaginated(pageNum, limitNum, options);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
