'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const useDashboardGate = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // On the client side
    if (typeof window !== 'undefined') {
      const isUnlocked = sessionStorage.getItem('dashboard-unlocked') === 'true';

      // If trying to access the dashboard and it's not unlocked, redirect to password page.
      if (pathname === '/' && !isUnlocked) {
        router.push('/dashboard-password');
      }
      
      // If navigating away from the dashboard, lock it by clearing the flag.
      // Also, don't lock if we're just going to the password page.
      if (pathname !== '/' && pathname !== '/dashboard-password') {
        sessionStorage.removeItem('dashboard-unlocked');
      }
    }
  }, [pathname, router]);
}; 