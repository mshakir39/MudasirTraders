import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const customers = await executeOperation('customers', 'findAll');
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
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
      return NextResponse.json(
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

    const result = await executeOperation(
      'customers',
      'insertOne',
      customerData
    );

    return NextResponse.json({
      success: true,
      message: 'Customer added successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
