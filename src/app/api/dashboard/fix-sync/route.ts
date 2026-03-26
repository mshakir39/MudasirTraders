import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';
import logger from '@/utils/logger';

interface StockSeriesRecord {
  docId: ObjectId;
  brandName: string;
  series: string;
  seriesIndex: number;
  stockSoldCount: number;
  inStock: number;
}

interface SyncDiscrepancy extends StockSeriesRecord {
  normalizedKey: string;
  actualSales: number;
  difference: number;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const validateSoldCount = (soldCount: unknown): number => {
  const num = toNumber(soldCount);
  return num < 0 ? 0 : num;
};

const normalizeSeriesForMatching = (series: string): string => {
  return String(series || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/thin\/thick/g, 'thinthick')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeSalesSeries = (brandName: string, series: string): string => {
  let cleanSeries = series;

  if (
    brandName &&
    cleanSeries &&
    cleanSeries.toLowerCase().startsWith(brandName.toLowerCase())
  ) {
    cleanSeries = cleanSeries.substring(brandName.length).trim();
  }

  return String(cleanSeries || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/thin\/thick/g, 'thinthick')
    .replace(/\s+/g, ' ')
    .trim();
};

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const db = await connectToMongoDB();

    if (!db) {
      logger.error('❌ Dashboard fix-sync: Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const stockCollection = db.collection('stock');
    const salesCollection = db.collection('sales');

    const [stockDocs, salesDocs] = await Promise.all([
      stockCollection.find().toArray(),
      salesCollection.find().toArray(),
    ]);

    const stockMap = new Map<string, StockSeriesRecord>();

    stockDocs.forEach((stockDoc: any) => {
      const brandName = stockDoc?.brandName;

      if (!brandName || !Array.isArray(stockDoc?.seriesStock)) {
        return;
      }

      stockDoc.seriesStock.forEach((series: any, index: number) => {
        if (!series || !series.series) {
          return;
        }

        const normalizedSeries = normalizeSeriesForMatching(series.series);
        const normalizedKey = `${brandName}-${normalizedSeries}`;

        if (!stockMap.has(normalizedKey)) {
          stockMap.set(normalizedKey, {
            docId: stockDoc._id as ObjectId,
            brandName,
            series: series.series,
            seriesIndex: index,
            stockSoldCount: validateSoldCount(series.soldCount),
            inStock: toNumber(series.inStock),
          });
        }
      });
    });

    const salesMap = new Map<string, number>();

    salesDocs.forEach((sale: any) => {
      if (!Array.isArray(sale?.products)) {
        return;
      }

      sale.products.forEach((product: any) => {
        const brandName =
          product?.brandName || product?.batteryDetails?.brandName || '';
        const series =
          product?.series || product?.batteryDetails?.name || '';

        if (!brandName || !series) {
          return;
        }

        const normalizedSeries = normalizeSalesSeries(brandName, series);
        const normalizedKey = `${brandName}-${normalizedSeries}`;
        const quantity = toNumber(product?.quantity);

        salesMap.set(
          normalizedKey,
          (salesMap.get(normalizedKey) || 0) + quantity
        );
      });
    });

    const discrepancies: SyncDiscrepancy[] = [];

    stockMap.forEach((stockItem, normalizedKey) => {
      const actualSales = salesMap.get(normalizedKey) || 0;

      if (actualSales !== stockItem.stockSoldCount) {
        discrepancies.push({
          ...stockItem,
          normalizedKey,
          actualSales,
          difference: actualSales - stockItem.stockSoldCount,
        });
      }
    });

    let updated = 0;
    const failures: Array<{ normalizedKey: string; error: string }> = [];
    const updateDetails: Array<{
      normalizedKey: string;
      brandName: string;
      series: string;
      from: number;
      to: number;
      difference: number;
      updated: boolean;
    }> = [];

    for (const issue of discrepancies) {
      const updateFields: Record<string, unknown> = {};
      updateFields[`seriesStock.${issue.seriesIndex}.soldCount`] =
        issue.actualSales;
      updateFields[`seriesStock.${issue.seriesIndex}.updatedDate`] = new Date();

      try {
        const result = await stockCollection.updateOne(
          { _id: issue.docId },
          { $set: updateFields }
        );

        const wasUpdated = result.modifiedCount > 0;

        if (wasUpdated) {
          updated += 1;
          logger.success(
            `🔧 Dashboard fix-sync updated soldCount for ${issue.normalizedKey}: ${issue.stockSoldCount} → ${issue.actualSales}`
          );
        } else {
          failures.push({
            normalizedKey: issue.normalizedKey,
            error: 'No document updated',
          });
          logger.warning(
            `⚠️ Dashboard fix-sync found discrepancy but no document updated for ${issue.normalizedKey}`
          );
        }

        updateDetails.push({
          normalizedKey: issue.normalizedKey,
          brandName: issue.brandName,
          series: issue.series,
          from: issue.stockSoldCount,
          to: issue.actualSales,
          difference: issue.difference,
          updated: wasUpdated,
        });
      } catch (error) {
        failures.push({
          normalizedKey: issue.normalizedKey,
          error: (error as Error).message,
        });

        logger.error(
          `❌ Dashboard fix-sync failed updating ${issue.normalizedKey}: ${(error as Error).message}`
        );

        updateDetails.push({
          normalizedKey: issue.normalizedKey,
          brandName: issue.brandName,
          series: issue.series,
          from: issue.stockSoldCount,
          to: issue.actualSales,
          difference: issue.difference,
          updated: false,
        });
      }
    }

    const missingInStock: Array<{ normalizedKey: string; actualSales: number }> = [];

    salesMap.forEach((salesCount, key) => {
      if (!stockMap.has(key)) {
        missingInStock.push({ normalizedKey: key, actualSales: salesCount });
        logger.warning(`⚠️ Dashboard fix-sync: ${key} has sales ${salesCount} but no stock record`);
      }
    });

    logger.info(
      `🔄 Dashboard fix-sync summary: discrepancies=${discrepancies.length}, updated=${updated}, failures=${failures.length}, missingInStock=${missingInStock.length}`
    );

    return NextResponse.json({
      totalSeries: stockMap.size,
      discrepancies: discrepancies.length,
      updated,
      failed: failures.length,
      missingInStockCount: missingInStock.length,
      missingInStock,
      details: updateDetails,
    });
  } catch (error) {
    logger.error('❌ Error reconciling dashboard stock sync:', error);

    return NextResponse.json(
      { error: 'Failed to reconcile stock sync' },
      { status: 500 }
    );
  }
}
