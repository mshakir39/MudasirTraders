// src/features/warranty-management/ui/WarrantySearch.tsx
// Warranty search component - <150 lines

import React, {
  useState,
  useOptimistic,
  useActionState,
  useEffect,
  startTransition,
  useRef,
} from 'react';
import { toast } from 'react-toastify';
import { FaSearch } from 'react-icons/fa';
import { WarrantyApi } from '@/entities/warranty/api/warrantyApi';
import { SearchInput } from '@/shared/ui/SearchInput';
import { HistoryChips } from '@/shared/ui/HistoryChips';
import Button from '@/components/button';

interface WarrantySearchProps {
  onSearchResult: (result: any) => void;
  className?: string;
}

interface Suggestion {
  code: string;
  invoiceNo: string;
  customerName: string;
}

export const WarrantySearch: React.FC<WarrantySearchProps> = ({
  onSearchResult,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Optimistic updates for search history
  const [optimisticSearches, addOptimisticSearch] = useOptimistic(
    searchHistory,
    (state, newSearch: string) => [newSearch, ...state.slice(0, 9)]
  );

  // useActionState for form handling
  const [searchState, searchAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const warrantyCode = formData.get('warrantyCode') as string;
      const trimmedSearchTerm = warrantyCode?.trim();

      if (!trimmedSearchTerm) {
        toast.error('Please enter a warranty code');
        return { error: 'Please enter a warranty code' };
      }

      try {
        // Add to search history optimistically
        addOptimisticSearch(trimmedSearchTerm);

        const result = await WarrantyApi.searchWarranty(trimmedSearchTerm);

        if (result && (result.success || result.warranty)) {
          onSearchResult(result);
          setSearchHistory((prev) => [trimmedSearchTerm, ...prev.slice(0, 9)]);
          return { success: true, data: result };
        } else {
          // Check if database is empty by trying to find any invoice
          const testResponse = await fetch('/api/invoices');
          const testInvoices = await testResponse.json();

          if (
            testInvoices.success &&
            Array.isArray(testInvoices.data) &&
            testInvoices.data.length > 0
          ) {
            const hasWarrantyCodes = testInvoices.data.some(
              (invoice: any) =>
                invoice.products &&
                Array.isArray(invoice.products) &&
                invoice.products.some((product: any) => product.warrentyCode)
            );
          }

          // Only show error toast if result doesn't have data
          if (!result.data) {
            toast.error(result?.error || 'No warranty found');
          }
          onSearchResult(result);
          return { error: result?.error || 'No warranty found' };
        }
      } catch (error) {
        console.error('Error searching warranty:', error);
        toast.error('Error searching warranty');
        onSearchResult({ success: false, error: 'Error searching warranty' });
        return { error: 'Error searching warranty' };
      }
    },
    null
  );

  // Handle quick search from history
  const handleQuickSearch = async (code: string) => {
    setSearchTerm(code);

    try {
      const result = await WarrantyApi.searchWarranty(code);

      if (result && result.success) {
        onSearchResult(result);
        startTransition(() => {
          addOptimisticSearch(code);
        });
        setSearchHistory((prev) => [code, ...prev.slice(0, 9)]);
      } else {
        toast.error(result?.error || 'No warranty found');
        onSearchResult(result);
      }
    } catch (error) {
      console.error('Error searching warranty:', error);
      toast.error('Error searching warranty');
      onSearchResult({ success: false, error: 'Error searching warranty' });
    }
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  // Fetch autocomplete suggestions with debounce
  useEffect(() => {
    const DEBOUNCE_DELAY = 300;

    const fetchSuggestions = async () => {
      if (searchTerm.length >= 2) {
        try {
          const response = await fetch(
            `/api/warranty/autocomplete?q=${encodeURIComponent(searchTerm)}`
          );
          const data = await response.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, DEBOUNCE_DELAY);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle suggestion click
  const handleSuggestionClick = (code: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    setSearchTerm(code);
    setShowSuggestions(false);
    handleQuickSearch(code);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Form */}
      <form action={searchAction} className='relative flex gap-4'>
        <div className='relative flex-1' ref={dropdownRef}>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder='Enter warranty code(s) - supports multiple codes separated by comma or space'
            name='warrantyCode'
            disabled={isPending}
            autoComplete='off'
          />
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className='absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-secondary-300 bg-white shadow-lg'>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={(e) => handleSuggestionClick(suggestion.code, e)}
                  className='cursor-pointer border-b border-secondary-100 px-4 py-2 last:border-b-0 hover:bg-secondary-100'
                >
                  <div className='font-medium text-secondary-900'>
                    {suggestion.code}
                  </div>
                  <div className='text-xs text-secondary-500'>
                    Invoice: {suggestion.invoiceNo} - {suggestion.customerName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          type='submit'
          variant='fill'
          text={isPending ? 'Searching...' : 'Search'}
          icon={<FaSearch />}
          isPending={isPending}
        />
      </form>

      {/* Search History */}
      <HistoryChips
        searches={optimisticSearches}
        onChipClick={handleQuickSearch}
        onClearAll={clearSearchHistory}
      />
    </div>
  );
};
