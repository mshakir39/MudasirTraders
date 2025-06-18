'use server';
import { executeOperation } from '@/app/libs/executeOperation';

export async function GET() {
  try {
    const categories = await executeOperation('categories', 'find', {});
    return Response.json(categories);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: any, res: any) {
  const { series, brandName } = await req.json();
  try {
    // Only check if brand exists since we're sending all series at once
    const isBrandExists = await executeOperation('categories', 'isExist', {
      brandName: brandName,
    });

    if (isBrandExists) {
      return Response.json({ error: 'Brand already exists' });
    }

    // Insert new category with all series
    await executeOperation('categories', 'insertOne', {
      series: series,
      brandName: brandName,
    });

    return Response.json({
      success: true,
      message: `Brand ${brandName} with ${series.length} series added successfully`,
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    });
  }
}

export async function PATCH(req: any, res: any) {
  const { id, data } = await req.json();
  try {
    if (!id || !data) {
      return Response.json({ error: 'Missing id or data' }, { status: 400 });
    }
    await executeOperation('categories', 'updateOne', {
      id,
      data,
    });
    return Response.json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message });
  }
}
