'use client';

import React, { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/components/sidebar'), {
  ssr: false,
  loading: () => null,
});

const ToastContainer = dynamic(
  () => import('react-toastify').then((m) => m.ToastContainer),
  { ssr: false }
);

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Memoize the callback to prevent unnecessary re-renders
  const handleCollapseChange = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  // Check if current page is sign-in page
  const isSignInPage = pathname === '/signIn';

  // If it's the sign-in page, render without sidebar layout
  if (isSignInPage) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar onCollapseChange={handleCollapseChange} />
      <main
        className={`flex-1 overflow-x-hidden p-4 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <ToastContainer />
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;
