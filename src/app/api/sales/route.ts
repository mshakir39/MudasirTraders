import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const sales = await executeOperation('sales', 'find', {});
  return Response.json(sales);
}
