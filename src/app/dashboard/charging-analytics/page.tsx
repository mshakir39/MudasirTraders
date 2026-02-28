'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdDashboard, MdElectricalServices } from 'react-icons/md';
import ChargingStatsGrid from '@/components/dashboard/ChargingStatsGrid';
import ChargingTrendChart from '@/components/dashboard/ChargingTrendChart';

interface DateRange {
  start: Date;
  end: Date;
}

interface ChargingStats {
  totalChargingRevenue: number;
  totalChargingServices: number;
  averageChargingAmount: number;
  pendingChargingAmount?: number;
  pendingChargingCount?: number;
}

interface ChargingTrendData {
  date: string;
  chargingRevenue: number;
  chargingServices: number;
}

export default function ChargingAnalyticsPage() {
  const pathname = usePathname();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const [chargingStats, setChargingStats] = useState<ChargingStats | null>(
    null
  );
  const [chargingTrend, setChargingTrend] = useState<ChargingTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChargingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/charging-stats?${params}`);
      const result = await response.json();

      if (result.success) {
        setChargingStats(result.data.stats);
        setChargingTrend(result.data.trend);
      } else {
        setError(result.error || 'Failed to fetch charging data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchChargingData();
  }, [dateRange, fetchChargingData]);

  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-lg'>Loading charging analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-red-600'>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mx-auto'>
        <div className='mb-8'>
          <h1 className='mb-2 text-3xl font-bold text-gray-900'>
            Charging Service Analytics
          </h1>
          <p className='text-gray-600'>
            Track revenue and trends from battery charging services
          </p>
        </div>

        {/* Quick Analytics Section */}
        <div className='mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <h3 className='mb-4 text-lg font-semibold text-gray-900'>
            Quick Analytics
          </h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Link
              href='/dashboard/charging-analytics'
              className={`flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 transition-colors ${
                pathname === '/dashboard/charging-analytics'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <MdElectricalServices className='h-5 w-5' />
              <span className='font-medium'>Charging Analytics</span>
            </Link>
            <Link
              href='/dashboard'
              className={`flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 transition-colors   hover:bg-blue-100`}
            >
              <MdDashboard className='h-5 w-5' />
              <span className='font-medium'>Main Dashboard</span>
            </Link>
          </div>
        </div>

        <div className='mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Date Range
              </h3>
              <p className='text-sm text-gray-600'>
                {formatDateRange(dateRange)}
              </p>
            </div>
            <div className='flex gap-2'>
              <input
                type='date'
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newStart = new Date(e.target.value);
                  setDateRange((prev) => ({ ...prev, start: newStart }));
                }}
                className='rounded-md border border-gray-300 px-3 py-2 text-sm'
              />
              <input
                type='date'
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value);
                  setDateRange((prev) => ({ ...prev, end: newEnd }));
                }}
                className='rounded-md border border-gray-300 px-3 py-2 text-sm'
              />
            </div>
          </div>
        </div>

        <ChargingStatsGrid
          stats={
            chargingStats || {
              totalChargingRevenue: 0,
              totalChargingServices: 0,
              averageChargingAmount: 0,
            }
          }
          dateRange={dateRange}
        />

        <ChargingTrendChart data={chargingTrend} dateRange={dateRange} />
      </div>
    </div>
  );
}
