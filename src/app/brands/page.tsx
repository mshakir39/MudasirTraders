import React from 'react';
import { getBrands } from '@/getData/getBrands';
import BrandsLayout from '@/layouts/brandsLayout';

export default async function Brands() {
  const brands = await getBrands();
  console.log('brands', brands);
  return <BrandsLayout brands={brands} />;
}
