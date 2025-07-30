import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const sales = await executeOperation('sales', 'find', {});
  
  // Sort sales by date (newest first)
  if (Array.isArray(sales)) {
    sales.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }
  
  return Response.json(sales);
}
