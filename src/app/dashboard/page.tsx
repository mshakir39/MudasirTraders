'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/dashboardLayout';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit?: number;
  averageOrderValue: number;
  totalPending: number;
  totalCustomers: number;
  topSellingProducts: any[];
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingPayments: number;
  };
  salesTrend?: any[];
  inventoryByBrand?: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [previousPathname, setPreviousPathname] = useState<string | null>(null);

  // Check authentication on mount and reload
  useEffect(() => {
    // Clear authentication on every reload/initial load
    localStorage.removeItem('dashboard_authenticated');
    setIsAuthenticated(false);
    setShowPasswordModal(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isAuthenticated) {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setStats(data);
        setLoading(false);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data'
        );
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isMounted, isAuthenticated]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('/api/dashboard-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('dashboard_authenticated', 'true');
        setIsAuthenticated(true);
        setShowPasswordModal(false);
        setPassword('');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (showPasswordModal) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
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

            <form onSubmit={handlePasswordSubmit} className='space-y-6'>
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
                    disabled={authLoading}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600'
                    disabled={authLoading}
                  >
                    {showPassword ? (
                      <FaEyeSlash className='h-5 w-5' />
                    ) : (
                      <FaEye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <div className='rounded-md bg-red-50 p-3 text-sm text-red-700'>
                  {authError}
                </div>
              )}

              <button
                type='submit'
                disabled={authLoading}
                className='w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {authLoading ? 'Verifying...' : 'Unlock Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <p className='mb-4 text-red-600'>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <DashboardLayout initialStats={stats} sales={[]} />;
}
