'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface BrandData {
  brandName: string;
}

export async function createBrand(data: BrandData) {
  try {
    const result = await executeOperation('brands', 'insertOne', {
      brandName: data.brandName,
      createdAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBrand(id: string, data: Partial<BrandData>) {
  try {
    const result = await executeOperation('brands', 'updateOne', {
      documentId: id,
      ...data,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBrand(id: string) {
  try {
    const result = await executeOperation('brands', 'delete', {
      documentId: id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBrands() {
  try {
    const brands = await executeOperation('brands', 'findAll');
    return { success: true, data: brands };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
