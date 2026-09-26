'use client';

import React, { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import {
  ComposedChart,
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
    fullDate?: string;
    sales: number;
    revenue: number;
  }>;
  dateRange: DateRange;
  isLoading?: boolean;
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
  isLoading = false,
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

  // Group data by month if date range is large (> 31 days)
  const groupedData = React.useMemo(() => {
    const diffTime = Math.abs(
      dateRange.end.getTime() - dateRange.start.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // If date range is more than 31 days (approximately 1 month), group by month
    if (diffDays > 31) {
      const monthGroups: Record<
        string,
        { sales: number; revenue: number; order: number }
      > = {};

      data.forEach((item) => {
        let monthKey = '';
        let sortOrder = 0;

        if (item.fullDate) {
          const parts = item.fullDate.split('-');
          if (parts.length >= 2) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            sortOrder = year * 100 + month;
            const d = new Date(year, month - 1, 1);
            monthKey = d.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
          }
        }

        if (!monthKey) {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            sortOrder = d.getFullYear() * 100 + (d.getMonth() + 1);
            monthKey = d.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
          } else {
            monthKey = item.date;
          }
        }

        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = { sales: 0, revenue: 0, order: sortOrder };
        }

        monthGroups[monthKey].sales += item.sales;
        monthGroups[monthKey].revenue += item.revenue;
      });

      return Object.entries(monthGroups)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([date, values]) => ({
          date,
          sales: values.sales,
          revenue: values.revenue,
        }));
    }

    return data;
  }, [data, dateRange]);

  return (
    <div
      className={`flex h-full flex-col rounded-xl bg-white p-6 shadow-md transition-opacity duration-150 ${
        isLoading ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center text-lg font-semibold text-secondary-900'>
          <span>Sales Trend</span>
          {isLoading && (
            <span className='ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent' />
          )}
        </h3>
        <div className='text-sm text-secondary-500'>
          {formatDateRange(dateRange)}
        </div>
      </div>
      {groupedData.length > 0 ? (
        // Disable all pointer events on the chart when date picker is open
        <div
          style={{
            flex: 1,
            pointerEvents: datePickerOpen ? 'none' : 'auto',
            minHeight: 280,
          }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart data={groupedData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
              <XAxis
                dataKey='date'
                tick={{ fill: '#64748b', fontSize: 12 }}
                interval={groupedData.length > 20 ? 'preserveStartEnd' : 0}
              />
              <YAxis
                yAxisId='left'
                tick={{ fill: '#64748b', fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId='right'
                orientation='right'
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(v) =>
                  `Rs ${
                    Number(v) >= 1000
                      ? `${(Number(v) / 1000).toFixed(0)}k`
                      : Number(v).toLocaleString()
                  }`
                }
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  name === 'revenue' || name === 'Revenue'
                    ? `Rs ${Number(value).toLocaleString()}`
                    : `${value} sales`,
                  name === 'revenue' || name === 'Revenue'
                    ? 'Revenue'
                    : 'Sales Count',
                ]}
              />
              <Legend />
              <Bar
                yAxisId='left'
                dataKey='sales'
                fill='#0284c7'
                name='Sales Count'
                barSize={groupedData.length > 15 ? 12 : 24}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='revenue'
                stroke='#4287f5'
                strokeWidth={2}
                name='Revenue'
                dot={groupedData.length <= 31}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className='flex flex-1 items-center justify-center text-secondary-500'>
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
