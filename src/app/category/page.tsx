import React from 'react';
import CategoryLayout from '../../layouts/categoryLayout';
import { getCategories } from '@/getData/getCategories';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function Category() {
  console.log("Category");
  const categories = await getCategories();
  console.log("categories",categories);
  return (
    <div className='mt-6 flex w-full flex-col'>
      <CategoryLayout categories={categories} />
    </div>
  );
}

export default Category;
