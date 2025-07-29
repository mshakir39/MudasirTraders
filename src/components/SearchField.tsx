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
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none transition-all duration-200"
          style={{
            boxShadow: '0 0 0 1px rgb(229 231 235)'
          }}
        />
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default SearchField; 