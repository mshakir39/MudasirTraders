'use server';
import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const db = await connectToMongoDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const warrantyLookup = db.collection('warrantyLookup');

    // Search for warranty codes that start with the query (case-insensitive)
    const suggestions = await warrantyLookup
      .find({
        warrentyCode: { $regex: `^${query}`, $options: 'i' },
      })
      .limit(20)
      .project({ warrentyCode: 1, invoiceNo: 1, customerName: 1, _id: 0 })
      .toArray();

    // Extract unique warranty codes
    const uniqueCodes = Array.from(
      new Map(suggestions.map((s: any) => [s.warrentyCode, s])).values()
    );

    return NextResponse.json({
      suggestions: uniqueCodes.map((s: any) => ({
        code: s.warrentyCode,
        invoiceNo: s.invoiceNo,
        customerName: s.customerName,
      })),
    });
  } catch (error: any) {
    console.error('Error in warranty autocomplete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
