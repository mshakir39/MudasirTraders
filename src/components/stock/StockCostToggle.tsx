'use client';

import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface StockCostToggleProps {
  stockCost: number;
  className?: string;
}

export const StockCostToggle: React.FC<StockCostToggleProps> = ({ 
  stockCost, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
        title={isVisible ? 'Hide stock cost' : 'Show stock cost'}
      >
        <span className="text-gray-600 font-medium">
          Total Stock Cost:
        </span>
        {isVisible ? (
          <span className="font-semibold text-green-600">
            {formatCurrency(stockCost)}
          </span>
        ) : (
          <span className="text-gray-400">
            ••••••••
          </span>
        )}
        {isVisible ? (
          <FaEyeSlash className="text-gray-500 h-3.5 w-3.5" />
        ) : (
          <FaEye className="text-gray-500 h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};
