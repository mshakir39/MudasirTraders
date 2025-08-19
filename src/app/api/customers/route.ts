import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const customers = await executeOperation('customers', 'findAll');
    return Response.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customerName, phoneNumber, address, email } = await req.json();
    
    // Validate required fields
    if (!customerName || !phoneNumber) {
      return Response.json(
        { error: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    const customerData = {
      customerName,
      phoneNumber,
      address: address || '',
      email: email || '',
      createdAt: new Date(),
    };

    const result = await executeOperation('customers', 'insertOne', customerData);
    
    return Response.json({
      success: true,
      message: 'Customer added successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return Response.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
