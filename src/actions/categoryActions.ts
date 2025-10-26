'use server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { executeOperation } from '@/app/libs/executeOperation';
import { ICategory, IBatterySeries } from '@/interfaces';

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

export async function createCategory(
  data: Partial<ICategory>
): Promise<ActionResponse<ICategory>> {
  'use server';
  try {
    const result = await executeOperation('categories', 'insertOne', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}

export async function updateCategory(
  id: string,
  data: Partial<ICategory>
): Promise<ActionResponse<ICategory>> {
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
          $lt: tomorrow,
        },
      });

      if (existingHistory) {
        // Update existing history entry for today
        await historyCollection.updateOne(
          { _id: existingHistory._id },
          {
            $set: {
              ...historyData,
              historyDate: new Date(),
            },
          }
        );
      } else {
        // Create new history entry
        await historyCollection.insertOne({
          categoryId: new ObjectId(id),
          ...historyData,
          historyDate: new Date(),
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('categories', 'updateOne', {
      id,
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update category',
    };
  }
}

export async function patchCategory(
  id: string,
  data: Partial<ICategory>
): Promise<ActionResponse<ICategory>> {
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
          $lt: tomorrow,
        },
      });

      if (existingHistory) {
        // Update existing history entry for today
        await historyCollection.updateOne(
          { _id: existingHistory._id },
          {
            $set: {
              ...historyData,
              historyDate: new Date(),
            },
          }
        );
      } else {
        // Create new history entry
        await historyCollection.insertOne({
          categoryId: new ObjectId(id),
          ...historyData,
          historyDate: new Date(),
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('categories', 'updateOne', {
      id,
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error patching category:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to patch category',
    };
  }
}

interface CategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
  _id?: string;
}

export async function getCategoryHistory(
  categoryId: string
): Promise<ActionResponse<CategoryHistory[]>> {
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
    const history = rawHistory.map((entry) => ({
      _id: entry._id.toString(),
      categoryId: entry.categoryId.toString(),
      brandName: entry.brandName,
      series: entry.series,
      salesTax: entry.salesTax,
      historyDate: new Date(entry.historyDate),
      createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
    })) as CategoryHistory[];

    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching category history:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch category history',
    };
  }
}

