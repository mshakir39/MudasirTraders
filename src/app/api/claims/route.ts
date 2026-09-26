import { NextRequest, NextResponse } from 'next/server';
import {
  createBatteryClaim,
  getBatteryClaims,
  updateClaimStatus,
  deleteBatteryClaim,
} from '@/actions/claimActions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getBatteryClaims({ status, search });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/claims:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createBatteryClaim(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/claims:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, status, notes } = body;

    if (!claimId || !status) {
      return NextResponse.json(
        { success: false, error: 'claimId and status are required' },
        { status: 400 }
      );
    }

    const result = await updateClaimStatus(claimId, status, notes);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PUT /api/claims:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let claimId = searchParams.get('claimId') || searchParams.get('id');
    let restoreStock = searchParams.get('restoreStock') !== 'false';

    // Also check body if available
    try {
      const body = await request.json();
      if (body?.claimId) claimId = body.claimId;
      if (body?.id) claimId = body.id;
      if (body?.restoreStock !== undefined) restoreStock = Boolean(body.restoreStock);
    } catch {
      // Body may be empty if passing params via URL
    }

    if (!claimId) {
      return NextResponse.json(
        { success: false, error: 'claimId is required' },
        { status: 400 }
      );
    }

    const result = await deleteBatteryClaim(claimId, restoreStock);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/claims:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

