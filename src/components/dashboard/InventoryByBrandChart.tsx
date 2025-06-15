import React from 'react';
import { FaWarehouse } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface InventoryByBrandChartProps {
  data: Array<{
    brand: string;
    value: number;
    products: number;
  }>;
}

export const InventoryByBrandChart: React.FC<InventoryByBrandChartProps> = ({ data }) => (
  <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Inventory Value by Brand</h3>
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="brand" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              name === 'value' ? `Rs ${Number(value).toLocaleString()}` : value,
              name === 'value' ? 'Inventory Value' : 'Product Count'
            ]}
          />
          <Legend />
          <Bar dataKey="value" fill="#0088FE" name="Inventory Value" />
          <Bar dataKey="products" fill="#00C49F" name="Product Count" />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className='flex items-center justify-center h-[300px] text-gray-500'>
        <div className='text-center'>
          <FaWarehouse className='w-12 h-12 mx-auto mb-2 text-gray-300' />
          <p>No inventory data available</p>
        </div>
      </div>
    )}
  </div>
);