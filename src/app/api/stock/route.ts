'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';

export async function POST(req: any, res: any) {
  const { series, brandName, inStock, productCost } = await req.json();
  try {
    const seriesExists = await executeOperation(
      'stock',
      'isSeriesExistInStock',
      {
        field: 'series', // Note the field name is just 'series', not 'seriesStock.series'
        value: series,
      }
    );

    if (seriesExists) {
      return Response.json({ error: 'Series already Exist' });
    } else {
      await executeOperation('stock', 'insertStock', {
        seriesStock: [
          {
            series: series,
            productCost: productCost,
            inStock: inStock,
            createdDate: new Date(),
          },
        ],
        brandName: brandName,
      });
    }

    return Response.json({ message: 'Stock inserted successfully' });
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return Response.json({ error: err.message });
  }
}

export async function PUT(req: any, res: any) {
  const { id, data } = await req.json();
  try {
    const document = {
      _id: new ObjectId(id),
      seriesStock: data.seriesStock,
      brandName: data.brandName,
      updatedDate: new Date(),
    };

    await executeOperation('stock', 'updateSeriesStock', document);

    return Response.json({ message: 'Document updated successfully' });
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return Response.json({ error: err.message });
  }
}

export async function PATCH(req: any, res: any) {
  try {
    const { action } = await req.json();

    if (action === 'cleanupStockData') {
      console.log('🧹 Starting stock data cleanup...');

      const db = await connectToMongoDB();
      if (!db) {
        throw new Error('Failed to connect to database');
      }

      const stockCollection = db.collection('stock');
      const allStock = await stockCollection.find().toArray();

      let updatedCount = 0;

      for (const stockDoc of allStock) {
        if (stockDoc.seriesStock && Array.isArray(stockDoc.seriesStock)) {
          let needsUpdate = false;
          const updatedSeriesStock = stockDoc.seriesStock.map((series: any) => {
            const originalInStock = series.inStock;
            const originalSoldCount = series.soldCount;
            const originalProductCost = series.productCost;

            const newInStock = parseInt(series.inStock) || 0;
            const newSoldCount = parseInt(series.soldCount) || 0;
            const newProductCost = parseFloat(series.productCost) || 0;

            // Check if conversion changed the value
            if (
              originalInStock !== newInStock ||
              originalSoldCount !== newSoldCount ||
              originalProductCost !== newProductCost
            ) {
              needsUpdate = true;
              console.log(
                `🔄 Converting ${series.series}: inStock "${originalInStock}" → ${newInStock}, soldCount "${originalSoldCount}" → ${newSoldCount}, productCost "${originalProductCost}" → ${newProductCost}`
              );
            }

            return {
              ...series,
              inStock: newInStock,
              soldCount: newSoldCount,
              productCost: newProductCost,
            };
          });

          if (needsUpdate) {
            await stockCollection.updateOne(
              { _id: stockDoc._id },
              { $set: { seriesStock: updatedSeriesStock } }
            );
            updatedCount++;
          }
        }
      }

      console.log(
        `✅ Stock data cleanup completed. Updated ${updatedCount} documents.`
      );

      return Response.json({
        message: `Stock data cleanup completed. Updated ${updatedCount} documents.`,
        updatedCount,
      });
    }

    return Response.json({ error: 'Invalid action' });
  } catch (err: any) {
    console.error('❌ Error during stock cleanup:', err);
    return Response.json({ error: err.message });
  }
}
