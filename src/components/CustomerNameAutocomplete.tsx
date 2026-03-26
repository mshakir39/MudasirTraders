'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useAtom } from 'jotai';
import { invoicesAtom } from '@/store/sharedAtoms';

interface CustomerInfo {
  name: string;
  address?: string;
  contactNumber?: string;
}

interface CustomerInfoWithMatch extends CustomerInfo {
  matchType: 'name' | 'phone' | 'address';
}

interface CustomerNameAutocompleteProps {
  value: string;
  onChange: (e: {
    target: { name: string; value: string; customerInfo?: CustomerInfo };
  }) => void;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  minLength?: number;
  maxLength?: number;
}

const CustomerNameAutocomplete: React.FC<CustomerNameAutocompleteProps> = ({
  value,
  onChange,
  name,
  label,
  placeholder,
  required = false,
  readOnly = false,
  minLength,
  maxLength,
}) => {
  const [suggestions, setSuggestions] = useState<CustomerInfoWithMatch[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allCustomerInfo, setAllCustomerInfo] = useState<CustomerInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Get invoices from Jotai store
  const [invoices] = useAtom(invoicesAtom);

  // Process customer data from invoices in Jotai store
  const processCustomerData = useCallback(() => {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      setAllCustomerInfo([]);
      return;
    }
    
    // Process customer data
    const customerMap = new Map<string, any>();
    
    invoices.forEach((invoice: any) => {
      const customerName = invoice.customerName;
      const contactNumber = invoice.customerContactNumber;
      
      if (
        customerName &&
        customerName.trim() !== ''
        // ✅ Allow walk-in customers with "-" or similar
      ) {
        const uniqueKey =
          contactNumber && contactNumber.trim() !== '' && contactNumber !== '-'
            ? contactNumber
            : customerName;

        if (
          !customerMap.has(uniqueKey) ||
          new Date(invoice.createdDate) >
            new Date(customerMap.get(uniqueKey)?.createdDate || '')
        ) {
          customerMap.set(uniqueKey, {
            name: customerName,
            address: invoice.customerAddress || '',
            contactNumber: contactNumber || '',
            createdDate: invoice.createdDate,
          });
        }
      }
    });

    const customerInfoArray = Array.from(customerMap.values()).sort(
      (a, b) => a.name.localeCompare(b.name)
    );
    
    setAllCustomerInfo(customerInfoArray);
  }, [invoices]);

  // Process customer data whenever invoices change
  useEffect(() => {
    processCustomerData();
  }, [processCustomerData]);

  // Memoize filtered suggestions to prevent unnecessary re-renders
  const filteredSuggestions = useMemo(() => {
    if (value && value.length >= 2 && !readOnly) {
      const searchValue = value.toLowerCase();
      const matches: CustomerInfoWithMatch[] = [];
      
      allCustomerInfo.forEach((customer) => {
        const nameMatch = customer.name && customer.name.toLowerCase().includes(searchValue);
        const phoneMatch = customer.contactNumber && customer.contactNumber.includes(searchValue);
        const addressMatch = customer.address && customer.address.toLowerCase().includes(searchValue);
        
        if (nameMatch) {
          matches.push({ ...customer, matchType: 'name' });
        } else if (phoneMatch) {
          matches.push({ ...customer, matchType: 'phone' });
        } else if (addressMatch) {
          matches.push({ ...customer, matchType: 'address' });
        }
      });
      
      return matches.slice(0, 10); // Limit to 10 suggestions
    }
    return [];
  }, [value, allCustomerInfo, readOnly]);

  // Update suggestions when filtered suggestions change
  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
  }, [filteredSuggestions]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e);
    },
    [onChange]
  );

  // Handle suggestion selection
  const handleSuggestionClick = useCallback(
    (customer: CustomerInfo) => {
      onChange({
        target: {
          name,
          value: customer.name,
          customerInfo: customer,
        },
      });
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [onChange, name]
  );

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (value && value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [value, suggestions.length]);

  // Handle input blur
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 150);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;

      const currentIndex = suggestions.findIndex((s) => s.name === value);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex =
            currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
          onChange({
            target: {
              name,
              value: suggestions[nextIndex].name,
              customerInfo: suggestions[nextIndex],
            },
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
          onChange({
            target: {
              name,
              value: suggestions[prevIndex].name,
              customerInfo: suggestions[prevIndex],
            },
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions.length > 0) {
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    },
    [showSuggestions, suggestions, value, onChange, name]
  );

  return (
    <div className='relative'>
      <label className='mb-1 block text-sm font-medium text-gray-700'>
        {label}
        {required && <span className='ml-1 text-red-500'>*</span>}
      </label>

      <div className='relative'>
        <input
          ref={inputRef}
          type='text'
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          minLength={minLength}
          maxLength={maxLength}
          className={`w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            readOnly ? 'cursor-not-allowed bg-gray-100' : 'bg-white'
          }`}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className='absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg'
        >
          {suggestions.map((customer, index) => (
            <div
              key={index}
              className='cursor-pointer border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-blue-50'
              onClick={() => handleSuggestionClick(customer)}
            >
              <div className='text-sm font-medium text-gray-900'>
                {customer.name}
                {customer.matchType === 'name' && (
                  <span className='ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>Name Match</span>
                )}
              </div>
              {customer.address && (
                <div className='mt-1 flex items-center gap-1 text-xs text-gray-600'>
                  <svg
                    className='h-3 w-3 text-gray-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {customer.address}
                  {customer.matchType === 'address' && (
                    <span className='ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>Address Match</span>
                  )}
                </div>
              )}
              {customer.contactNumber && (
                <div className='flex items-center gap-1 text-xs text-gray-600'>
                  <svg
                    className='h-3 w-3 text-gray-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                  </svg>
                  {customer.contactNumber}
                  {customer.matchType === 'phone' && (
                    <span className='ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>Phone Match</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNameAutocomplete;
