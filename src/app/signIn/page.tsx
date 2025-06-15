import React from 'react';
import GoogleSignIn from '@/components/googleSignIn';
function page() {
  return (
    <div className='flex h-svh w-full flex-col items-center justify-center'>
      <span className='mb-12 text-center  md:text-[40px] lg:text-[44px]'>
        WelCome to{' '}
        <span className='text-[#5b4eea]'>Battery Inventory Manager</span>
      </span>
      <span className='my-3 text-center text-[16px] md:text-[26px]'>
        Continue SignIn to Access All features
      </span>
      <div className='flex w-full justify-center'>
        <GoogleSignIn />
      </div>

      <div className='mt-12 flex w-full flex-col text-center text-sm text-gray-600'>
        <span>Don&apos;t have an account?</span>
        <span>
          Contact us at{' '}
          <a
            href='mailto:owner@mudasirtraders.com'
            className='text-blue-600 hover:text-blue-800'
          >
            owner@mudasirtraders.com
          </a>{' '}
          or
        </span>
        <span>
          Call/Text{' '}
          <a
            href='tel:+923367045100'
            className='text-blue-600 hover:text-blue-800'
          >
            +923349627745
          </a>
        </span>
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
