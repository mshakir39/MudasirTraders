'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const useDashboardAutoLock = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // If we're not on the dashboard route, clear dashboard session
      if (pathname !== '/') {
        // Clear dashboard session cookies
        document.cookie = 'dashboard-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'dashboard-unlock-time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }, [pathname]);
}; 