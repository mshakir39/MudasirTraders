'use server';
import { executeOperation } from '@/app/libs/executeOperation';

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
    const result = await executeOperation('sales', 'delete', {
      documentId: id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSales() {
  try {
    const sales = await executeOperation('sales', 'findAll');
    return { success: true, data: sales };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesByDateRange(startDate: Date, endDate: Date) {
  try {
    const sales = await executeOperation('sales', 'find', {
      saleDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    return { success: true, data: sales };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesByCustomer(customerName: string) {
  try {
    const sales = await executeOperation('sales', 'find', {
      customerName: customerName,
    });
    return { success: true, data: sales };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
} 