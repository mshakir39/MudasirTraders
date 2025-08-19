'use client';

import React, { useState } from 'react';
import SideBar from '@/components/sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className='flex min-h-screen w-full'>
      <SideBar onCollapseChange={setIsSidebarCollapsed} />
      <main 
        className={`flex-1 overflow-x-hidden p-4 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;
