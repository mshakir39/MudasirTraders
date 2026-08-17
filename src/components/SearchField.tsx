import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className='relative'>
        <input
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className='w-full rounded-lg bg-white py-2 pl-10 pr-3 text-xs shadow-sm outline-none transition-all duration-200 sm:py-3 sm:pl-12 sm:pr-4 sm:text-sm'
          style={{
            color: '#2563eb',
            borderColor: '#dbeafe',
            boxShadow:
              '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3d79e6';
            e.target.style.boxShadow =
              '0 0 0 3px rgba(59, 121, 230, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#dbeafe';
            e.target.style.boxShadow =
              '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
          }}
        />
        <div className='pointer-events-none absolute inset-y-0 left-3 flex items-center sm:left-4'>
          <FaSearch className='h-3 w-3 sm:h-4 sm:w-4' style={{ color: '#60a5fa' }} />
        </div>
      </div>
    </div>
  );
};

export default SearchField;
