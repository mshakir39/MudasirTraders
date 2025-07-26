'use server';
import { executeOperation } from '@/app/libs/executeOperation';

export async function getBrands() {
  try {
    const brands = await executeOperation('brands', 'findAll');
    return brands;
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}
