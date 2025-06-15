import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  extraInfo?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  extraInfo,
  icon,
  iconBgColor,
  iconColor,
  valueColor = 'text-gray-900'
}) => (
  <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
    <div className='flex items-center justify-between'>
      <div>
        <p className='text-sm font-medium text-gray-600'>{title}</p>
        <h3 className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</h3>
        {subtitle && <p className='text-sm text-gray-500 mt-1'>{subtitle}</p>}
        {extraInfo && <p className='text-xs text-yellow-600 mt-1'>{extraInfo}</p>}
      </div>
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
  </div>
);