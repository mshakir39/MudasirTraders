import { NextRequest, NextResponse } from 'next/server';
import {
  createStock,
  updateStock,
  getStockHistory,
  deleteStock,
  deleteAllBrandStock,
} from '@/actions/stockActions';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'create':
        const result = await createStock(data);
        return NextResponse.json(result);

      case 'update':
        const updateResult = await updateStock(data);
        return NextResponse.json(updateResult);

      case 'delete':
        const deleteResult = await deleteStock(data.brandName, data.series);
        return NextResponse.json(deleteResult);

      case 'deleteAllBrand':
        const deleteAllResult = await deleteAllBrandStock(data.brandName);
        return NextResponse.json(deleteAllResult);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stock action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandName = searchParams.get('brandName');
    const series = searchParams.get('series');

    console.log('📊 Stock History Request:', { brandName, series });

    // Only fetch history if brandName is provided
    if (!brandName) {
      console.log('❌ No brandName provided');
      return NextResponse.json(
        {
          success: false,
          error: 'Brand name is required for stock history',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching history for:', brandName, series);
    const history = await getStockHistory(brandName, series || undefined);
    console.log(
      '📋 History result type:',
      typeof history,
      'length:',
      Array.isArray(history) ? history.length : 'N/A'
    );

    // Return the history data wrapped in success format
    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('❌ Stock history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
