import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { normalizeSeriesForMatching } from '@/utils/seriesNormalization';

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Enhanced normalization for sales data (handles brand prefix)
const normalizeSalesSeries = (brandName: string, series: string): string => {
  let cleanSeries = series;
  if (
    brandName &&
    cleanSeries.toLowerCase().startsWith(brandName.toLowerCase())
  ) {
    cleanSeries = cleanSeries.substring(brandName.length).trim();
  }
  return normalizeSeriesForMatching(cleanSeries);
};

// Helper function to safely extract sale date
const getSaleDate = (sale: any): Date | null => {
  const raw =
    sale?.date || sale?.createdDate || sale?.saleDate || sale?.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam =
      searchParams.get('start') || searchParams.get('topProductsStart');
    const endParam =
      searchParams.get('end') || searchParams.get('topProductsEnd');

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const start = new Date(startParam);
    const end = new Date(endParam);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start or end date' },
        { status: 400 }
      );
    }

    const db = await connectToMongoDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 500 }
      );
    }

    const isAllTime =
      searchParams.get('allTime') === 'true' ||
      searchParams.get('topProductsAllTime') === 'true' ||
      start.getFullYear() <= 1970;

    // Widen MongoDB query window by 36 hours on each side to ensure no time-zone boundary sales are cut off
    const queryStart = new Date(start.getTime() - 36 * 60 * 60 * 1000);
    const queryEnd = new Date(end.getTime() + 36 * 60 * 60 * 1000);
    const queryStartIso = queryStart.toISOString();
    const queryEndIso = queryEnd.toISOString();

    const salesFilter = isAllTime
      ? {
          isChargingService: { $ne: true },
          isScrapBattery: { $ne: true },
        }
      : {
          $or: [
            { date: { $gte: queryStart, $lte: queryEnd } },
            { createdDate: { $gte: queryStart, $lte: queryEnd } },
            { saleDate: { $gte: queryStart, $lte: queryEnd } },
            { createdAt: { $gte: queryStart, $lte: queryEnd } },
            { date: { $gte: queryStartIso, $lte: queryEndIso } },
            { createdDate: { $gte: queryStartIso, $lte: queryEndIso } },
            { saleDate: { $gte: queryStartIso, $lte: queryEndIso } },
            { createdAt: { $gte: queryStartIso, $lte: queryEndIso } },
          ],
          isChargingService: { $ne: true },
          isScrapBattery: { $ne: true },
        };

    // Query sales matching the date range directly using index, fetching only necessary fields
    const [salesDocs, stockDocs] = await Promise.all([
      db
        .collection('sales')
        .find(salesFilter, {
            projection: {
              date: 1,
              createdDate: 1,
              saleDate: 1,
              createdAt: 1,
              products: 1,
              brandName: 1,
              series: 1,
              quantity: 1,
              isChargingService: 1,
              isScrapBattery: 1,
            },
          }
        )
        .toArray(),
      db
        .collection('stock')
        .find(
          {},
          {
            projection: {
              brandName: 1,
              'seriesStock.series': 1,
              'seriesStock.inStock': 1,
            },
          }
        )
        .toArray(),
    ]);

    // Build fast lookup map from current stock: "normalizedBrand:::normalizedSeries" -> stock info
    const stockLookup = new Map<
      string,
      { inStock: number; brandName: string; series: string }
    >();

    stockDocs.forEach((document: any) => {
      const documentBrandName = (document.brandName || '').trim();
      const normalizedBrand = documentBrandName.toLowerCase();

      if (Array.isArray(document.seriesStock)) {
        document.seriesStock.forEach((seriesItem: any) => {
          const seriesName = (seriesItem.series || '').trim();
          const normalizedSeries = normalizeSalesSeries(
            documentBrandName,
            seriesName
          );
          const key = `${normalizedBrand}:::${normalizedSeries}`;
          const inStock = toNumber(seriesItem.inStock);

          stockLookup.set(key, {
            inStock,
            brandName: documentBrandName,
            series: seriesName,
          });
        });
      }
    });

    // Aggregate sales strictly from the date range
    const salesAggMap = new Map<
      string,
      { brandName: string; series: string; soldCount: number }
    >();

    salesDocs.forEach((sale: any) => {
      if (sale.isChargingService || sale.isScrapBattery) return;
      const saleDate = getSaleDate(sale);
      if (!saleDate) return;
      if (!isAllTime && (saleDate < start || saleDate > end)) return;

      const products =
        Array.isArray(sale.products) && sale.products.length > 0
          ? sale.products
          : sale.brandName && sale.series
            ? [sale]
            : [];

      products.forEach((product: any) => {
        if (product.isChargingService || product.isScrapBattery) return;

        const rawBrand = (
          product.brandName ||
          product.batteryDetails?.brandName ||
          ''
        ).trim();
        const rawSeries = (
          product.series ||
          product.batteryDetails?.name ||
          ''
        ).trim();

        if (!rawBrand || !rawSeries || rawSeries.toLowerCase() === 'unknown') {
          return;
        }

        const normalizedBrand = rawBrand.toLowerCase();
        const normalizedSeries = normalizeSalesSeries(rawBrand, rawSeries);
        const key = `${normalizedBrand}:::${normalizedSeries}`;
        const quantity = toNumber(product.quantity) || 1;

        const existing = salesAggMap.get(key);
        if (existing) {
          existing.soldCount += quantity;
        } else {
          const stockMatch = stockLookup.get(key);
          salesAggMap.set(key, {
            brandName: stockMatch?.brandName || rawBrand,
            series: stockMatch?.series || rawSeries,
            soldCount: quantity,
          });
        }
      });
    });

    // Map to top selling products array
    const topSellingProducts = Array.from(salesAggMap.entries())
      .map(([key, item]) => {
        const stockInfo = stockLookup.get(key);
        return {
          brandName: item.brandName,
          series: item.series,
          soldCount: item.soldCount,
          inStock: stockInfo ? stockInfo.inStock : 0,
        };
      })
      .filter((p) => p.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      topSellingProducts,
    });
  } catch (error: any) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
