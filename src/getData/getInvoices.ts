'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export const getAllInvoices = async () => {
  try {
    // Execute a find operation to retrieve data from the "categories" collection
    const stocks = await executeOperation('invoices', 'findAll');
    // Return the categories as a JSON response
    return stocks as any;
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return [err.message];
  }
};
