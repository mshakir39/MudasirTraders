import React from 'react';
import { MdTrendingUp, MdElectricalServices } from 'react-icons/md';
import { StatsCard } from './StatsCard';

interface DateRange {
  start: Date;
  end: Date;
}

interface ChargingStatsProps {
  stats: {
    totalChargingRevenue: number;
    totalChargingServices: number;
    averageChargingAmount: number;
    pendingChargingAmount?: number;
    pendingChargingCount?: number;
  };
  dateRange: DateRange;
}

export const ChargingStatsGrid: React.FC<ChargingStatsProps> = ({
  stats,
  dateRange,
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

  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
      <StatsCard
        title='Charging Revenue'
        value={`Rs ${stats.totalChargingRevenue.toLocaleString('en-PK')}`}
        subtitle={`${stats.totalChargingServices} services • ${formatDateRange(dateRange)}`}
        icon={<MdElectricalServices className='h-6 w-6' />}
        iconBgColor='bg-purple-100'
        iconColor='text-purple-600'
      />

      <StatsCard
        title='Charging Services'
        value={stats.totalChargingServices.toString()}
        subtitle='Total charging services provided'
        icon={<MdElectricalServices className='h-6 w-6' />}
        iconBgColor='bg-indigo-100'
        iconColor='text-indigo-600'
      />

      <StatsCard
        title='Avg Charging Amount'
        value={`Rs ${stats.averageChargingAmount.toLocaleString('en-PK')}`}
        subtitle='Average per charging service'
        icon={<MdTrendingUp className='h-6 w-6' />}
        iconBgColor='bg-green-100'
        iconColor='text-green-600'
      />

      <StatsCard
        title='Pending Amount'
        value={`Rs ${(stats.pendingChargingAmount || 0).toLocaleString('en-PK')}`}
        subtitle={`${stats.pendingChargingCount || 0} pending invoices`}
        icon={<MdTrendingUp className='h-6 w-6' />}
        iconBgColor='bg-orange-100'
        iconColor='text-orange-600'
      />
    </div>
  );
};

export default ChargingStatsGrid;
