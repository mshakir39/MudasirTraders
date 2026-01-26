'use client'; // <--- Add this line at the very top

import GoogleSignIn from '@/components/googleSignIn';

export default function Page() {
  return (
    <div className='flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-12'>
      <div className='w-full space-y-8 text-center'>
        <div className='space-y-4'>
          <h1 className='text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl'>
            Welcome to <span className='text-[#5b4eea]'>Mudasir Traders</span>
          </h1>
          <p className='text-base text-gray-600 sm:text-lg md:text-xl lg:text-2xl'>
            Sign in to access your Battery Inventory Management System
          </p>
        </div>

        <div className='flex w-full justify-center py-4'>
          <GoogleSignIn />
        </div>

        <div className='mt-8 space-y-2 text-sm text-gray-600 sm:text-base md:text-lg'>
          <p>Mudasir Traders Employee Portal</p>
          <p>
            If you forgot your account password, contact{' '}
            <a
              href='mailto:mshakir39@gmail.com'
              className='text-blue-600 underline transition-colors duration-200 hover:text-blue-800'
            >
              mshakir39@gmail.com
            </a>
          </p>
        </div>

        <div className='mt-12 text-xs text-gray-500'>
          <p>
            Made by{' '}
            <a
              href='https://www.linkedin.com/in/muzamil-shakir'
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 underline transition-colors duration-200 hover:text-blue-800'
            >
              Muzamil Qureshi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
