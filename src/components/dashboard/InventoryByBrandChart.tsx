import React from 'react';
import { FaWarehouse } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface InventoryByBrandChartProps {
  data: Array<{
    brand: string;
    value: number;
    products: number;
  }>;
}

export const InventoryByBrandChart: React.FC<InventoryByBrandChartProps> = ({
  data,
}) => (
  <div className='rounded-xl  bg-white p-6 shadow-md'>
    <h3 className='mb-4 text-lg font-semibold text-secondary-900'>
      Inventory Value by Brand
    </h3>
    {data.length > 0 ? (
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={data}>
          <defs>
            <linearGradient id='sidebarGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#4287f5' />
              <stop offset='100%' stopColor='#021b3b' />
            </linearGradient>
            <linearGradient id='accentGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#0284c7' />
              <stop offset='100%' stopColor='#021b3b' />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
          <XAxis dataKey='brand' tick={{ fill: '#64748b' }} />
          <YAxis tick={{ fill: '#64748b' }} />
          <Tooltip
            formatter={(value, name) => [
              name === 'Inventory Value'
                ? `Rs ${Number(value).toLocaleString()}`
                : value,
              name === 'Inventory Value' ? 'Inventory Value' : 'Product Count',
            ]}
          />
          <Legend />
          <Bar
            dataKey='value'
            fill='url(#sidebarGradient)'
            name='Inventory Value'
          />
          <Bar
            dataKey='products'
            fill='url(#accentGradient)'
            name='Product Count'
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className='flex h-[300px] items-center justify-center text-secondary-500'>
        <div className='text-center'>
          <FaWarehouse className='mx-auto mb-2 h-12 w-12 text-secondary-300' />
          <p>No inventory data available</p>
        </div>
      </div>
    )}
  </div>
);
