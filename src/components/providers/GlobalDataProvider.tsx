// src/components/providers/GlobalDataProvider.tsx
// Pre-loads all shared data at app level for optimal performance

'use client';

import React, { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  categoriesAtom,
  stockAtom,
  brandsAtom,
  invoicesAtom,
  fetchCategoriesAtom,
  fetchStockAtom,
  fetchBrandsAtom,
  fetchInvoicesAtom,
  setCategoriesAtom,
  setStockAtom,
  setBrandsAtom,
  setInvoicesAtom,
} from '@/store/sharedAtoms';

interface GlobalDataProviderProps {
  children: React.ReactNode;
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({
  children,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [categories] = useAtom(categoriesAtom);
  const [stock] = useAtom(stockAtom);
  const [brands] = useAtom(brandsAtom);
  const [invoices] = useAtom(invoicesAtom);
  const fetchCategories = useSetAtom(fetchCategoriesAtom);
  const fetchStock = useSetAtom(fetchStockAtom);
  const fetchBrands = useSetAtom(fetchBrandsAtom);
  const fetchInvoices = useSetAtom(fetchInvoicesAtom);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch data on client-side after hydration and only once
    if (!isClient || hasInitialized) return;

    // Check if data already exists before fetching
    const hasData =
      stock.length > 0 ||
      categories.length > 0 ||
      brands.length > 0 ||
      invoices.length > 0;

    if (hasData) {
      setHasInitialized(true);
      return;
    }

    // Pre-load all shared data on dashboard initialization
    const initializeData = async () => {
      // Fetch all data in parallel for optimal performance
      try {
        await Promise.all([
          fetchCategories(),
          fetchStock(),
          fetchBrands(),
          fetchInvoices(),
        ]);
        setHasInitialized(true);
      } catch (error) {
        console.error('❌ Error loading global data:', error);
        setHasInitialized(true);
      }
    };

    initializeData();
  }, [isClient, hasInitialized]);

  return <>{children}</>;
};
