import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Hardcoded password for dashboard access
    const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password === DASHBOARD_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: 'Dashboard access granted'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Dashboard auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
