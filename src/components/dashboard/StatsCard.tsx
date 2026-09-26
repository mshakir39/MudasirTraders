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
  isLoading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  extraInfo,
  icon,
  iconBgColor,
  iconColor,
  valueColor = 'text-gray-900',
  isLoading = false,
}) => (
  <div
    className={`rounded-xl bg-white p-6 shadow-md transition-all duration-150 hover:shadow-md ${
      isLoading ? 'opacity-70' : 'opacity-100'
    }`}
  >
    <div className='flex items-center justify-between'>
      <div>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          {isLoading && (
            <span className='inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent' />
          )}
        </div>
        <h3 className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</h3>
        {subtitle && <p className='mt-1 text-sm text-gray-500'>{subtitle}</p>}
        {extraInfo && (
          <p className='mt-1 text-xs text-yellow-600'>{extraInfo}</p>
        )}
      </div>
      <div className={`rounded-lg p-3 ${iconBgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
  </div>
);
