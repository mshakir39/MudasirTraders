import { NextRequest, NextResponse } from 'next/server';
import {
  createDealerBill,
  getDealerBills,
  addPaymentToBill,
  deleteDealerBill,
  getDealerBillById,
} from '@/actions/dealerBillActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received dealer-bills POST request:', body);
    const { action, ...data } = body;
    console.log('Action:', action, 'Data:', data);

    switch (action) {
      case 'create':
        console.log('Creating dealer bill with data:', data);
        const createResult = await createDealerBill(data);
        console.log('Create result:', createResult);
        if (createResult.success) {
          return NextResponse.json({
            message: 'Dealer bill created successfully',
            bill: createResult.data,
          });
        } else {
          console.error('Create bill error:', createResult.error);
          return NextResponse.json(
            { error: createResult.error },
            { status: 400 }
          );
        }

      case 'addPayment':
        const paymentResult = await addPaymentToBill(data);
        if (paymentResult.success) {
          return NextResponse.json({
            message: 'Payment added successfully',
            bill: paymentResult.data,
          });
        } else {
          return NextResponse.json(
            { error: paymentResult.error },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Dealer bill API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const result = await getDealerBillById(id);
      if (result.success) {
        return NextResponse.json({ bill: result.data });
      } else {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
    } else {
      const result = await getDealerBills();
      if (result.success) {
        return NextResponse.json({ bills: result.data });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Dealer bill GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteDealerBill(id);
    if (result.success) {
      return NextResponse.json({
        message: 'Dealer bill deleted successfully',
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Dealer bill DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
