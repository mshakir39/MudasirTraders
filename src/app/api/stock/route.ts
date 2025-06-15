'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export async function POST(req: any, res: any) {
  const { series, brandName, inStock, productCost } = await req.json();
  try {
    const seriesExists = await executeOperation(
      'stock',
      'isSeriesExistInStock',
      {
        field: 'series', // Note the field name is just 'series', not 'seriesStock.series'
        value: series,
      }
    );

    if (seriesExists) {
      return Response.json({ error: 'Series already Exist' });
    } else {
      await executeOperation('stock', 'insertStock', {
        seriesStock: [
          {
            series: series,
            productCost: productCost,
            inStock: inStock,
            createdDate: new Date(),
          },
        ],
        brandName: brandName,
      });
    }

    return Response.json({ message: 'Stock inserted successfully' });
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return Response.json({ error: err.message });
  }
}

export async function PUT(req: any, res: any) {
  const { id, data } = await req.json();
  try {
    const document = {
      _id: new ObjectId(id),
      seriesStock: data.seriesStock,
      brandName: data.brandName,
      updatedDate: new Date(),
    };

    await executeOperation('stock', 'updateSeriesStock', document);

    return Response.json({ message: 'Document updated successfully' });
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return Response.json({ error: err.message });
  }
}
