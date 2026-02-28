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
      <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='min-w-[200px] flex-1'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Start Date
            </label>
            <input
              type='date'
              value={dateRange.startDate}
              onChange={(e) =>
                // This will be handled by parent component
                null
              }
              className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500'
            />
          </div>
          <div className='min-w-[200px] flex-1'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              End Date
            </label>
            <input
              type='date'
              value={dateRange.endDate}
              onChange={(e) =>
                // This will be handled by parent component
                null
              }
              className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500'
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
          <div className='mt-3 text-sm text-gray-600'>
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
        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaUserFriends className='mr-2 text-blue-600' />
            <div>
              <div className='text-xs text-gray-500'>Total Dealers</div>
              <div className='text-lg font-semibold text-gray-900'>
                {overallStats.totalDealers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaToggleOn className='mr-2 text-green-600' />
            <div>
              <div className='text-xs text-gray-500'>Active</div>
              <div className='text-lg font-semibold text-green-600'>
                {overallStats.activeDealers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaToggleOff className='mr-2 text-orange-600' />
            <div>
              <div className='text-xs text-gray-500'>Inactive</div>
              <div className='text-lg font-semibold text-orange-600'>
                {overallStats.inactiveDealers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaFileInvoice className='mr-2 text-purple-600' />
            <div>
              <div className='text-xs text-gray-500'>Total Bills</div>
              <div className='text-lg font-semibold text-purple-600'>
                {overallStats.totalBills.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaMoneyBillWave className='mr-2 text-green-600' />
            <div>
              <div className='text-xs text-gray-500'>Total Paid</div>
              <div className='text-lg font-semibold text-green-600'>
                Rs {overallStats.totalPaid.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex items-center'>
            <FaMoneyBillWave className='mr-2 text-red-600' />
            <div>
              <div className='text-xs text-gray-500'>Outstanding</div>
              <div className='text-lg font-semibold text-red-600'>
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
