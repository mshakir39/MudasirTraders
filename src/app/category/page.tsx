import React from 'react';
import CategoryLayout from '../../layouts/categoryLayout';
import { getCategories } from '@/getData/getCategories';
import { getBrands } from '@/getData/getBrands';
import { IBrand } from '../../../interfaces';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function Category() {
  // Fetch data on server side
  const categories = await getCategories();
  const brands = await getBrands();

  return (
    <CategoryLayout
      initialCategories={categories}
      initialBrands={brands as IBrand[]}
    />
  );
}

export default Category;
