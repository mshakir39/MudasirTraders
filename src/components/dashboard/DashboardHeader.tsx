import React from 'react';
import { FaLock } from 'react-icons/fa';

interface DashboardHeaderProps {
  onLock?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLock }) => (
  <div className='mb-8 flex justify-between items-start'>
    <div>
      <h1 className='text-2xl font-semibold text-gray-900'>
        Dashboard
      </h1>
      <p className='text-gray-600 mt-1'>Welcome back! Here&apos;s what&apos;s happening with your store.</p>
    </div>
    
    {onLock && (
      <button
        onClick={onLock}
        className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors'
        title='Lock Dashboard'
      >
        <FaLock className='h-4 w-4' />
        Lock Dashboard
      </button>
    )}
  </div>
);