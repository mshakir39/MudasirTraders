import CategoryLayout from '@/layouts/categoryLayout';
import { getCategories } from '@/getData/getCategories';
import { getBrands } from '@/getData/getBrands';
import { IBrand } from '@/interfaces';
import CategoryErrorBoundary from '@/components/category/CategoryErrorBoundary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories | Mudasir Traders',
  description: 'Manage your product categories and organization',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// React 19: Enhanced server component with better error handling
async function getCategoriesData() {
  try {
    const categories = await getCategories();
    return Array.isArray(categories) ? categories : [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function getBrandsData() {
  try {
    const brands = await getBrands();
    return Array.isArray(brands) ? brands : [];
  } catch (error) {
    console.error('Error loading brands:', error);
    return [];
  }
}

async function Category() {
  // React 19: Parallel data fetching for better performance
  const [categories, brands] = await Promise.all([
    getCategoriesData(),
    getBrandsData(),
  ]);

  return (
    // React 19: Error boundary for better error handling
    <CategoryErrorBoundary>
      <CategoryLayout
        initialCategories={categories}
        initialBrands={brands as IBrand[]}
      />
    </CategoryErrorBoundary>
  );
}

export default Category;
