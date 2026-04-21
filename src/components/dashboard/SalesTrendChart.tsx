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

  // Group data by month if date range is large (> 30 days)
  const groupedData = React.useMemo(() => {
    const diffTime = Math.abs(
      dateRange.end.getTime() - dateRange.start.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // If date range is more than 31 days (approximately 1 month), group by month
    if (diffDays > 31) {
      const monthGroups: Record<string, { sales: number; revenue: number }> =
        {};

      data.forEach((item, index) => {
        // Parse date - handle "Mon DD" format by adding year from date range
        let date;
        if (item.date.includes(' ') && item.date.length < 15) {
          // Format: "Oct 21" - determine correct year based on date range
          const startMonth = dateRange.start.getMonth();
          const endMonth = dateRange.end.getMonth();
          const startYear = dateRange.start.getFullYear();
          const endYear = dateRange.end.getFullYear();

          // Extract month from date string (e.g., "Oct" from "Oct 21")
          const monthName = item.date.split(' ')[0];
          const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();

          // Determine year based on month and date range
          let year;
          if (endYear > startYear) {
            // Date range spans multiple years
            if (monthIndex < startMonth) {
              // Month is in the end year (e.g., Jan-Mar when range is Oct-Apr)
              year = endYear;
            } else if (monthIndex > endMonth) {
              // Month is in the start year (e.g., Oct-Dec when range is Oct-Apr)
              year = startYear;
            } else {
              // Month is in the overlapping range, use end year for the later occurrence
              year = endYear;
            }
          } else {
            // Same year
            year = startYear;
          }

          date = new Date(`${item.date}, ${year}`);
        } else {
          date = new Date(item.date);
        }

        const monthKey = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = { sales: 0, revenue: 0 };
        }

        monthGroups[monthKey].sales += item.sales;
        monthGroups[monthKey].revenue += item.revenue;
      });

      const grouped = Object.entries(monthGroups)
        .map(([date, values]) => ({
          date,
          sales: values.sales,
          revenue: values.revenue,
        }))
        .sort((a, b) => {
          // Sort chronologically by date (add day for proper parsing)
          const dateA = new Date(`${a.date} 1`);
          const dateB = new Date(`${b.date} 1`);
          return dateA.getTime() - dateB.getTime();
        });

      return grouped;
    }

    // Otherwise return daily data
    return data;
  }, [data, dateRange]);

  return (
    <div className='flex h-full flex-col rounded-xl bg-white p-6 shadow-md'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-secondary-900'>
          Sales Trend
        </h3>
        <div className='text-sm text-secondary-500'>
          {formatDateRange(dateRange)}
        </div>
      </div>
      {groupedData.length > 0 ? (
        // Disable all pointer events on the chart when date picker is open
        <div
          style={{ flex: 1, pointerEvents: datePickerOpen ? 'none' : 'auto' }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={groupedData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
              <XAxis dataKey='date' tick={{ fill: '#64748b' }} />
              <YAxis yAxisId='left' tick={{ fill: '#64748b' }} />
              <YAxis
                yAxisId='right'
                orientation='right'
                tick={{ fill: '#64748b' }}
              />
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
