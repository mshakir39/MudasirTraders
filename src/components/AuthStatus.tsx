'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AuthStatusProps {
  onStatusChange?: (status: {
    isSignedIn: boolean;
    isDashboardUnlocked: boolean;
  }) => void;
  children?: React.ReactNode;
}

export default function AuthStatus({
  onStatusChange,
  children,
}: AuthStatusProps) {
  const { status, data: session } = useSession();
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lastNotifiedValues, setLastNotifiedValues] = useState<{
    isSignedIn: boolean;
    isDashboardUnlocked: boolean;
  } | null>(null);

  // Immediately update when session changes
  useEffect(() => {
    if (isMounted && onStatusChange) {
      const isSignedIn = status === 'authenticated';
      let unlocked = isDashboardUnlocked;

      // If user is not signed in, immediately reset dashboard unlock
      if (!isSignedIn) {
        unlocked = false;
        setIsDashboardUnlocked(false);
        // Also clear the cookie
        document.cookie =
          'dashboard-unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }

      // Only call onStatusChange if values actually changed
      const hasChanged =
        !lastNotifiedValues ||
        lastNotifiedValues.isSignedIn !== isSignedIn ||
        lastNotifiedValues.isDashboardUnlocked !== unlocked;

      if (hasChanged) {
        onStatusChange({
          isSignedIn,
          isDashboardUnlocked: unlocked,
        });
        setLastNotifiedValues({ isSignedIn, isDashboardUnlocked: unlocked });
      }
    }
  }, [status, isMounted, onStatusChange, lastNotifiedValues, isDashboardUnlocked]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if dashboard is unlocked via password (one-time check)
  useEffect(() => {
    if (!isMounted) return;

    const checkDashboardUnlock = () => {
      const allCookies = document.cookie;
      const unlockedCookie = allCookies
        .split('; ')
        .find((row) => row.startsWith('dashboard-unlocked='));

      const hasCookie = !!unlockedCookie;
      const cookieValue = hasCookie ? unlockedCookie.split('=')[1] : null;

      const unlocked = hasCookie && cookieValue === 'true';
      setIsDashboardUnlocked(unlocked);

      // If user is authenticated but dashboard is not unlocked, don't auto-unlock
      // User must enter password to access dashboard
    };

    checkDashboardUnlock();
  }, [isMounted, status]); // Remove onStatusChange and lastNotifiedValues to prevent loops

  const isSignedIn = status === 'authenticated';

  // Always render children without any status UI
  return <>{children}</>;
}
