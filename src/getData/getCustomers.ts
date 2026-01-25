'use server';
import { fastGetCustomers } from '@/app/libs/fastData';

export async function getCustomers() {
  try {
    const result = await fastGetCustomers();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}
