// src/shared/ui/HistoryChips.tsx
// Search history chips - <50 lines

import React from 'react';
import { FaHistory } from 'react-icons/fa';

interface HistoryChipsProps {
  searches: string[];
  onChipClick: (search: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const HistoryChips: React.FC<HistoryChipsProps> = ({
  searches,
  onChipClick,
  onClearAll,
  className = ''
}) => {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div className={`border-t pt-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-sm text-gray-600">
          <FaHistory className="mr-2" />
          Recent Searches
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((code, index) => (
          <button
            key={`${code}-${index}`}
            onClick={() => onChipClick(code)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
};
