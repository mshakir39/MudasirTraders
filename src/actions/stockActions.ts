'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

interface StockData {
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
  updatedDate?: Date;
}

interface SeriesStock {
  series: string;
  productCost: string;
  inStock: string;
  createdDate?: Date;
  updatedDate?: Date;
}

interface StockHistoryEntry {
  _id?: string;
  stockId?: string;
  brandName: string;
  series: string; // Individual series
  oldQuantity: number;
  newQuantity: number;
  quantityDifference: number;
  oldCost: number;
  newCost: number;
  costDifference: number;
  historyDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createStock(data: StockData) {
  try {
    const result = await executeOperation('stock', 'insertStock', {
      brandName: data.brandName,
      seriesStock: [
        {
          series: data.series,
          productCost: data.productCost,
          inStock: data.inStock,
          createdDate: new Date(),
        },
      ],
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStock(data: StockData) {
  try {
    const { ObjectId } = require('mongodb');

    // First save current state to history
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    // Find current stock for this brand
    const currentStock = await collection.findOne({
      brandName: data.brandName,
    });
    if (currentStock) {
      // Find the specific series being updated to capture changes
      const currentSeries = currentStock.seriesStock?.find(
        (s: SeriesStock) => s.series === data.series
      );

      if (currentSeries) {
        // Calculate changes
        const oldQuantity = currentSeries.inStock || 0;
        const newQuantity = parseInt(data.inStock) || 0;
        const oldCost = currentSeries.productCost || 0;
        const newCost = parseInt(data.productCost) || 0;

        // Save series-level history (every change, no daily grouping)
        await historyCollection.insertOne({
          brandName: data.brandName,
          series: data.series,
          oldQuantity: oldQuantity,
          newQuantity: newQuantity,
          quantityDifference: newQuantity - oldQuantity,
          oldCost: oldCost,
          newCost: newCost,
          costDifference: newCost - oldCost,
          historyDate: new Date(),
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('stock', 'updateSeriesStock', {
      brandName: data.brandName,
      seriesStock: [
        {
          series: data.series,
          productCost: data.productCost,
          inStock: data.inStock,
          updatedDate: new Date(),
        },
      ],
    });

    console.log('Update stock result:', result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Update stock error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateStockQuantity(
  brandName: string,
  series: string,
  quantity: number
) {
  try {
    const { ObjectId } = require('mongodb');

    // First save current state to history
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    // Find current stock for this brand
    const currentStock = await collection.findOne({ brandName });
    if (currentStock) {
      // Remove _id to avoid duplicate key error
      const { _id, ...historyData } = currentStock;

      // Check if a history entry already exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingHistory = await historyCollection.findOne({
        brandName,
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
          ...historyData,
          historyDate: new Date(),
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('stock', 'updateStockQuantity', {
      brandName,
      series,
      quantity,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStockAndSoldCount(
  brandName: string,
  series: string,
  quantity: number
) {
  try {
    const { ObjectId } = require('mongodb');

    // First save current state to history
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    // Find current stock for this brand
    const currentStock = await collection.findOne({ brandName });
    if (currentStock) {
      // Remove _id to avoid duplicate key error
      const { _id, ...historyData } = currentStock;

      // Check if a history entry already exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingHistory = await historyCollection.findOne({
        brandName,
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
          ...historyData,
          historyDate: new Date(),
        });
      }
    }

    // Then update with new data
    const result = await executeOperation('stock', 'updateStockAndSoldCount', {
      brandName,
      series,
      quantity,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStock() {
  try {
    const stock = await executeOperation('stock', 'findAll');
    return { success: true, data: stock };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStockHistory(brandName: string, series?: string) {
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const historyCollection = db.collection('stockHistory');

    // Build query based on parameters
    const query: any = { brandName };
    if (series) {
      query.series = series;
    }

    const rawHistory = await historyCollection
      .find(query)
      .sort({ historyDate: -1 })
      .toArray();

    // Transform the raw data into the expected format
    const history = rawHistory.map((entry) => ({
      _id: entry._id.toString(),
      brandName: entry.brandName,
      series: entry.series,
      oldQuantity: entry.oldQuantity,
      newQuantity: entry.newQuantity,
      quantityDifference: entry.quantityDifference,
      oldCost: entry.oldCost,
      newCost: entry.newCost,
      costDifference: entry.costDifference,
      historyDate: new Date(entry.historyDate),
      createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
    })) as StockHistoryEntry[];

    return { success: true, data: history };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkSeriesExistsInStock(field: string, value: string) {
  try {
    const result = await executeOperation('stock', 'isSeriesExistInStock', {
      field,
      value,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteStock(brandName: string, series: string) {
  try {
    const { ObjectId } = require('mongodb');

    // First save current state to history before deletion
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    // Find current stock for this brand and series
    const currentStock = await collection.findOne({ brandName });
    if (currentStock) {
      const currentSeries = currentStock.seriesStock?.find(
        (s: SeriesStock) => s.series === series
      );

      if (currentSeries) {
        // Save deletion to history
        await historyCollection.insertOne({
          brandName: brandName,
          series: series,
          oldQuantity: currentSeries.inStock || 0,
          newQuantity: 0,
          quantityDifference: -(currentSeries.inStock || 0),
          oldCost: currentSeries.productCost || 0,
          newCost: 0,
          costDifference: -(currentSeries.productCost || 0),
          historyDate: new Date(),
          action: 'deleted',
        });
      }
    }

    // Then delete the series from stock
    const result = await executeOperation('stock', 'deleteSeriesStock', {
      brandName,
      series,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAllBrandStock(brandName: string) {
  try {
    const { ObjectId } = require('mongodb');

    // First save current state to history before deletion
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const collection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    // Find current stock for this brand
    const currentStock = await collection.findOne({ brandName });
    if (currentStock && currentStock.seriesStock) {
      // Save all series deletions to history
      const historyPromises = currentStock.seriesStock.map(
        (seriesItem: SeriesStock) => {
          return historyCollection.insertOne({
            brandName: brandName,
            series: seriesItem.series,
            oldQuantity: seriesItem.inStock || 0,
            newQuantity: 0,
            quantityDifference: -(seriesItem.inStock || 0),
            oldCost: seriesItem.productCost || 0,
            newCost: 0,
            costDifference: -(seriesItem.productCost || 0),
            historyDate: new Date(),
            action: 'deleted_all',
          });
        }
      );

      await Promise.all(historyPromises);
    }

    // Then delete the entire brand stock document
    const result = await collection.deleteOne({ brandName });

    return {
      success: true,
      data: result,
      message: `Successfully deleted all stock items for ${brandName}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
