import { executeOperation } from '@/app/libs/executeOperation';

export async function getCustomers() {
  return await executeOperation('customers', 'findAll');
} 