'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
}

export async function createCustomer(data: CustomerData) {
  try {
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

export async function getCustomers() {
  try {
    // React 19: Enhanced with client-side sorting for better compatibility
    const customers = await executeOperation('customers', 'findAll');

    // Sort customers by creation date (newest first)
    if (Array.isArray(customers)) {
      customers.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return { success: true, data: customers };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return { success: false, error: error.message };
  }
}
