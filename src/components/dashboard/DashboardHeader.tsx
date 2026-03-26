import React from 'react';
import { FaLock } from 'react-icons/fa';

interface DashboardHeaderProps {
  onLock?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLock }) => (
  <div className='mb-8 flex items-start justify-between'>
    <div>
      <h1 className='text-2xl font-semibold text-secondary-900'>Dashboard</h1>
      <p className='mt-1 text-secondary-600'>
        Welcome back! Here&apos;s what&apos;s happening with your store.
      </p>
    </div>

    {onLock && (
      <button
        onClick={onLock}
        className='flex items-center gap-2 rounded-lg bg-sidebar-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90'
        style={{
          background: 'linear-gradient(135deg, #4287f5 0%, #021b3b 100%)',
        }}
        title='Lock Dashboard'
      >
        <FaLock className='h-4 w-4' />
        Lock Dashboard
      </button>
    )}
  </div>
);
