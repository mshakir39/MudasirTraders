import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;

  const authToken = request.cookies.get('next-auth.session-token');
  const dashboardUnlocked = request.cookies.get('dashboard-unlocked');

  // Step 1: Handle Authentication
  const isPublicPage =
    pathname === '/signIn' || pathname === '/dashboard-password';
  
  if (!authToken && !isPublicPage) {
    return NextResponse.redirect(new URL('/signIn', url));
  }
  
  if (authToken && pathname === '/signIn') {
    return NextResponse.redirect(new URL('/dashboard-password', url));
  }

  // Step 2: Handle Dashboard Access
  if (pathname === '/' && !dashboardUnlocked) {
    return NextResponse.redirect(new URL('/dashboard-password', url));
  }

  // Step 3: Handle Auto-Locking on Navigation
  const response = NextResponse.next();
  const isDashboardRelatedPage =
    pathname === '/' || pathname === '/dashboard-password';

  if (!isDashboardRelatedPage && dashboardUnlocked) {
    response.cookies.delete('dashboard-unlocked');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
