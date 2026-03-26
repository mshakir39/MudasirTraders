// src/shared/ui/InfoCard.tsx
// Information card component - <60 lines

import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  icon = <FaInfoCircle />,
  className = ''
}) => {
  return (
    <div className={`rounded-lg border border-blue-200 bg-blue-50 p-6 ${className}`}>
      <div className="mb-4 flex items-start">
        <div className="mr-3 mt-1 text-xl text-blue-600">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-blue-800">
          {title}
        </h2>
      </div>
      <div className="ml-8">
        {children}
      </div>
    </div>
  );
};
