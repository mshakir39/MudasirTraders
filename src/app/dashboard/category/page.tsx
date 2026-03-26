import CategoryClient from './CategoryClient';
import CategoryErrorBoundary from '@/components/category/CategoryErrorBoundary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories | Mudasir Traders',
  description: 'Manage your product categories and organization',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Categories() {
  return (
    <CategoryErrorBoundary>
      <CategoryClient />
    </CategoryErrorBoundary>
  );
}
