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
    const { action, dryRun = false, includeScrap = false } = await req.json();

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

    if (action === 'syncSoldCountFromSales') {
      console.log('🔄 Starting soldCount sync from sales...', {
        dryRun,
        includeScrap,
      });

      const db = await connectToMongoDB();
      if (!db) {
        throw new Error('Failed to connect to database');
      }

      const stockCollection = db.collection('stock');
      const salesCollection = db.collection('sales');

      const [allStock, allSales] = await Promise.all([
        stockCollection.find().toArray(),
        salesCollection.find().toArray(),
      ]);

      const salesCountMap = new Map<string, number>();
      for (const sale of allSales) {
        if (!includeScrap && sale?.isScrapBattery) continue;
        if (sale?.isChargingService) continue;

        const products = Array.isArray(sale?.products) ? sale.products : [];
        for (const product of products) {
          const brandName = String(
            product?.brandName || product?.batteryDetails?.brandName || ''
          ).trim();
          const series = String(
            product?.series || product?.batteryDetails?.name || ''
          ).trim();
          if (!brandName || !series) continue;

          const qty = parseInt(String(product?.quantity ?? 0)) || 0;
          if (qty <= 0) continue;

          const key = `${brandName}|||${series}`;
          salesCountMap.set(key, (salesCountMap.get(key) || 0) + qty);
        }
      }

      const stockKeySet = new Set<string>();
      const changes: Array<{
        brandName: string;
        series: string;
        before: number;
        after: number;
      }> = [];

      let documentsUpdated = 0;

      for (const stockDoc of allStock) {
        const brandName = String(stockDoc?.brandName || '').trim();
        if (!Array.isArray(stockDoc?.seriesStock) || !brandName) continue;

        let needsUpdate = false;
        const updatedSeriesStock = stockDoc.seriesStock.map(
          (seriesItem: any) => {
            const seriesName = String(seriesItem?.series || '').trim();
            const key = `${brandName}|||${seriesName}`;
            stockKeySet.add(key);

            const before = parseInt(String(seriesItem?.soldCount ?? 0)) || 0;
            const after = salesCountMap.get(key) || 0;

            if (before !== after) {
              needsUpdate = true;
              changes.push({
                brandName,
                series: seriesName,
                before,
                after,
              });
            }

            return {
              ...seriesItem,
              soldCount: after,
            };
          }
        );

        if (needsUpdate && !dryRun) {
          await stockCollection.updateOne(
            { _id: stockDoc._id },
            { $set: { seriesStock: updatedSeriesStock } }
          );
          documentsUpdated++;
        }
      }

      const missingInStock: Array<{ key: string; sold: number }> = [];
      salesCountMap.forEach((sold, key) => {
        if (!stockKeySet.has(key)) {
          missingInStock.push({ key, sold });
        }
      });

      const responseSummary = {
        dryRun,
        includeScrap,
        totalSalesKeys: salesCountMap.size,
        totalStockKeys: stockKeySet.size,
        totalChangedSeries: changes.length,
        documentsUpdated,
        missingInStockCount: missingInStock.length,
      };

      console.log('✅ soldCount sync completed:', responseSummary);

      return Response.json({
        message: dryRun
          ? 'soldCount sync dry-run completed (no changes written)'
          : 'soldCount sync completed (changes written)',
        summary: responseSummary,
        changes: changes.slice(0, 200),
        missingInStock: missingInStock.slice(0, 200),
      });
    }

    return Response.json({ error: 'Invalid action' });
  } catch (err: any) {
    console.error('❌ Error during stock cleanup:', err);
    return Response.json({ error: err.message });
  }
}
