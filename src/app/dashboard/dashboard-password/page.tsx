'use client';
import React, {
  useState,
  useEffect,
  useActionState,
  useOptimistic,
  startTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
// import { unlockDashboard } from '@/actions/dashboardActions';

const DashboardPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // React 19: Optimistic state for password validation
  const [optimisticAuth, addOptimisticAuth] = useOptimistic(
    { isAuthenticated: false, error: null },
    (state: any, action: any) => {
      if (action.type === 'validate') {
        return { isAuthenticated: action.isValid, error: action.error };
      }
      return state;
    }
  );

  // React 19: useActionState for form handling
  const [authState, authenticateAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const password = formData.get('password') as string;

      if (!password?.trim()) {
        return { error: 'Please enter the password' };
      }

      // Add optimistic validation
      startTransition(() => {
        addOptimisticAuth({
          type: 'validate',
          isValid: false,
          error: null,
        });
      });

      try {
        const expectedPassword =
          process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'admin123';

        if (password === expectedPassword) {
          console.log('Dashboard password correct, setting cookie...');

          try {
            // Set dashboard unlocked cookie (production-compatible)
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const cookieOptions = isHttps
              ? 'dashboard-unlocked=true; path=/; max-age=1800; SameSite=None; Secure'
              : 'dashboard-unlocked=true; path=/; max-age=1800; SameSite=Lax';

            console.log('Setting cookie with options:', cookieOptions);
            console.log('Is HTTPS:', isHttps);
            console.log('Current protocol:', typeof window !== 'undefined' ? window.location.protocol : 'unknown');

            document.cookie = cookieOptions;

            // Verify cookie was set
            const cookies = document.cookie;
            console.log('All cookies after setting:', cookies);

            const hasCookie = cookies.includes('dashboard-unlocked=true');
            console.log('Cookie successfully set:', hasCookie);

            if (!hasCookie) {
              console.error('Cookie setting failed! Cookie not found in document.cookie');
              // Try alternative method
              console.log('Attempting alternative cookie setting...');
              const alternativeCookie = 'dashboard-unlocked=true; path=/; max-age=1800';
              document.cookie = alternativeCookie;
              console.log('Alternative cookie set, all cookies now:', document.cookie);
            }

          } catch (error) {
            console.error('Error setting cookie:', error);
          }

          // Update optimistic state
          startTransition(() => {
            addOptimisticAuth({
              type: 'validate',
              isValid: true,
              error: null,
            });
          });

          toast.success('Dashboard unlocked successfully!');

          // Small delay to ensure cookie is set before redirect (needed for production)
          setTimeout(() => {
            console.log('Redirecting to /dashboard...');
            router.push('/dashboard');
          }, 1500);

          return { success: true };
        } else {
          const error = 'Incorrect password. Please try again.';
          startTransition(() => {
            addOptimisticAuth({
              type: 'validate',
              isValid: false,
              error,
            });
          });
          return { error };
        }
      } catch (error) {
        const errorMessage = 'An error occurred. Please try again.';
        startTransition(() => {
          addOptimisticAuth({
            type: 'validate',
            isValid: false,
            error: errorMessage,
          });
        });
        return { error: errorMessage };
      }
    },
    null
  );

  // Reset component state when mounting (useful when navigating from other routes)
  useEffect(() => {
    setPassword('');
  }, []);

  const handleCancel = () => {
    router.push('/'); // Redirect to landing page
  };

  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
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

          {/* React 19: Modern form with useActionState */}
          <form action={authenticateAction} className='space-y-6'>
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
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter dashboard password'
                  disabled={isPending}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600'
                  disabled={isPending}
                >
                  {showPassword ? (
                    <FaEyeSlash className='h-5 w-5' />
                  ) : (
                    <FaEye className='h-5 w-5' />
                  )}
                </button>
              </div>
            </div>

            {/* React 19: Show error message from action state */}
            {authState?.error && (
              <div className='rounded-md bg-red-50 p-3 text-sm text-red-700'>
                {authState.error}
              </div>
            )}

            {/* React 19: Show optimistic auth state */}
            {optimisticAuth.isAuthenticated && (
              <div className='rounded-md bg-green-50 p-3 text-sm text-green-700'>
                Authentication successful! Redirecting...
              </div>
            )}

            <div className='flex gap-3'>
              <button
                type='submit'
                disabled={isPending}
                className='flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isPending ? 'Unlocking...' : 'Unlock Dashboard'}
              </button>
              <button
                type='button'
                onClick={handleCancel}
                disabled={isPending}
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
