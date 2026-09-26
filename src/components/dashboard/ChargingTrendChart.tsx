import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LineChart as LineChartType, Line as LineType } from 'recharts';

interface DateRange {
  start: Date;
  end: Date;
}

interface ChargingTrendChartProps {
  data: Array<{
    date: string;
    chargingRevenue: number;
    chargingServices: number;
  }>;
  dateRange: DateRange;
}

export const ChargingTrendChart: React.FC<ChargingTrendChartProps> = ({
  data,
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
    return `${start} - ${end}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-lg'>
          <p className='text-sm font-medium text-gray-900'>{label}</p>
          <p className='text-sm text-green-600'>
            Revenue: Rs{' '}
            {payload[0].payload?.chargingRevenue?.toLocaleString('en-PK') || 0}
          </p>
          <p className='text-sm text-blue-600'>
            Services: {payload[1].payload?.chargingServices || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='mb-8 rounded-lg bg-white p-6 shadow-md'>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Charging Revenue Trend
        </h3>
        <p className='text-sm text-gray-600'>{formatDateRange(dateRange)}</p>
      </div>

      <ResponsiveContainer width='100%' height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--color-gray-200)' />
          <XAxis
            dataKey='date'
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-PK', {
                month: 'short',
                day: 'numeric',
              });
            }}
          />
          <YAxis
            yAxisId='revenue'
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `Rs ${value}`}
          />
          <YAxis
            yAxisId='services'
            orientation='right'
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId='revenue'
            type='monotone'
            dataKey='chargingRevenue'
            stroke='var(--color-success-500)'
            strokeWidth={2}
            dot={{ fill: 'var(--color-success-500)', r: 4 }}
          />
          <Line
            yAxisId='services'
            type='monotone'
            dataKey='chargingServices'
            stroke='var(--color-primary-500)'
            strokeWidth={2}
            dot={{ fill: 'var(--color-primary-500)', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChargingTrendChart;
