'use server';
import { fastGetStock } from '@/app/libs/fastData';

export async function getStock() {
  try {
    const result = await fastGetStock();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching stock:', error);
    return [];
  }
}

// export const getCategory = async (id: string) => {
//   try {
//     // Execute a findOne operation to retrieve a single document from the "categories" collection
//     const category = await executeOperation("categories","findOne", { _id: new ObjectId(id) })
//     // Return the category as a JSON response
//     return category as any;
//   } catch (err: any) {
//     // If an error occurs, return a JSON response with the error message
//     return { error: err.message };
//   }
// };
