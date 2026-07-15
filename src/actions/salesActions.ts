'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { buildSalesFilter, SALES_BATCH_SIZE } from '@/lib/salesQuery';

async function getSalesSummary(filter: Record<string, unknown>) {
  const db = await connectToMongoDB();
  if (!db) {
    throw new Error('Failed to connect to database');
  }

  const [agg] = await db
    .collection('sales')
    .aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
          customers: { $addToSet: '$customerName' },
        },
      },
    ])
    .toArray();

  const totalSales = (agg?.totalSales as number) ?? 0;
  const totalRevenue = (agg?.totalRevenue as number) ?? 0;
  const uniqueCustomers = ((agg?.customers as string[]) ?? []).filter(
    Boolean
  ).length;

  return {
    totalSales,
    totalRevenue,
    avgSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
    uniqueCustomers,
  };
}

interface SalesData {
  customerName: string;
  brandName: string;
  series: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: Date;
  paymentMethod?: string;
  notes?: string;
}

export async function createSale(data: SalesData) {
  try {
    const result = await executeOperation('sales', 'insertOne', {
      ...data,
      createdAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSale(id: string, data: Partial<SalesData>) {
  try {
    const result = await executeOperation('sales', 'updateOne', {
      documentId: id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSale(id: string) {
  try {
    if (!id) {
      throw new Error('Sale ID is required');
    }

    // React 19: Enhanced with better validation
    const result = await executeOperation('sales', 'delete', {
      documentId: id,
    });

    if (!result) {
      throw new Error('Sale not found or already deleted');
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return { success: false, error: error.message };
  }
}

export async function getSalesPaginated(
  page = 1,
  limit = SALES_BATCH_SIZE,
  options?: {
    startDate?: Date;
    endDate?: Date;
    customerName?: string;
  }
) {
  try {
    const filter = buildSalesFilter(options);
    const result = (await executeOperation('sales', 'findPaginated', {
      filter,
      sort: { date: -1 },
      skip: (page - 1) * limit,
      limit,
    })) as { docs: any[]; total: number };

    const summary = await getSalesSummary(filter);

    return {
      success: true,
      data: result.docs,
      summary,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page * limit < result.total,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    console.error('Error fetching paginated sales:', error);
    return { success: false, error: error.message };
  }
}

export async function getSalesCustomerNames() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const names = await db.collection('sales').distinct('customerName');
    const data = (names as string[])
      .filter((name) => name && name.trim() !== '')
      .sort();

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSales() {
  try {
    const result = (await executeOperation('sales', 'findPaginated', {
      filter: {},
      sort: { date: -1 },
      skip: 0,
    })) as { docs: any[]; total: number };

    return { success: true, data: result.docs };
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return { success: false, error: error.message };
  }
}

export async function getSalesByDateRange(startDate: Date, endDate: Date) {
  try {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const result = (await executeOperation('sales', 'findPaginated', {
      filter: buildSalesFilter({ startDate, endDate }),
      sort: { date: -1 },
      skip: 0,
    })) as { docs: any[]; total: number };

    return { success: true, data: result.docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesByCustomer(customerName: string) {
  try {
    const result = (await executeOperation('sales', 'findPaginated', {
      filter: buildSalesFilter({ customerName }),
      sort: { date: -1 },
      skip: 0,
    })) as { docs: any[]; total: number };

    return { success: true, data: result.docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
