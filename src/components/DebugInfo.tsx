'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugInfo() {
  const { status, data: session } = useSession();
  const [cookies, setCookies] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      setCookies(document.cookie);
      
      const unlockedCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('dashboard-unlocked='));
      
      const hasCookie = !!unlockedCookie;
      const cookieValue = hasCookie ? unlockedCookie?.split('=')[1] : null;
      const isUnlocked = hasCookie && cookieValue === 'true';
      
      setDebugInfo({
        sessionStatus: status,
        userEmail: session?.user?.email,
        isAuthenticated: status === 'authenticated',
        rawCookie: document.cookie,
        unlockedCookie: unlockedCookie,
        hasCookie,
        cookieValue,
        isUnlocked,
        shouldShowSidebar: status === 'authenticated' && isUnlocked,
        timestamp: new Date().toISOString()
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [status, session]);

  return (
    <div className="fixed top-4 left-4 z-50 bg-black text-white p-4 rounded-lg text-xs max-w-sm overflow-auto max-h-96">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={() => {
            document.cookie = 'dashboard-unlocked=true; path=/; max-age=1800; SameSite=Lax';
            console.log('Manually set cookie');
          }}
          className="bg-green-600 px-2 py-1 rounded text-xs"
        >
          Set Cookie Manually
        </button>
        
        <button
          onClick={() => {
            document.cookie = 'dashboard-unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            console.log('Manually cleared cookie');
          }}
          className="bg-red-600 px-2 py-1 rounded text-xs ml-2"
        >
          Clear Cookie
        </button>
      </div>
    </div>
  );
}
