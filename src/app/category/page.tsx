import React from 'react';
import CategoryLayout from '../../layouts/categoryLayout';
import { getCategories } from '@/getData/getCategories';

async function Category() {
  const categories = await getCategories();
  return (
    <div className='mt-6 flex w-full flex-col'>
      <CategoryLayout categories={categories} />
    </div>
  );
}

export default Category;
