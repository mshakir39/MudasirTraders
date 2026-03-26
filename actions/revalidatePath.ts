'use server';

import { revalidatePath } from 'next/cache';

/**
 * Generic server action to revalidate any path
 * @param path - The path to revalidate (e.g., '/stock', '/category', '/invoices')
 */
export const revalidatePathAction = async (path: string) => {
  revalidatePath(path);
};
