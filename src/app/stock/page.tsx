import React from 'react';
import StockLayout from '../../layouts/stockLayout';
import { getCategories } from '@/getData/getCategories';
import { getAllStock } from '@/getData/getStock';

async function page() {
  const categories = await getCategories();

  const stock = await getAllStock();

  return (
    <div className='mt-6 flex w-full flex-col'>
      <StockLayout categories={categories} stock={stock} />
    </div>
  );
}

export default page;
