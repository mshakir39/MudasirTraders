import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
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
      searchParams.get('start') || searchParams.get('salesTrendStart');
    const endParam =
      searchParams.get('end') || searchParams.get('salesTrendEnd');

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

    // Determine calendar start and end day keys in local timezone (Asia/Karachi)
    const startDayKey = start.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Karachi',
    });
    const endDayKey = end.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Karachi',
    });

    // Widen MongoDB query window by 36 hours on each side to ensure no time-zone boundary sales are cut off
    const queryStart = new Date(start.getTime() - 36 * 60 * 60 * 1000);
    const queryEnd = new Date(end.getTime() + 36 * 60 * 60 * 1000);
    const queryStartIso = queryStart.toISOString();
    const queryEndIso = queryEnd.toISOString();

    // Query sales bounded by date range with index and minimal projection.
    // Supports both BSON Date objects and ISO string formats in MongoDB.
    const salesDocs = await db
      .collection('sales')
      .find(
        {
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
        },
        {
          projection: {
            date: 1,
            createdDate: 1,
            saleDate: 1,
            createdAt: 1,
            totalAmount: 1,
            isChargingService: 1,
            isScrapBattery: 1,
          },
        }
      )
      .toArray();

    // Group sales by local calendar day (Asia/Karachi) in O(N) time
    const salesByDay = new Map<string, { count: number; revenue: number }>();

    salesDocs.forEach((sale: any) => {
      if (sale.isChargingService || sale.isScrapBattery) return;
      const saleDate = getSaleDate(sale);
      if (!saleDate) return;
      const dayKey = saleDate.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Karachi',
      });
      const existing = salesByDay.get(dayKey) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += toNumber(sale.totalAmount);
      salesByDay.set(dayKey, existing);
    });

    // Generate chronological daily buckets from startDayKey to endDayKey in O(D) time.
    // Using UTC noon ensures safe iteration regardless of the server's local timezone.
    const salesTrend = [];
    const iterDate = new Date(`${startDayKey}T12:00:00Z`);
    const stopDate = new Date(`${endDayKey}T12:00:00Z`);

    while (iterDate <= stopDate) {
      const dayKey = iterDate.toISOString().split('T')[0];
      const label = iterDate.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
      });
      const entry = salesByDay.get(dayKey) || { count: 0, revenue: 0 };

      salesTrend.push({
        date: label,
        fullDate: dayKey,
        sales: entry.count,
        revenue: entry.revenue,
      });

      iterDate.setUTCDate(iterDate.getUTCDate() + 1);
    }

    return NextResponse.json({
      success: true,
      salesTrend,
    });
  } catch (error: any) {
    console.error('Error fetching sales trend:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
