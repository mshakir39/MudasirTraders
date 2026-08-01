import { useState, useEffect } from 'react';

/**
 * Hook to monitor internet connection status in real-time
 * Uses browser's online/offline events to detect connectivity changes
 */
export const useInternetStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state based on navigator.onLine
    setIsOnline(navigator.onLine);
    console.log('🌐 Initial internet status:', navigator.onLine ? 'online' : 'offline');

    const handleOnline = () => {
      console.log('🌐 Internet connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🌐 Internet connection lost');
      setIsOnline(false);
    };

    // Add event listeners for online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
