// src/shared/ui/SalesSummaryCards.tsx
// Sales summary cards component - <80 lines

import React from 'react';
import {
  FaDollarSign,
  FaShoppingCart,
  FaUsers,
  FaChartLine,
} from 'react-icons/fa';
import { SalesSummary } from '@/entities/sale/model/types';

interface SalesSummaryCardsProps {
  summary: SalesSummary;
  className?: string;
}

export const SalesSummaryCards: React.FC<SalesSummaryCardsProps> = ({
  summary,
  className = '',
}) => {
  const cards = [
    {
      title: 'Total Sales',
      value: summary.totalSales,
      icon: FaShoppingCart,
      color: 'blue',
      format: 'number',
    },
    {
      title: 'Total Revenue',
      value: summary.totalRevenue,
      icon: FaDollarSign,
      color: 'green',
      format: 'currency',
    },
    {
      title: 'Average Sale',
      value: summary.avgSaleValue,
      icon: FaChartLine,
      color: 'purple',
      format: 'currency',
    },
    {
      title: 'Unique Customers',
      value: summary.uniqueCustomers,
      icon: FaUsers,
      color: 'orange',
      format: 'number',
    },
  ];

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getColorClasses = (color: string) => {
    const colors = {
      primary: 'bg-primary-500 text-white',
      green: 'bg-success text-white',
      accent: 'bg-accent-500 text-white',
      warning: 'bg-warning text-white',
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  const getBgColorClasses = (color: string) => {
    const colors = {
      primary: 'bg-primary-100',
      green: 'bg-success',
      accent: 'bg-accent-100',
      warning: 'bg-warning',
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${getBgColorClasses(card.color)} rounded-lg p-6 shadow-sm`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-secondary-600'>
                {card.title}
              </p>
              <p className='text-2xl font-bold text-secondary-900'>
                {formatValue(card.value, card.format)}
              </p>
            </div>
            <div className={`${getColorClasses(card.color)} rounded-full p-3`}>
              <card.icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
