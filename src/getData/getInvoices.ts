'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export const getAllInvoices = async () => {
  try {
    // Execute a find operation to retrieve data from the "invoices" collection
    const invoices = await executeOperation('invoices', 'findAll');
    
    // Sort invoices by creation date (newest first)
    if (Array.isArray(invoices)) {
      invoices.sort((a: any, b: any) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }
    
    // Return the invoices as a JSON response
    return invoices as any;
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return [err.message];
  }
};
