import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/actions/customerActions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerType = searchParams.get('customerType') || undefined;
    const result = await getCustomers(customerType);
    return NextResponse.json(result);
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
    };

    const result = await createCustomer(customerData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const result = await updateCustomer(id, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteCustomer(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
