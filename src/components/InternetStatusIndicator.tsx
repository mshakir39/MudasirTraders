'use client';

import { useInternetStatus } from '@/utils/hooks/useInternetStatus';
import { FaWifi } from 'react-icons/fa';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Internet Status Indicator Component
 * Displays a red "no internet" icon in the top right corner when offline
 * Automatically hides when online
 * Hidden on landing page
 */
export const InternetStatusIndicator = () => {
  const isOnline = useInternetStatus();
  const pathname = usePathname();

  useEffect(() => {
    console.log('🔴 InternetStatusIndicator - isOnline:', isOnline);
  }, [isOnline]);

  // Hide on landing page
  if (pathname === '/') {
    return null;
  }

  // Hide when online - only show when offline
  if (isOnline) {
    return null; // Hide when online
  }

  return (
    <div className={`fixed bottom-6 right-20 z-50 group flex items-center gap-2 px-2 py-1 rounded-lg shadow-lg ${isOnline ? 'bg-green-600' : 'bg-red-600'} text-white`}>
      <div className="relative">
        <FaWifi className="w-5 h-5" />
        {!isOnline && (
          <div className="absolute left-1/2 top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
        )}
      </div>
      <span className="text-sm font-medium whitespace-nowrap text-white">
        {isOnline ? 'Connected' : 'No Internet'}
      </span>
    </div>
  );
};
