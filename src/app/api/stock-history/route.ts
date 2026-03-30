import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export async function GET() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch stock history data
    const stockHistory = await db.collection('stockHistory')
      .find({})
      .sort({ historyDate: 1 })
      .limit(1000) // Limit to prevent large responses
      .toArray();

    return NextResponse.json({
      success: true,
      data: stockHistory,
      count: stockHistory.length
    });

  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
}
