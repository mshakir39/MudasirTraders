'use server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { executeOperation } from '@/app/libs/executeOperation';
import { ICategory } from '@/interfaces';

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface BatteryData {
  name: string;
  plate: string;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

interface CategoryData {
  brandName: string;
  series: BatteryData[];
  salesTax: number;
}

export async function createCategory(data: Partial<ICategory>): Promise<ActionResponse<ICategory>> {
  'use server';
  try {
    const result = await executeOperation('categories', 'insertOne', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create category' };
  }
}

export async function updateCategory(id: string, data: Partial<ICategory>): Promise<ActionResponse<ICategory>> {
  'use server';
  try {
    const { ObjectId } = require('mongodb');
    
    // First save current state to history
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    const collection = db.collection('categories');
    const historyCollection = db.collection('categoryHistory');
    
    const currentCategory = await collection.findOne({ _id: new ObjectId(id) });
    if (currentCategory) {
      // Remove _id to avoid duplicate key error, MongoDB will auto-generate new _id
      const { _id, ...historyData } = currentCategory;
      
      // Check if a history entry already exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
      
      const existingHistory = await historyCollection.findOne({
        categoryId: new ObjectId(id),
        historyDate: {
          $gte: today,
          $lt: tomorrow
        }
      });
      
      if (existingHistory) {
        // Update existing history entry for today
        await historyCollection.updateOne(
          { _id: existingHistory._id },
          {
            $set: {
              ...historyData,
              historyDate: new Date()
            }
          }
        );
      } else {
        // Create new history entry
        await historyCollection.insertOne({
          categoryId: new ObjectId(id),
          ...historyData,
          historyDate: new Date()
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('categories', 'updateOne', {
      id,
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update category' };
  }
}

export async function patchCategory(id: string, data: Partial<ICategory>): Promise<ActionResponse<ICategory>> {
  'use server';
  try {
    const { ObjectId } = require('mongodb');
    
    // First save current state to history
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    const collection = db.collection('categories');
    const historyCollection = db.collection('categoryHistory');
    
    const currentCategory = await collection.findOne({ _id: new ObjectId(id) });
    if (currentCategory) {
      // Remove _id to avoid duplicate key error, MongoDB will auto-generate new _id
      const { _id, ...historyData } = currentCategory;
      
      // Check if a history entry already exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
      
      const existingHistory = await historyCollection.findOne({
        categoryId: new ObjectId(id),
        historyDate: {
          $gte: today,
          $lt: tomorrow
        }
      });
      
      if (existingHistory) {
        // Update existing history entry for today
        await historyCollection.updateOne(
          { _id: existingHistory._id },
          {
            $set: {
              ...historyData,
              historyDate: new Date()
            }
          }
        );
      } else {
        // Create new history entry
        await historyCollection.insertOne({
          categoryId: new ObjectId(id),
          ...historyData,
          historyDate: new Date()
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('categories', 'updateOne', {
      id,
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error patching category:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to patch category' };
  }
}

interface CategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
  _id?: string;
}

export async function getCategoryHistory(categoryId: string): Promise<ActionResponse<CategoryHistory[]>> {
  'use server';
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    const historyCollection = db.collection('categoryHistory');
    
    const rawHistory = await historyCollection
      .find({ categoryId: new ObjectId(categoryId) })
      .sort({ historyDate: -1 })
      .toArray();

    // Transform the raw data into the expected format
    const history = rawHistory.map(entry => ({
      _id: entry._id.toString(),
      categoryId: entry.categoryId.toString(),
      brandName: entry.brandName,
      series: entry.series,
      salesTax: entry.salesTax,
      historyDate: new Date(entry.historyDate),
      createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined
    })) as CategoryHistory[];

    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching category history:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch category history' };
  }
} 