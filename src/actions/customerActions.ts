'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import {
  CUSTOMERS_BATCH_SIZE,
  buildCustomersFilter,
} from '@/lib/customersQuery';

interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
}

export async function createCustomer(data: CustomerData) {
  try {
    // Check if customer with same phone number already exists
    const existingCustomer = await executeOperation('customers', 'findOne', {
      phoneNumber: data.phoneNumber,
    });

    if (existingCustomer) {
      return {
        success: false,
        error: 'Customer with this phone number already exists',
      };
    }

    // Also check by customer name (optional but helpful)
    const existingByName = await executeOperation('customers', 'findOne', {
      customerName: data.customerName,
    });

    if (existingByName) {
      return {
        success: false,
        error: 'Customer with this name already exists',
      };
    }

    const customerDocument = {
      ...data,
      createdAt: new Date(),
    };

    await executeOperation('customers', 'insertOne', customerDocument);

    // Return the customer document that was inserted
    return { success: true, data: customerDocument };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomer(id: string, data: Partial<CustomerData>) {
  try {
    const result = await executeOperation('customers', 'updateOne', {
      documentId: id,
      ...data,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    if (!id) {
      throw new Error('Customer ID is required');
    }

    const result = await executeOperation('customers', 'delete', {
      documentId: id,
    });

    if (!result) {
      throw new Error('Customer not found or already deleted');
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomers(customerType?: string) {
  try {
    const filter = buildCustomersFilter({ customerType });
    const result = (await executeOperation('customers', 'findPaginated', {
      filter,
      sort: { createdAt: -1 },
      skip: 0,
    })) as { docs: any[]; total: number };

    return { success: true, data: result.docs };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomersPaginated(
  page = 1,
  limit = CUSTOMERS_BATCH_SIZE,
  options?: {
    customerType?: string;
    search?: string;
  }
) {
  try {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const filter = buildCustomersFilter(options);
    const result = (await executeOperation('customers', 'findPaginated', {
      filter,
      sort: { createdAt: -1 },
      skip: (safePage - 1) * safeLimit,
      limit: safeLimit,
    })) as { docs: any[]; total: number };

    return {
      success: true,
      data: result.docs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / safeLimit) || 0,
        hasNext: safePage * safeLimit < result.total,
        hasPrev: safePage > 1,
      },
    };
  } catch (error: any) {
    console.error('Error fetching paginated customers:', error);
    return { success: false, error: error.message };
  }
}
