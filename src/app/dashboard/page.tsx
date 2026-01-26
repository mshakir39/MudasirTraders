'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/dashboardLayout';

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
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setStats(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isMounted]);

  if (!isMounted || loading) {
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

  return <DashboardLayout initialStats={stats} />;
}
