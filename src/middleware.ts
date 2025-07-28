import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let sessionToken: any = '';
  if (process.env.NODE_ENV === 'production') {
    sessionToken =
      request.cookies.get('__Secure-next-auth.session-token') ||
      request.cookies.get('next-auth.session-token');
  } else {
    sessionToken = request.cookies.get('next-auth.session-token');
  }

  const url = new URL(request.url);

  // Exclude requests for favicon.ico from redirection
  if (url.pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Dashboard protection - check for dashboard session
  if (url.pathname === '/') {
    const dashboardSession = request.cookies.get('dashboard-session');
    const dashboardUnlockTime = request.cookies.get('dashboard-unlock-time');
    
    // Check if dashboard session exists and is valid (30 minutes)
    if (dashboardSession && dashboardUnlockTime) {
      const unlockTime = parseInt(dashboardUnlockTime.value);
      const currentTime = Date.now();
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes
      
      if (currentTime - unlockTime < sessionTimeout) {
        // Valid session, allow access to dashboard
        return NextResponse.next();
      }
    }
    
    // No valid dashboard session, redirect to dashboard password page
    const dashboardPasswordUrl = new URL('/dashboard-password', request.url);
    return NextResponse.redirect(dashboardPasswordUrl);
  }

  // Allow access to dashboard-password page
  if (url.pathname === '/dashboard-password') {
    return NextResponse.next();
  }

  // If there is a session token and the request is for the signIn page, redirect to home page
  if (sessionToken && url.pathname === '/signIn') {
    const homeUrl = new URL('/category', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // If the user is already signed in, allow access to other pages
  if (sessionToken) {
    return NextResponse.next();
  }

  // If the user is not signed in and not on the signIn page, redirect to the signIn page
  if (!sessionToken && url.pathname !== '/signIn') {
    const signInUrl = new URL('/signIn', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // For all other cases, proceed to the next middleware or route handler
  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
