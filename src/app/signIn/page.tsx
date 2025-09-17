import React from 'react';
import GoogleSignIn from '@/components/googleSignIn';
function page() {
  return (
    <div className='flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-12'>
      <div className='w-full space-y-8 text-center'>
        <div className='space-y-4'>
          <h1 className='text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl leading-tight'>
            WelCome to{' '}
            <span className='text-[#5b4eea]'>Battery Inventory Manager</span>
          </h1>
          <p className='text-base text-gray-600 sm:text-lg md:text-xl lg:text-2xl'>
            Continue SignIn to Access All features
          </p>
        </div>
        
        <div className='flex w-full justify-center py-4'>
          <GoogleSignIn />
        </div>

        <div className='mt-8 space-y-2 text-sm text-gray-600 sm:text-base md:text-lg'>
          <p>Don&apos;t have an account?</p>
          <p>
            Contact us at{' '}
            <a
              href='mailto:owner@mudasirtraders.com'
              className='text-blue-600 hover:text-blue-800 underline transition-colors duration-200'
            >
              owner@mudasirtraders.com
            </a>{' '}
            or
          </p>
          <p>
            Call/Text{' '}
            <a
              href='tel:+923349627745'
              className='text-blue-600 hover:text-blue-800 underline transition-colors duration-200'
            >
              +923349627745
            </a>
          </p>
        </div>
      </div>
      {/* <div className="text-lg text-gray-800">
      <h3>EnergyStation: Your one-stop POS solution for battery shops</h3>
      <ul className="list-none m-0 p-0">
        <li className="text-lg">Manage your inventory with ease</li>
        <li className="text-lg">Create invoices in seconds</li>
        <li className="text-lg">Streamline your business operations</li>
      </ul>
      <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded">Sign up now and take control of your battery shop&apos;s growth!</button>
    </div> */}
    </div>
  );
}

export default page;
