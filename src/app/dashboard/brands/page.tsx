import { BrandManagement } from '@/features/brand-management';
import BrandsErrorBoundary from '@/components/brands/BrandsErrorBoundary';
import { Metadata } from 'next';
import { JotaiProvider } from '@/components/providers/InvoiceProvider';

export const metadata: Metadata = {
  title: 'Brands | Mudasir Traders',
  description: 'Manage your product brands and inventory',
};

// React 19: Enhanced caching and revalidation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// React 19: Enhanced Server Component - let global state handle data fetching
export default async function Brands() {
  return (
    <JotaiProvider>
      <BrandsErrorBoundary>
        <BrandManagement />
      </BrandsErrorBoundary>
    </JotaiProvider>
  );
}
