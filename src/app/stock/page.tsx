import React from 'react';
import StockLayout from '../../layouts/stockLayout';
import { getCategories } from '@/getData/getCategories';
import { getStock } from '@/actions/stockActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function page() {
  const categories = await getCategories();
  const stockResult = await getStock();
  const stock =
    stockResult.success && Array.isArray(stockResult.data)
      ? stockResult.data
      : [];

  return <StockLayout categories={categories} stock={stock} />;
}

export default page;
