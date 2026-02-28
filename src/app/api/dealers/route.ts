import { NextRequest, NextResponse } from 'next/server';
import {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer,
  toggleDealerStatus,
} from '@/actions/dealerActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        const createResult = await createDealer(data);
        if (createResult.success) {
          return NextResponse.json({
            message: 'Dealer created successfully',
            dealer: createResult.data,
          });
        } else {
          return NextResponse.json(
            { error: createResult.error },
            { status: 400 }
          );
        }

      case 'update':
        const { id, ...updateData } = data;
        if (!id) {
          return NextResponse.json(
            { error: 'Dealer ID is required for update' },
            { status: 400 }
          );
        }
        const updateResult = await updateDealer(id, updateData);
        if (updateResult.success) {
          return NextResponse.json({
            message: 'Dealer updated successfully',
            dealer: updateResult.data,
          });
        } else {
          return NextResponse.json(
            { error: updateResult.error },
            { status: 400 }
          );
        }

      case 'toggleStatus':
        const { dealerId, isActive } = data;
        if (!dealerId) {
          return NextResponse.json(
            { error: 'Dealer ID is required' },
            { status: 400 }
          );
        }
        const toggleResult = await toggleDealerStatus(dealerId, isActive);
        if (toggleResult.success) {
          return NextResponse.json({
            message: `Dealer ${isActive ? 'activated' : 'deactivated'} successfully`,
          });
        } else {
          return NextResponse.json(
            { error: toggleResult.error },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Dealer API error:', error);
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
      const result = await getDealerById(id);
      if (result.success) {
        return NextResponse.json({ dealer: result.data });
      } else {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
    } else {
      const result = await getDealers();
      if (result.success) {
        return NextResponse.json({ dealers: result.data });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Dealer GET API error:', error);
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
        { error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteDealer(id);
    if (result.success) {
      return NextResponse.json({
        message: 'Dealer deleted successfully',
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Dealer DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
