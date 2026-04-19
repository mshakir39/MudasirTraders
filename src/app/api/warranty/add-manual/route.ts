'use server';
import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export async function POST(request: NextRequest) {
  try {
    const { invoiceNo, warrantyCode, customerName, customerContactNumber, brandName, series, warrentyStartDate, warrentyDuration } = await request.json();

    if (!invoiceNo || !warrantyCode) {
      return NextResponse.json(
        { error: 'Invoice number and warranty code are required' },
        { status: 400 }
      );
    }

    const db = await connectToMongoDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const warrantyLookup = db.collection('warrantyLookup');

    // Split warranty codes if multiple
    const codes = warrantyCode
      .split(/[\s,]+/)
      .filter((code: string) => code.length > 0);

    let insertedCount = 0;
    for (const code of codes) {
      await warrantyLookup.insertOne({
        warrentyCode: code.toUpperCase(),
        invoiceNo,
        customerName: customerName || '',
        customerContactNumber: customerContactNumber || '',
        brandName: brandName || '',
        series: series || '',
        warrentyStartDate: warrentyStartDate || '',
        warrentyDuration: warrentyDuration || '',
        createdAt: new Date().toISOString(),
        source: 'invoice',
      });
      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Added ${insertedCount} warranty code(s) for invoice ${invoiceNo}`,
      insertedCount,
    });
  } catch (error: any) {
    console.error('Error adding warranty code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add warranty code' },
      { status: 500 }
    );
  }
}