export async function revertCategoryToHistory(
  categoryId: string,
  historyEntryId: string
): Promise<ActionResponse<ICategory>> {
  'use server';
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('categories');
    const historyCollection = db.collection('categoryHistory');

    console.log(
      'Reverting category:',
      categoryId,
      'to history entry:',
      historyEntryId
    );

    // Debug: Check what categories exist in the database
    const allCategories = await collection.find({}).toArray();
    console.log(
      'All categories in database:',
      allCategories.map((cat) => ({
        _id: cat._id.toString(),
        brandName: cat.brandName,
      }))
    );

    // First save current state to history before reverting
    const currentCategory = await collection.findOne({
      _id: new ObjectId(categoryId),
    });
    console.log('Found current category:', currentCategory ? 'Yes' : 'No');
    console.log('Looking for category ID:', categoryId);
    console.log('ObjectId created:', new ObjectId(categoryId).toString());

    if (currentCategory) {
      const { _id, ...historyData } = currentCategory;

      // Save current state as history entry
      await historyCollection.insertOne({
        categoryId: new ObjectId(categoryId),
        ...historyData,
        historyDate: new Date(),
      });
      console.log('Current state saved to history');
    } else {
      console.log('No current category found - this might be the issue');
    }

    // Get the actual historical data from the database
    const historicalEntry = await historyCollection.findOne({
      _id: new ObjectId(historyEntryId),
    });

    if (!historicalEntry) {
      throw new Error('Historical entry not found');
    }

    console.log('Found historical entry:', {
      brandName: historicalEntry.brandName,
      seriesCount: historicalEntry.series?.length || 0,
      salesTax: historicalEntry.salesTax,
    });

    // Check what's currently in the categories collection
    const existingCategory = await collection.findOne({
      _id: new ObjectId(categoryId),
    });
    console.log('Current category before revert:', {
      _id: existingCategory?._id,
      brandName: existingCategory?.brandName,
      seriesCount: existingCategory?.series?.length || 0,
      salesTax: existingCategory?.salesTax,
    });

    // Revert to the selected history entry using the original data
    const revertData = {
      brandName: historicalEntry.brandName,
      series: historicalEntry.series,
      salesTax: historicalEntry.salesTax,
      updatedAt: new Date(),
    };

    console.log('Reverting with data:', {
      brandName: revertData.brandName,
      seriesCount: revertData.series?.length || 0,
      salesTax: revertData.salesTax,
    });

    // Check if the category exists before trying to update
    let categoryExists = await collection.findOne({
      _id: new ObjectId(categoryId),
    });
    console.log(
      'Category exists before update:',
      categoryExists ? 'Yes' : 'No'
    );

    if (!categoryExists) {
      // Try to find by brand name as fallback
      console.log('Category not found by ID, trying to find by brand name...');
      const brandName = historicalEntry.brandName;
      categoryExists = await collection.findOne({ brandName: brandName });
      console.log('Found by brand name:', categoryExists ? 'Yes' : 'No');

      if (categoryExists) {
        console.log(
          'Using category found by brand name:',
          categoryExists._id.toString()
        );
        // Update the categoryId to the found category's ID
        categoryId = categoryExists._id.toString();
      } else {
        // If category doesn't exist, create it with the historical data
        console.log(
          'Category not found, creating new category with historical data...'
        );
        const newCategory = {
          brandName: historicalEntry.brandName,
          series: historicalEntry.series,
          salesTax: historicalEntry.salesTax,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertResult = await collection.insertOne(newCategory);
        console.log(
          'New category created:',
          insertResult.insertedId.toString()
        );
        categoryId = insertResult.insertedId.toString();
        categoryExists = { _id: insertResult.insertedId, ...newCategory };
      }
    }

    // Use direct MongoDB update instead of executeOperation
    console.log('Attempting updateOne...');
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(categoryId) },
      { $set: revertData }
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      // Try alternative update approach
      console.log('Direct update failed, trying alternative approach...');

      // Try using replaceOne instead
      console.log('Attempting replaceOne...');
      const replaceResult = await collection.replaceOne(
        { _id: new ObjectId(categoryId) },
        {
          _id: new ObjectId(categoryId),
          ...revertData,
          createdAt: existingCategory?.createdAt || new Date(),
        }
      );

      console.log('Replace result:', replaceResult);

      if (replaceResult.modifiedCount === 0) {
        // Try one more approach - delete and insert
        console.log(
          'Both update and replace failed, trying delete and insert...'
        );

        const deleteResult = await collection.deleteOne({
          _id: new ObjectId(categoryId),
        });
        console.log('Delete result:', deleteResult);

        const insertResult = await collection.insertOne({
          _id: new ObjectId(categoryId),
          ...revertData,
          createdAt: existingCategory?.createdAt || new Date(),
        });
        console.log('Insert result:', insertResult);

        if (!insertResult.insertedId) {
          throw new Error('Failed to update category - all methods failed');
        }
      }
    }

    // Get the updated category and verify the update
    const updatedCategory = await collection.findOne({
      _id: new ObjectId(categoryId),
    });

    console.log('Updated category after revert:', {
      _id: updatedCategory?._id,
      brandName: updatedCategory?.brandName,
      seriesCount: updatedCategory?.series?.length || 0,
      salesTax: updatedCategory?.salesTax,
    });

    // Verify the update was successful
    if (!updatedCategory) {
      throw new Error('Category not found after update');
    }

    if (updatedCategory.series?.length !== historicalEntry.series?.length) {
      console.warn('Series count mismatch after revert:', {
        expected: historicalEntry.series?.length,
        actual: updatedCategory.series?.length,
      });
    }

    return { success: true, data: updatedCategory as unknown as ICategory };
  } catch (error) {
    console.error('Error reverting category:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to revert category',
    };
  }
}

export async function appendSeriesToCategory(
  categoryId: string,
  newSeries: IBatterySeries[]
): Promise<ActionResponse<ICategory>> {
  'use server';
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('categories');
    const historyCollection = db.collection('categoryHistory');

    // First save current state to history
    const currentCategory = await collection.findOne({
      _id: new ObjectId(categoryId),
    });
    if (currentCategory) {
      const { _id, ...historyData } = currentCategory;

      // Save current state as history entry
      await historyCollection.insertOne({
        categoryId: new ObjectId(categoryId),
        ...historyData,
        historyDate: new Date(),
      });
    }

    // Get current series and append new ones
    const existingSeries = currentCategory?.series || [];
    const updatedSeries = [...existingSeries, ...newSeries];

    console.log('Appending series:', {
      existingCount: existingSeries.length,
      newCount: newSeries.length,
      totalCount: updatedSeries.length,
    });

    // Update category with appended series
    const result = await executeOperation('categories', 'updateOne', {
      id: categoryId,
      data: {
        series: updatedSeries,
        updatedAt: new Date(),
      },
    });

    return { success: true, data: result as ICategory };
  } catch (error) {
    console.error('Error appending series to category:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to append series to category',
    };
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResponse<void>> {
  'use server';
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('categories');
    const historyCollection = db.collection('categoryHistory');

    // First save current state to history before deletion
    const currentCategory = await collection.findOne({
      _id: new ObjectId(categoryId),
    });
    if (currentCategory) {
      const { _id, ...historyData } = currentCategory;

      // Save deletion to history
      await historyCollection.insertOne({
        categoryId: new ObjectId(categoryId),
        ...historyData,
        historyDate: new Date(),
        action: 'deleted',
      });
    }

    // Then delete the entire category document
    const result = await collection.deleteOne({
      _id: new ObjectId(categoryId),
    });

    if (result.deletedCount === 0) {
      throw new Error('Category not found or already deleted');
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
