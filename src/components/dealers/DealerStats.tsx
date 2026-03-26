import React from 'react';
import {
  FaUserFriends,
  FaToggleOn,
  FaToggleOff,
  FaFileInvoice,
  FaMoneyBillWave,
} from 'react-icons/fa';
import Button from '@/components/button';

interface DealerStatsProps {
  overallStats: {
    totalDealers: number;
    activeDealers: number;
    inactiveDealers: number;
    totalBills: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onClearFilter: () => void;
}

const DealerStats: React.FC<DealerStatsProps> = ({
  overallStats,
  dateRange,
  onClearFilter,
}) => {
  return (
    <div className='mb-8'>
      {/* Date Range Filter */}
      <div className='mb-6 rounded-lg border border-secondary-200 bg-white p-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='min-w-[200px] flex-1'>
            <label className='mb-2 block text-sm font-medium text-secondary-700'>
              Start Date
            </label>
            <input
              type='date'
              value={dateRange.startDate}
              onChange={(e) =>
                // This will be handled by parent component
                null
              }
              className='block w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500'
            />
          </div>
          <div className='min-w-[200px] flex-1'>
            <label className='mb-2 block text-sm font-medium text-secondary-700'>
              End Date
            </label>
            <input
              type='date'
              value={dateRange.endDate}
              onChange={(e) =>
                // This will be handled by parent component
                null
              }
              className='block w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500'
            />
          </div>
          <div className='mt-6 flex items-center'>
            <Button
              variant='outline'
              text='Clear Filter'
              onClick={onClearFilter}
              className='text-sm'
            />
          </div>
        </div>
        {(dateRange.startDate || dateRange.endDate) && (
          <div className='mt-3 text-sm text-secondary-600'>
            Showing statistics for:
            {dateRange.startDate &&
              ` from ${new Date(dateRange.startDate).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`}
            {dateRange.endDate &&
              ` to ${new Date(dateRange.endDate).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`}
          </div>
        )}
      </div>

      {/* Overall Statistics */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
        <div className='rounded-lg border border-secondary-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaUserFriends className='mr-2' style={{ color: '#4287f5' }} />
            <div>
              <div className='text-xs text-secondary-500'>Total Dealers</div>
              <div className='text-lg font-semibold text-secondary-900'>
                {overallStats.totalDealers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-secondary-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaToggleOn className='mr-2' style={{ color: '#059669' }} />
            <div>
              <div className='text-xs text-secondary-500'>Active</div>
              <div
                className='text-lg font-semibold'
                style={{ color: '#059669' }}
              >
                {overallStats.activeDealers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-secondary-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaToggleOff className='mr-2' style={{ color: '#fbcc5e' }} />
            <div>
              <div className='text-xs text-secondary-500'>Inactive</div>
              <div
                className='text-lg font-semibold'
                style={{ color: '#fbcc5e' }}
              >
                {overallStats.inactiveDealers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-secondary-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaFileInvoice className='mr-2' style={{ color: '#0284c7' }} />
            <div>
              <div className='text-xs text-secondary-500'>Total Bills</div>
              <div
                className='text-lg font-semibold'
                style={{ color: '#0284c7' }}
              >
                {overallStats.totalBills.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-secondary-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaMoneyBillWave className='mr-2' style={{ color: '#059669' }} />
            <div>
              <div className='text-xs text-secondary-500'>Total Paid</div>
              <div
                className='text-lg font-semibold'
                style={{ color: '#059669' }}
              >
                Rs {overallStats.totalPaid.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-secondary-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaMoneyBillWave className='mr-2' style={{ color: '#dc2626' }} />
            <div>
              <div className='text-xs text-secondary-500'>Outstanding</div>
              <div
                className='text-lg font-semibold'
                style={{ color: '#dc2626' }}
              >
                Rs {overallStats.totalOutstanding.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerStats;
