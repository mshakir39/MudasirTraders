import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  ROUTES,
  ROUTE_GROUPS,
  isDashboardRoute,
  isSignInRoute,
  isDashboardPasswordRoute,
  isAllowedWhenLocked,
} from '@/constants/routes';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;

  // Clean up only actual duplicate /dashboard segments (like /dashboard/dashboard/brands)
  // But don't touch /dashboard/dashboard-password as it's a valid route
  const cleanPathname = pathname.replace(
    /\/dashboard\/dashboard\//g,
    '/dashboard/'
  );
  if (cleanPathname !== pathname) {
    return NextResponse.redirect(new URL(cleanPathname, url));
  }

  const normalizedPathname = (pathname || '').toLowerCase();

  // Get authentication status
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;

  // If user is trying to access /dashboard but not authenticated, redirect to signin
  if (isDashboardRoute(normalizedPathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL(ROUTES.SIGNIN, url));
  }

  // Removed old /app route handling as we've removed the /app directory
  // All routes are now under /dashboard

  const dashboardUnlocked = request.cookies.get('dashboard-unlocked');

  const isAppRoute = isDashboardRoute(normalizedPathname);
  const isDashboardPasswordPage = isDashboardPasswordRoute(normalizedPathname);
  const isSignInPage = isSignInRoute(normalizedPathname);

  // Removed redirect from /dashboard-password to prevent loop
  // The actual page is at /dashboard/dashboard-password

  console.log('Middleware debug:', {
    pathname,
    normalizedPathname,
    isAuthenticated: !!token,
    dashboardUnlocked: dashboardUnlocked?.value,
    isAppRoute,
    isDashboardPasswordPage,
    isSignInPage,
  });

  // /signin should be accessible without authentication
  if (isSignInPage) {
    const response = NextResponse.next();
    response.cookies.delete('dashboard-unlocked');
    return response;
  }

  // Dashboard routes require NextAuth login first (use getToken to avoid stale-cookie issues)
  if (isAppRoute && !isAuthenticated && !isSignInPage) {
    const response = NextResponse.redirect(new URL(ROUTES.SIGNIN, url));
    response.cookies.delete('dashboard-unlocked');
    return response;
  }

  if (isAuthenticated && normalizedPathname === ROUTES.SIGNIN.slice(1)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, url));
  }

  // Step 2: Handle Dashboard Access (but not for sign-in page or allowed routes)
  // Allow access to certain routes even when dashboard is locked
  const isAllowedRoute = isAllowedWhenLocked(normalizedPathname);

  // Only redirect to password page if user is authenticated but dashboard is locked
  // and it's not an allowed route or the password page itself
  if (
    isAppRoute &&
    !isDashboardPasswordPage &&
    isAuthenticated &&
    !dashboardUnlocked &&
    !isSignInPage &&
    !isAllowedRoute
  ) {
    // For the root dashboard (/dashboard), use empty redirect path
    // For other routes, extract the path after /dashboard
    const redirectPath =
      pathname === '/dashboard'
        ? ''
        : pathname.startsWith('/dashboard/')
          ? pathname.replace(/^\/dashboard\//, '')
          : pathname;

    const redirectUrl = `${ROUTES.DASHBOARD_PASSWORD}?redirect=${encodeURIComponent(redirectPath)}`;
    return NextResponse.redirect(new URL(redirectUrl, url));
  }

  // Step 2.5: Check if coming back to dashboard from another page (auto-lock)
  if (pathname === ROUTES.DASHBOARD && dashboardUnlocked) {
    const referer = request.headers.get('referer');

    // Check if coming from a non-dashboard page
    if (referer) {
      try {
        const refererPath = new URL(referer).pathname;
        const isRefererDashboardPage =
          refererPath === ROUTES.DASHBOARD ||
          refererPath === ROUTES.DASHBOARD_PASSWORD;

        if (!isRefererDashboardPage) {
          const response = NextResponse.redirect(
            new URL(ROUTES.DASHBOARD_PASSWORD, url)
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
    isDashboardRoute(pathname) ||
    pathname === ROUTES.LANDING ||
    isDashboardPasswordPage;

  // Auto-lock: Delete the dashboard-unlocked cookie when navigating away from dashboard pages
  // This ensures the dashboard is locked when user navigates away
  if (!isDashboardRelatedPage && dashboardUnlocked) {
    response.cookies.delete('dashboard-unlocked');
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin'],
};
