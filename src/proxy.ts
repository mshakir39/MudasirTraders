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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;

  if (pathname === '/signIn') {
    return NextResponse.redirect(new URL('/signin', url));
  }

  // Clean up only actual duplicate /dashboard segments (like /dashboard/dashboard/brands)
  const cleanPathname = pathname.replace(
    /\/dashboard\/dashboard\//g,
    '/dashboard/'
  );
  if (cleanPathname !== pathname) {
    return NextResponse.redirect(new URL(cleanPathname, url));
  }

  // Get authentication status for NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;

  // If user is trying to access /dashboard but not authenticated, redirect to signin
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/signin', url));
  }

  if (isAuthenticated && pathname === '/signin') {
    return NextResponse.redirect(new URL('/dashboard', url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*', '/signin', '/signIn'],
};