'use client';

import React from 'react';
import Button from './button';
import Image from 'next/image';
import Noconnection from '../../public/no connection.jpg';
function OfflinePage() {
  return (
    <div className='flex h-svh w-full flex-col items-center justify-center gap-4'>
      <Image className='h-72 w-96' src={Noconnection} alt='' />
      <h1 className='font-bold'>No internet connection</h1>
      <p>
        You are currently offline. Please check your internet connection and try
        again.
      </p>
      <Button
        className='font-semibold'
        variant='fill'
        text='Reload'
        onClick={() => window.location.reload()}
      ></Button>
    </div>
  );
}

export default OfflinePage;
