import { NextResponse } from 'next/server';
import { getChargingStats, getChargingTrend } from '@/actions/dashboardActions';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate') as string)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') as string)
      : undefined;

    // Get charging statistics
    const chargingStatsResult = await getChargingStats(startDate, endDate);
    if (!chargingStatsResult.success) {
      return NextResponse.json(
        { error: chargingStatsResult.error },
        { status: 500 }
      );
    }

    // Get charging trend (default to last 30 days if no dates provided)
    const trendStart =
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendEnd = endDate || new Date();
    const chargingTrendResult = await getChargingTrend(trendStart, trendEnd);
    if (!chargingTrendResult.success) {
      return NextResponse.json(
        { error: chargingTrendResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: chargingStatsResult.data,
        trend: chargingTrendResult.data,
        dateRange: {
          start: trendStart,
          end: trendEnd,
        },
      },
    });
  } catch (error: any) {
    console.error('Charging stats API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
