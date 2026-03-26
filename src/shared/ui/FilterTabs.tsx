// src/shared/ui/FilterTabs.tsx
// Filter tabs component - <50 lines

import React from 'react';

interface FilterTab {
  key: string;
  label: string;
  count: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeFilter,
  onFilterChange,
  className = '',
}) => {
  return (
    <div
      className={`flex w-fit space-x-1 rounded-lg bg-gray-100 p-1 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeFilter === tab.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
};
