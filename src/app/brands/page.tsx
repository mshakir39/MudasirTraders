import React from 'react';
import { getBrands } from '@/actions/brandActions';
import BrandsLayout from '@/layouts/brandsLayout';
import { IBrand } from '../../../interfaces';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Brands() {
  const brandsResult = await getBrands();
  const brands = brandsResult.success ? brandsResult.data : [];

  return <BrandsLayout initialBrands={brands as IBrand[]} />;
}
