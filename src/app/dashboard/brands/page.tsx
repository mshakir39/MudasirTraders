import { getBrands } from '@/actions/brandActions';
import BrandsLayout from '@/layouts/brandsLayout';
import BrandsErrorBoundary from '@/components/brands/BrandsErrorBoundary';
import { IBrand } from '@/interfaces';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brands | Mudasir Traders',
  description: 'Manage your product brands and inventory',
};

// React 19: Enhanced caching and revalidation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// React 19: Server Component with better error handling
async function getBrandsData() {
  try {
    const brandsResult = await getBrands();

    if (!brandsResult.success) {
      console.error('Failed to fetch brands:', brandsResult.error);
      return [];
    }

    return brandsResult.data || [];
  } catch (error) {
    console.error('Error loading brands:', error);
    return [];
  }
}

// React 19: Enhanced Server Component
export default async function Brands() {
  const brands = await getBrandsData();

  return (
    <BrandsErrorBoundary>
      <BrandsLayout
        initialBrands={brands as IBrand[]}
        // React 19: Pass server-side timestamp for cache invalidation
        serverTimestamp={Date.now()}
      />
    </BrandsErrorBoundary>
  );
}
