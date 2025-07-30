import { executeOperation } from '@/app/libs/executeOperation';

export async function getSales() {
  const sales = await executeOperation('sales', 'findAll');
  
  // Sort sales by date (newest first)
  if (Array.isArray(sales)) {
    sales.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }
  
  return sales;
} 