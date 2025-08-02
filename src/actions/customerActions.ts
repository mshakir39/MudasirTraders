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
    const result = await executeOperation('customers', 'insertOne', {
      ...data,
      createdAt: new Date(),
    });
    return { success: true, data: result };
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

export async function getCustomers() {
  try {
    const customers = await executeOperation('customers', 'findAll');
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
