'use server';
import {
  getStock,
  createStock,
  updateStock,
  deleteStock,
  deleteAllBrandStock,
  getStockHistory,
} from '@/actions/stockActions';

// GET method to fetch all stock or stock history
export async function GET(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const brandName = searchParams.get('brandName');
    const series = searchParams.get('series');
    const history = searchParams.get('history');

    if (history === 'true') {
      // Get stock history
      const result = await getStockHistory(
        brandName || '',
        series || undefined
      );
      return Response.json(result);
    } else {
      // Get all stock
      const result = await getStock();
      return Response.json(result);
    }
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: any, res: any) {
  try {
    const body = await req.json();
    const result = await createStock(body);
    return Response.json(result);
  } catch (error: any) {
    console.error('Error creating stock:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: any, res: any) {
  try {
    const body = await req.json();
    const result = await updateStock(body);
    return Response.json(result);
  } catch (error: any) {
    console.error('Error updating stock:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: any, res: any) {
  try {
    const { brandName, series } = await req.json();

    if (brandName && series) {
      // Delete specific stock item
      const result = await deleteStock(brandName, series);
      return Response.json(result);
    } else if (brandName) {
      // Delete all stock for a brand
      const result = await deleteAllBrandStock(brandName);
      return Response.json(result);
    } else {
      return Response.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting stock:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
