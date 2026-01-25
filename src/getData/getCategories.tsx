'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export const getCategories = async () => {
  try {
    // Execute a find operation to retrieve data from the "categories" collection
    const categories = await executeOperation('categories', 'findAll');
    // Return the categories directly, ensuring array type
    return Array.isArray(categories) ? categories : [];
  } catch (err: any) {
    // If an error occurs, return empty array instead of error message
    console.error('Error fetching categories:', err.message);
    return [];
  }
};

export const getCategory = async (id: string) => {
  try {
    // Execute a findOne operation to retrieve a single document from the "categories" collection
    const category = await executeOperation('categories', 'findOne', {
      _id: new ObjectId(id),
    });
    // Return the category as a JSON response
    return category as any;
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return { error: err.message };
  }
};
