import { executeOperation } from '@/app/libs/executeOperation';

export async function getSales() {
  return await executeOperation('sales', 'findAll');
} 