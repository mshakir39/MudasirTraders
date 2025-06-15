'use client';
import { useState, useEffect } from 'react';

const useInternetConnection = () => {
  const [isOnline, setOnline] = useState<boolean>((): boolean => {
    return navigator.onLine;
  });

  useEffect(() => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));

    return () => {
      window.removeEventListener('online', () => setOnline(true));
      window.removeEventListener('offline', () => setOnline(false));
    };
  });

  return isOnline;
};

export default useInternetConnection;
