import React from 'react';
import StockLayout from '../../layouts/stockLayout';
import { getCategories } from '@/getData/getCategories';
import { getStock } from '@/actions/stockActions';

export const dynamic = 'auto';
export const revalidate = 60; // Cache for 1 minute

async function page() {
  try {
    const categories = await getCategories();
    const stockResult = await getStock();
    const stock =
      stockResult.success && Array.isArray(stockResult.data)
        ? stockResult.data
        : [];

    return <StockLayout categories={categories} stock={stock} />;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    // Return empty data if fetch fails during build
    return <StockLayout categories={[]} stock={[]} />;
  }
}

export default page;
