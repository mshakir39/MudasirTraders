import { executeOperation } from '@/app/libs/executeOperation';

export const getAllStock = async () => {
  try {
    // Execute a find operation to retrieve data from the "categories" collection
    const stocks = await executeOperation('stock', 'findAll');
    // Return the categories as a JSON response
    return stocks as any;
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return [err.message];
  }
};

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
