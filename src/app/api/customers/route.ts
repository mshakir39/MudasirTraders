import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const customers = await executeOperation('customers', 'findAll');
  return Response.json(customers);
}

export async function POST(req: NextRequest) {
  const { name, contactInfo, address } = await req.json();
  await executeOperation('customers', 'insertOne', {
    name,
    contactInfo,
    address,
    createdDate: new Date(),
  });
  return Response.json({
    success: true,
    message: 'Customer added successfully',
  });
}
