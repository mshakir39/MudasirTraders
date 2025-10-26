'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
// import { unlockDashboard } from '@/actions/dashboardActions';

const DashboardPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset component state when mounting (useful when navigating from other routes)
  useEffect(() => {
    setIsLoading(false);
    setPassword('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter the password');
      return;
    }

    setIsLoading(true);

    try {
      // Use environment variable with fallback
      const expectedPassword =
        process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'admin123';

      if (password === expectedPassword) {
        // Set dashboard unlocked cookie
        document.cookie =
          'dashboard-unlocked=true; path=/; max-age=1800; SameSite=Lax'; // 30 minutes
        toast.success('Dashboard unlocked successfully!');

        // Add a small delay to ensure the toast is visible before redirecting
        setTimeout(() => {
          setIsLoading(false);
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error('Incorrect password. Please try again.');
        setPassword('');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error unlocking dashboard:', error);
      toast.error('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/category'); // Redirect to categories page
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md'>
        <div className='rounded-lg bg-white p-8 shadow-lg'>
          <div className='mb-8 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
              <FaLock className='h-8 w-8 text-red-600' />
            </div>
            <h1 className='mb-2 text-2xl font-bold text-gray-900'>
              Dashboard Access Required
            </h1>
            <p className='text-gray-600'>
              Please enter the password to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label
                htmlFor='password'
                className='mb-2 block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter dashboard password'
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600'
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <FaEyeSlash className='h-5 w-5' />
                  ) : (
                    <FaEye className='h-5 w-5' />
                  )}
                </button>
              </div>
            </div>

            <div className='flex gap-3'>
              <button
                type='submit'
                disabled={isLoading}
                className='flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? 'Unlocking...' : 'Unlock Dashboard'}
              </button>
              <button
                type='button'
                onClick={handleCancel}
                disabled={isLoading}
                className='rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Cancel
              </button>
            </div>
          </form>

          <div className='mt-6 text-center'>
            <p className='mt-2 text-xs text-blue-500'>
              You can navigate to other pages using the sidebar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPasswordPage;
