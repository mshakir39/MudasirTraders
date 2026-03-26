'use server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export async function GET() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      return Response.json(
        { error: 'Failed to connect to database' },
        { status: 500 }
      );
    }

    // Check if stockHistory collection exists and has data
    const historyCollection = db.collection('stockHistory');
    const count = await historyCollection.countDocuments();
    const sample = await historyCollection.find().limit(5).toArray();

    // Also check stock collection
    const stockCollection = db.collection('stock');
    const stockCount = await stockCollection.countDocuments();
    const stockSample = await stockCollection.find().limit(3).toArray();

    return Response.json({
      stockHistory: {
        exists: true,
        count: count,
        sample: sample,
      },
      stock: {
        exists: true,
        count: stockCount,
        sample: stockSample,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
