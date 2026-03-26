'use client';
import React, { useState, useRef, useEffect } from 'react';
import { IBatterySeries } from '@/interfaces';

interface SeriesAutocompleteProps {
  series: IBatterySeries[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSelect?: (series: IBatterySeries | null) => void;
  showPrices?: boolean;
}

const SeriesAutocomplete: React.FC<SeriesAutocompleteProps> = ({
  series,
  value,
  onChange,
  placeholder = 'Search series...',
  className = '',
  disabled = false,
  onSelect,
  showPrices = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSeries, setFilteredSeries] = useState<IBatterySeries[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter series based on input value
  useEffect(() => {
    if (!value.trim()) {
      setFilteredSeries(series);
    } else {
      const filtered = series.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSeries(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, series]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  // Handle series selection
  const handleSeriesSelect = (selectedSeries: IBatterySeries) => {
    onChange(selectedSeries.name);
    setIsOpen(false);
    onSelect?.(selectedSeries);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSeries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSeries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSeries.length) {
          handleSeriesSelect(filteredSeries[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative'>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-10 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${className}`}
      />

      {isOpen && filteredSeries.length > 0 && (
        <div
          ref={dropdownRef}
          className='absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white shadow-lg'
          style={{ minWidth: '0' }}
        >
          {filteredSeries.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                index === highlightedIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSeriesSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{ minWidth: '0' }}
            >
              <div className='flex flex-col space-y-1' style={{ minWidth: '0' }}>
                <div className='font-medium text-gray-900 truncate' style={{ minWidth: '0' }}>{item.name}</div>
                <div className='flex flex-col gap-1 text-xs' style={{ minWidth: '0' }}>
                  <div className='flex items-center space-x-2 text-gray-500'>
                    <span className='flex items-center flex-shrink-0'>
                      <span className='font-medium'>{item.plate || 'N/A'}</span>
                      <span className='ml-1 text-gray-400'>plates</span>
                    </span>
                    <span className='flex items-center flex-shrink-0'>
                      <span className='font-medium'>{item.ah || 'N/A'}</span>
                      <span className='ml-1 text-gray-400'>AH</span>
                    </span>
                  </div>
                  {showPrices && (
                    <div className='flex flex-wrap items-center gap-1' style={{ minWidth: '0' }}>
                      <span className='text-gray-600 font-medium whitespace-nowrap'>
                        Rs{' '}
                        {item.retailPrice
                          ? Number(item.retailPrice).toLocaleString()
                          : 'N/A'}
                      </span>
                      <span className='text-[10px] text-gray-400 flex-shrink-0'>Stock</span>
                      {item.maxRetailPrice &&
                        typeof item.maxRetailPrice === 'number' &&
                        item.maxRetailPrice > 0 && (
                          <>
                            <span className='text-green-600 font-medium whitespace-nowrap'>
                              Rs {Number(item.maxRetailPrice).toLocaleString()}
                            </span>
                            <span className='text-[10px] text-green-500 flex-shrink-0'>List</span>
                          </>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredSeries.length === 0 && value.trim() && (
        <div className='absolute z-50 mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg'>
          No series found
        </div>
      )}
    </div>
  );
};

export default SeriesAutocomplete;
