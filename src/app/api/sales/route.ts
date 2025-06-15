import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const sales = await executeOperation('sales', 'find', {});
  return Response.json(sales);
}
