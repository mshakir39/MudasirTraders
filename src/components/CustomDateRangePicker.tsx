'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';
import { RiFilter2Fill } from 'react-icons/ri';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';

interface DateRange {
  start: Date;
  end: Date;
}

interface PresetRange {
  label: string;
  value: string;
  getRange: () => [Date, Date];
}

interface DateRangePickerProps {
  onDateChange: (range: DateRange) => void;
  initialDateRange?: DateRange;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateChange,
  initialDateRange,
  className = '',
}) => {
  // CRITICAL: Prevent any automatic parent notifications
  const hasInitialized = useRef(false);
  const parentNotificationAllowed = useRef(false);

  // Create stable initial range
  const getInitialRange = (): [Date, Date] => {
    if (initialDateRange) {
      return [new Date(initialDateRange.start), new Date(initialDateRange.end)];
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  };

  // Component state - NEVER triggers parent on init
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [currentRange, setCurrentRange] =
    useState<[Date, Date]>(getInitialRange());

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const flatpickrRef = useRef<any>(null);

  // STABLE preset ranges
  const presetRanges: PresetRange[] = [
    {
      label: 'TODAY',
      value: 'today',
      getRange: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        );
        return [start, end];
      },
    },
    {
      label: 'YESTERDAY',
      value: 'yesterday',
      getRange: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          0,
          0,
          0
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59
        );
        return [start, end];
      },
    },
    {
      label: 'LAST 7 DAYS',
      value: 'last7',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'LAST 30 DAYS',
      value: 'last30',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'LAST 3 MONTHS',
      value: 'last3months',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'LAST 6 MONTHS',
      value: 'last6months',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'LAST 12 MONTHS',
      value: 'last12months',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 12);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'CURRENT MONTH',
      value: 'currentMonth',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        return [start, end];
      },
    },
    {
      label: 'LAST YEAR',
      value: 'lastYear',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
        const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        return [start, end];
      },
    },
  ];

  // STABLE formatters
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const displayValue = `${formatDate(currentRange[0])} - ${formatDate(currentRange[1])}`;

  // ONE-TIME initialization effect - NEVER notifies parent automatically
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, []);

  // Handle custom date selection from Flatpickr
  const handleCustomDateChange = useCallback(
    (selectedDates: Date[]) => {
      if (selectedDates.length === 2) {
        const [start, end] = selectedDates;
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        setCurrentRange([start, end]);
        setSelectedRange('');

        onDateChange({ start, end });
      }
    },
    [onDateChange]
  );

  // Handle preset selection
  const handlePresetSelect = (range: PresetRange) => {
    const [start, end] = range.getRange();
    setSelectedRange(range.label);
    setCurrentRange([start, end]);

    if (flatpickrRef.current?.flatpickr) {
      flatpickrRef.current.flatpickr.setDate([start, end], true);
    }

    onDateChange({ start, end });

    setTimeout(() => closeDropdown(), 100);
  };

  // Centralised close — ALWAYS removes body class regardless of how dropdown closes
  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
    document.body.classList.remove('date-picker-open');
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown, closeDropdown]);

  // Cleanup body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('date-picker-open');
    };
  }, []);

  const toggleDropdown = () => {
    if (showDropdown) {
      closeDropdown();
    } else {
      setShowDropdown(true);
      document.body.classList.add('date-picker-open');
    }
  };

  const toggleInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInput((prev) => !prev);
  }, []);

  // Flatpickr options — removed `static: true` to avoid z-index conflicts
  const flatpickrOptions = {
    mode: 'range' as const,
    dateFormat: 'd.m.Y',
    defaultDate: currentRange,
    onChange: handleCustomDateChange,
    minDate: '2000-01-01',
    maxDate: new Date(),
    // ✅ REMOVED: static: true — this was causing the calendar to render inside
    // the dropdown's stacking context, making it fight with chart z-indexes.
    onOpen: (_: Date[], __: string, instance: any) => {
      if (instance.calendarContainer) {
        instance.calendarContainer.style.zIndex = '999999';
        // Use fixed positioning so it escapes any parent stacking context
        instance.calendarContainer.style.position = 'fixed';
      }
    },
    onClose: (_: Date[], __: string, instance: any) => {
      if (instance.calendarContainer) {
        instance.calendarContainer.style.zIndex = '';
        instance.calendarContainer.style.position = '';
      }
    },
  };

  return (
    // ✅ KEY FIX: `isolation: isolate` creates a new stacking context so this
    // component always renders on top regardless of chart z-indexes in siblings.
    <div
      className={`relative w-fit ${className}`}
      ref={containerRef}
      style={{ isolation: 'isolate' }}
    >
      <div
        className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-secondary-200 bg-white px-4 py-2 transition-colors hover:bg-secondary-50'
        onClick={toggleDropdown}
      >
        <IoCalendarOutline className='h-5 w-5 text-secondary-500' />
        <span className='text-sm text-secondary-600'>{displayValue}</span>
      </div>

      {showDropdown && (
        <>
          {/* Backdrop: closes dropdown on outside click, pointer-events:none so it 
              doesn't block the dropdown panel itself. Charts are disabled via the
              body.date-picker-open CSS class (add to globals.css — see below). */}
          <div
            className='date-picker-backdrop fixed inset-0'
            style={{ zIndex: 99998, pointerEvents: 'none' }}
          />

          {/*
           * ✅ KEY FIXES for the dropdown panel:
           *  1. `position: relative` + high z-index so it sits above the backdrop
           *  2. `pointerEvents: 'all'` explicitly re-enables clicks inside
           *  3. Removed Tailwind z-index classes — inline styles take priority
           */}
          <div
            className='absolute top-full mt-2 w-64 overflow-visible rounded-lg border border-secondary-200 bg-white shadow-lg'
            style={{
              zIndex: 99999,
              position: 'absolute',
              pointerEvents: 'all',
            }}
          >
            <div className='p-4'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='font-medium text-secondary-700'>
                  Filter by date range
                </h3>
                <button
                  onClick={toggleInput}
                  className='rounded-full bg-primary-500 p-1 transition-colors hover:bg-primary-600'
                  type='button'
                >
                  {showInput ? (
                    <IoIosArrowUp className='h-4 w-4 text-white' />
                  ) : (
                    <IoIosArrowDown className='h-4 w-4 text-white' />
                  )}
                </button>
              </div>

              {/* Custom Date Input */}
              {showInput && (
                <div className='relative mb-4'>
                  <Flatpickr
                    ref={flatpickrRef}
                    options={flatpickrOptions}
                    value={currentRange}
                    className='block w-full rounded-lg bg-secondary-50 py-2 pl-3 pr-10 text-sm text-secondary-600 transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500'
                  />
                  <IoCalendarOutline className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-secondary-400' />
                </div>
              )}

              {/* Preset Ranges */}
              <div className='space-y-1'>
                {presetRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handlePresetSelect(range)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-primary-50 ${
                      selectedRange === range.label
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-secondary-700'
                    }`}
                    type='button'
                  >
                    <RiFilter2Fill
                      className={`h-4 w-4 flex-shrink-0 ${
                        selectedRange === range.label
                          ? 'text-primary-500'
                          : 'text-secondary-400'
                      }`}
                    />
                    <span className='text-sm font-medium'>{range.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;
