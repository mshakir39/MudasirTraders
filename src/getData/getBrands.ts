'use server';
import { fastGetBrands } from '@/app/libs/fastData';

export async function getBrands() {
  try {
    const result = await fastGetBrands();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}
