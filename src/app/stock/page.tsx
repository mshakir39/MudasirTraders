import React from 'react';
import StockLayout from '../../layouts/stockLayout';
import { getCategories } from '@/getData/getCategories';
import { getAllStock } from '@/getData/getStock';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function page() {
  console.log("Stock");
  const categories = await getCategories();
  console.log("categories",categories);
  const stock = await getAllStock();

  return (
    <div className='mt-6 flex w-full flex-col'>
      <StockLayout categories={categories} stock={stock} />
    </div>
  );
}

export default page;
