import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;

  const normalizedPathname = (pathname || '').toLowerCase();

  // Redirect old /signIn to new /signin
  if (pathname === '/signIn') {
    return NextResponse.redirect(new URL('/signin', url));
  }

  // Prevent redirect loops
  if (
    pathname === '/app/dashboard-password' &&
    request.headers.get('referer')?.includes('/app/dashboard-password')
  ) {
    return NextResponse.next();
  }

  const dashboardUnlocked = request.cookies.get('dashboard-unlocked');

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  const isAppRoute = normalizedPathname.startsWith('/app');
  const isDashboardPasswordPage = normalizedPathname === '/app/dashboard-password';
  const isSignInPage = normalizedPathname === '/signin';

  console.log('Middleware debug:', {
    pathname,
    normalizedPathname,
    isAuthenticated: !!token,
    dashboardUnlocked: dashboardUnlocked?.value,
    isAppRoute,
    isDashboardPasswordPage,
    isSignInPage
  });

  // /signIn should be accessible without authentication
  if (isSignInPage) {
    const response = NextResponse.next();
    response.cookies.delete('dashboard-unlocked');
    return response;
  }

  // /app/* requires NextAuth login first (use getToken to avoid stale-cookie issues)
  if (isAppRoute && !isAuthenticated && !isSignInPage) {
    const response = NextResponse.redirect(new URL('/signin', url));
    response.cookies.delete('dashboard-unlocked');
    return response;
  }

  if (isAuthenticated && isSignInPage) {
    return NextResponse.redirect(new URL('/app', url));
  }

  // Step 2: Handle Dashboard Access (but not for sign-in page or allowed routes)
  // Allow access to meetups even when dashboard is locked
  const allowedRoutes = ['/app/meetups', '/app/brands', '/app/category', '/app/customers', '/app/sales', '/app/stock', '/app/invoices', '/app/priceList', '/app/scrapStock', '/app/warranty-check'];
  const isAllowedRoute = allowedRoutes.includes(normalizedPathname);
  
  // Only redirect to password page if dashboard is locked and it's not an allowed route or the password page itself
  if (isAppRoute && !isDashboardPasswordPage && !dashboardUnlocked && !isSignInPage && !isAllowedRoute) {
    console.log('Redirecting to dashboard password - not unlocked');
    return NextResponse.redirect(new URL('/app/dashboard-password', url));
  }

  // Step 2.5: Check if coming back to dashboard from another page (auto-lock)
  if (pathname === '/app' && dashboardUnlocked) {
    const referer = request.headers.get('referer');

    // Check if coming from a non-dashboard page
    if (referer) {
      try {
        const refererPath = new URL(referer).pathname;
        const isRefererDashboardPage =
          refererPath === '/app' || refererPath === '/app/dashboard-password';

        console.log('Middleware auto-lock check:', {
          pathname,
          referer,
          refererPath,
          isRefererDashboardPage,
          dashboardUnlocked
        });

        if (!isRefererDashboardPage) {
          console.log('Auto-locking dashboard - coming from external page');
          const response = NextResponse.redirect(
            new URL('/app/dashboard-password', url)
          );
          response.cookies.delete('dashboard-unlocked');
          return response;
        }
      } catch (error) {
        console.log('Middleware: Error parsing referer:', error);
        // If URL parsing fails, continue with normal flow
      }
    } else {
      console.log('Middleware: No referer found, allowing access');
    }
  }

  // Step 3: Handle Auto-Locking on Navigation
  const response = NextResponse.next();
  const isDashboardRelatedPage =
    pathname.startsWith('/app');

  // Auto-lock: Delete the dashboard-unlocked cookie when navigating away from dashboard pages
  // This ensures the dashboard is locked when user returns to "/app"
  if (!isDashboardRelatedPage && dashboardUnlocked) {
    response.cookies.delete('dashboard-unlocked');
  }

  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/signIn',
  ],
};
