'use server';
import { NextRequest, NextResponse } from 'next/server';
import { searchWarranty } from '@/actions/warrantyActions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warrantyCode = searchParams.get('warrantyCode');

    if (!warrantyCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warranty code is required',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Warranty search request:', warrantyCode);
    const result = await searchWarranty(warrantyCode);
    console.log('📋 Warranty search result:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Warranty search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search warranty',
      },
      { status: 500 }
    );
  }
}
