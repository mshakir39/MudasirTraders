'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sale,
  SalesSummary,
  DateRange,
  SalesPaginationMeta,
} from '@/features/sales-management/entities/sales/model/types';
import { SALES_BATCH_SIZE } from '@/lib/salesQuery';

interface UseSalesInfiniteScrollOptions {
  initialSales: Sale[];
  initialPagination: SalesPaginationMeta;
  initialSummary: SalesSummary;
  dateRange: DateRange;
  customerName: string;
}

async function fetchSalesBatch(
  page: number,
  dateRange: DateRange,
  customerName: string
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(SALES_BATCH_SIZE),
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
  });
  if (customerName) {
    params.set('customerName', customerName);
  }

  const response = await fetch(`/api/sales?${params}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch sales');
  }

  return result as {
    data: Sale[];
    pagination: SalesPaginationMeta;
    summary: SalesSummary;
  };
}

export function useSalesInfiniteScroll({
  initialSales,
  initialPagination,
  initialSummary,
  dateRange,
  customerName,
}: UseSalesInfiniteScrollOptions) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [summary, setSummary] = useState<SalesSummary>(initialSummary);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPagination.hasNext);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const applyBatch = useCallback(
    (
      batch: Sale[],
      pagination: SalesPaginationMeta,
      nextSummary: SalesSummary,
      append: boolean
    ) => {
      setSales((prev) => (append ? [...prev, ...batch] : batch));
      setSummary(nextSummary);
      setHasMore(pagination.hasNext);
      setPage(pagination.page);
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
        const result = await fetchSalesBatch(pageNum, dateRange, customerName);
        applyBatch(
          result.data ?? [],
          result.pagination,
          result.summary,
          append
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sales');
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [applyBatch, customerName, dateRange.end, dateRange.start]
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
  }, [customerName, dateRange.start, dateRange.end, loadBatch]);

  return {
    sales,
    summary,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refetch,
  };
}
