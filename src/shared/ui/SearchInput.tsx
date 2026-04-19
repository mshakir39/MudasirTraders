// src/shared/ui/SearchInput.tsx
// Reusable search input - <50 lines

import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter search term...',
  name = 'search',
  disabled = false,
  className = '',
  autoComplete = 'off',
}) => {
  return (
    <div className={`flex-1 ${className}`}>
      <input
        type='text'
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className='w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-secondary-100'
      />
    </div>
  );
};
