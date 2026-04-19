'use server';
import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export async function POST(request: NextRequest) {
  try {
    const { invoiceNo } = await request.json();

    if (!invoiceNo) {
      return NextResponse.json(
        { error: 'Invoice number is required' },
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

    const warrantyHistory = db.collection('warrantyHistory');
    const warrantyLookup = db.collection('warrantyLookup');

    // Remove from both collections
    const historyResult = await warrantyHistory.deleteMany({
      originalInvoiceNo: invoiceNo,
    });

    const lookupResult = await warrantyLookup.deleteMany({
      invoiceNo: invoiceNo,
    });

    return NextResponse.json({
      success: true,
      message: `Removed warranty codes for invoice ${invoiceNo}`,
      historyDeleted: historyResult.deletedCount,
      lookupDeleted: lookupResult.deletedCount,
    });
  } catch (error: any) {
    console.error('Error cleaning up warranty:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clean up warranty' },
      { status: 500 }
    );
  }
}
