import React from 'react';

export const LoadingSpinner = () => (
  <div className='flex h-full w-full items-center justify-center py-8'>
    <div className='h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-[#4287f5]'></div>
  </div>
);