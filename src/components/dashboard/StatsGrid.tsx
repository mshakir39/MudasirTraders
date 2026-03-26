import React from 'react';
import { FaWarehouse, FaUsers } from 'react-icons/fa';
import { MdTrendingUp, MdAccountBalanceWallet } from 'react-icons/md';
import { StatsCard } from './StatsCard';

interface DateRange {
  start: Date;
  end: Date;
}

interface StatsGridProps {
  stats: {
    totalProducts: number;
    totalInventoryValue: number;
    totalRevenue: number;
    totalSales: number;
    totalProfit?: number;
    totalPending: number;
    totalCustomers: number;
  };
  revenueDateRange: DateRange;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  revenueDateRange,
}) => {
  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}d (${start} - ${end})`;
  };

  const profitMargin =
    stats.totalRevenue > 0
      ? ((stats.totalProfit ?? 0) / stats.totalRevenue) * 100
      : 0;

  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'>
      <StatsCard
        title='Inventory Value'
        value={`Rs ${stats.totalInventoryValue.toLocaleString('en-PK')}`}
        subtitle={`${stats.totalProducts} products`}
        icon={<FaWarehouse className='h-6 w-6' style={{ color: '#2563eb' }} />}
        iconBgColor='bg-primary-50'
        iconColor='text-primary-800'
      />

      <StatsCard
        title='Sales'
        value={`Rs ${stats.totalRevenue.toLocaleString('en-PK')}`}
        subtitle={`${stats.totalSales} sales • ${formatDateRange(revenueDateRange)}`}
        icon={<MdTrendingUp className='h-6 w-6' style={{ color: '#059669' }} />}
        iconBgColor='bg-success-50'
        iconColor='text-success-800'
      />

      <StatsCard
        title='Profit'
        value={`Rs ${(stats.totalProfit ?? 0).toLocaleString('en-PK')}`}
        subtitle='Gross profit for selected period'
        extraInfo={`Profit Margin: ${profitMargin.toFixed(1)}%`}
        icon={<MdAccountBalanceWallet className='h-6 w-6' style={{ color: '#0284c7' }} />}
        iconBgColor='bg-accent-50'
        iconColor='text-accent-800'
        valueColor='text-accent-700'
      />

      <StatsCard
        title='Pending Payments'
        value={`Rs ${stats.totalPending.toLocaleString('en-PK')}`}
        subtitle='Outstanding amount'
        icon={
          <MdAccountBalanceWallet 
            className='h-6 w-6' 
            style={{ 
              color: stats.totalPending > 0 ? '#dc2626' : '#475569' 
            }} 
          />
        }
        iconBgColor={stats.totalPending > 0 ? 'bg-error-50' : 'bg-secondary-50'}
        iconColor={stats.totalPending > 0 ? 'text-error-800' : 'text-secondary-800'}
        valueColor={
          stats.totalPending > 0 ? 'text-error-600' : 'text-secondary-900'
        }
      />

      <StatsCard
        title='Total Customers'
        value={stats.totalCustomers.toString()}
        subtitle='Active customers'
        icon={<FaUsers className='h-6 w-6' style={{ color: '#2563eb' }} />}
        iconBgColor='bg-primary-50'
        iconColor='text-primary-800'
      />
    </div>
  );
};
