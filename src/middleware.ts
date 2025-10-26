import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;

  // Prevent redirect loops
  if (
    pathname === '/dashboard-password' &&
    request.headers.get('referer')?.includes('/dashboard-password')
  ) {
    return NextResponse.next();
  }

  const authToken =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');
  const dashboardUnlocked = request.cookies.get('dashboard-unlocked');

  // Step 1: Handle Authentication
  const isPublicPage =
    pathname === '/signIn' || pathname === '/dashboard-password';

  if (!authToken && !isPublicPage) {
    return NextResponse.redirect(new URL('/signIn', url));
  }

  if (authToken && pathname === '/signIn') {
    return NextResponse.redirect(new URL('/category', url));
  }

  // Step 2: Handle Dashboard Access
  if (pathname === '/' && !dashboardUnlocked) {
    return NextResponse.redirect(new URL('/dashboard-password', url));
  }

  // Step 2.5: Check if coming back to dashboard from another page (auto-lock)
  if (pathname === '/' && dashboardUnlocked) {
    const referer = request.headers.get('referer');

    // Check if coming from a non-dashboard page
    if (referer) {
      try {
        const refererPath = new URL(referer).pathname;
        const isRefererDashboardPage =
          refererPath === '/' || refererPath === '/dashboard-password';

        if (!isRefererDashboardPage) {
          const response = NextResponse.redirect(
            new URL('/dashboard-password', url)
          );
          response.cookies.delete('dashboard-unlocked');
          return response;
        }
      } catch (error) {
        // If URL parsing fails, continue with normal flow
      }
    }
  }

  // Step 3: Handle Auto-Locking on Navigation
  const response = NextResponse.next();
  const isDashboardRelatedPage =
    pathname === '/' || pathname === '/dashboard-password';

  // Auto-lock: Delete the dashboard-unlocked cookie when navigating away from dashboard pages
  // This ensures the dashboard is locked when user returns to "/"
  if (!isDashboardRelatedPage && dashboardUnlocked) {
    response.cookies.delete('dashboard-unlocked');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
