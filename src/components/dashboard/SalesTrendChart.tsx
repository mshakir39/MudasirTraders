import React, { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Legend,
} from 'recharts';

interface DateRange {
  start: Date;
  end: Date;
}

interface SalesTrendChartProps {
  data: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  dateRange: DateRange;
}

// Hook that tracks whether the date picker dropdown is open
// by watching the body class that DateRangePicker toggles
function useDatePickerOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsOpen(document.body.classList.contains('date-picker-open'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isOpen;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  dateRange,
}) => {
  const datePickerOpen = useDatePickerOpen();

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
    <div className='rounded-xl bg-white p-6 shadow-md h-full flex flex-col'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-secondary-900'>Sales Trend</h3>
        <div className='text-sm text-secondary-500'>
          {formatDateRange(dateRange)}
        </div>
      </div>
      {data.length > 0 ? (
        // Disable all pointer events on the chart when date picker is open
        <div
          style={{ flex: 1, pointerEvents: datePickerOpen ? 'none' : 'auto' }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
              <XAxis dataKey='date' tick={{ fill: '#64748b' }} />
              <YAxis yAxisId='left' tick={{ fill: '#64748b' }} />
              <YAxis yAxisId='right' orientation='right' tick={{ fill: '#64748b' }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue'
                    ? `Rs ${Number(value).toLocaleString()}`
                    : value,
                  name === 'revenue' ? 'Revenue' : 'Sales Count',
                ]}
              />
              <Legend />
              <Bar
                yAxisId='left'
                dataKey='sales'
                fill='#0284c7'
                name='Sales Count'
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='revenue'
                stroke='#4287f5'
                strokeWidth={2}
                name='Revenue'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className='flex-1 items-center justify-center text-secondary-500 flex'>
          <div className='text-center'>
            <FaShoppingCart className='mx-auto mb-2 h-12 w-12 text-primary-300' />
            <p>No sales data available for selected period</p>
            <p className='mt-1 text-sm'>Try selecting a different date range</p>
          </div>
        </div>
      )}
    </div>
  );
};