import { useState, useEffect, useRef } from 'react';

/**
 * Hook to monitor internet connection status in real-time
 * Uses browser's online/offline events plus periodic connectivity checks
 * to detect actual network connectivity (not just browser state)
 */
export const useInternetStatus = (checkIntervalMs = 30000) => {
  const [isOnline, setIsOnline] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const checkRealConnectivity = async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        // Hit a lightweight endpoint on YOUR backend (not a third-party URL,
        // to avoid CORS issues and unnecessary external dependency).
        await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      } finally {
        clearTimeout(timeout);
      }
    };

    // Trust the browser events for immediate feedback...
    const handleOnline = () => checkRealConnectivity();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ...but also poll periodically, since 'online' can be a false positive.
    checkRealConnectivity();
    intervalId = setInterval(checkRealConnectivity, checkIntervalMs);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, [checkIntervalMs]);

  return isOnline;
};
