'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Customer,
  CustomersPaginationMeta,
} from '@/features/customer-management/entities/customer/model/types';
import {
  CUSTOMERS_BATCH_SIZE,
  CustomerTabFilter,
  customerTypeFromTab,
} from '@/lib/customersQuery';

interface UseCustomersInfiniteScrollOptions {
  initialCustomers: Customer[];
  initialPagination?: CustomersPaginationMeta;
  activeTab: CustomerTabFilter;
  search: string;
}

async function fetchCustomersBatch(
  page: number,
  activeTab: CustomerTabFilter,
  search: string
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(CUSTOMERS_BATCH_SIZE),
  });

  const customerType = customerTypeFromTab(activeTab);
  if (customerType) {
    params.set('customerType', customerType);
  }
  if (search.trim()) {
    params.set('search', search.trim());
  }

  const response = await fetch(`/api/customers?${params}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch customers');
  }

  return result as {
    data: Customer[];
    pagination: CustomersPaginationMeta;
  };
}

export function useCustomersInfiniteScroll({
  initialCustomers,
  initialPagination,
  activeTab,
  search,
}: UseCustomersInfiniteScrollOptions) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPagination?.hasNext ?? false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const applyBatch = useCallback(
    (
      batch: Customer[],
      pagination: CustomersPaginationMeta,
      append: boolean
    ) => {
      setCustomers((prev) => (append ? [...prev, ...batch] : batch));
      setHasMore(pagination?.hasNext ?? false);
      setPage(pagination?.page ?? 1);
    },
    []
  );

  const loadBatch = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await fetchCustomersBatch(pageNum, activeTab, search);
        applyBatch(result.data ?? [], result.pagination, append);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch customers'
        );
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [activeTab, applyBatch, search]
  );

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadBatch(page + 1, true);
  }, [hasMore, loadBatch, loading, page]);

  const refetch = useCallback(() => {
    setPage(1);
    setHasMore(true);
    return loadBatch(1, false);
  }, [loadBatch]);

  const skipInitialFetch = useRef(true);
  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    setPage(1);
    setHasMore(true);
    loadBatch(1, false);
  }, [activeTab, search, loadBatch]);

  return {
    customers,
    setCustomers,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refetch,
  };
}
