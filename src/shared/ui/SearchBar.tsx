// src/shared/ui/SearchBar.tsx
// Search bar component - <50 lines

import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
        <FaSearch className='h-4 w-4 text-secondary-400' />
      </div>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='block w-full rounded-md border border-secondary-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-secondary-500 focus:border-primary-500 focus:placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm'
      />
    </div>
  );
};
