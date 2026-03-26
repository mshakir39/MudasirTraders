// src/features/invoice-management/lib/useInvoicePagination.ts
// Hook for managing invoice pagination with server-side support

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '@/entities/invoice';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PaginatedInvoicesResult {
  invoices: Invoice[];
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function useInvoicePagination(
  initialInvoices: Invoice[],
  initialPageSize: number = 20
): PaginatedInvoicesResult {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: initialPageSize,
    total: initialInvoices.length,
    totalPages: Math.ceil(initialInvoices.length / initialPageSize),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update invoices when initialInvoices changes (e.g., after creating/updating)
  useEffect(() => {
    setInvoices(initialInvoices);
    setPagination((prev) => ({
      ...prev,
      total: initialInvoices.length,
      totalPages: Math.ceil(initialInvoices.length / prev.pageSize),
    }));
  }, [initialInvoices]);

  // Update pagination when page size changes
  const setPageSize = useCallback((newPageSize: number) => {
    setPagination((prev) => {
      const newTotalPages = Math.ceil(prev.total / newPageSize);
      const newPage = Math.min(prev.page, newTotalPages - 1);
      return {
        ...prev,
        pageSize: newPageSize,
        totalPages: newTotalPages,
        page: newPage,
      };
    });
  }, []);

  // Update page
  const setPage = useCallback((newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(0, Math.min(newPage, prev.totalPages - 1)),
    }));
  }, []);

  // Refetch data (for now just updates with current data)
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // In a real server-side pagination scenario, this would make an API call
      // For now, we just work with the client-side data
      setInvoices(initialInvoices);
      setPagination((prev) => ({
        ...prev,
        total: initialInvoices.length,
        totalPages: Math.ceil(initialInvoices.length / prev.pageSize),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [initialInvoices]);

  return {
    invoices,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
  };
}
