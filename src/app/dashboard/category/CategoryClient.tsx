// src/app/dashboard/category/CategoryClient.tsx
// Client component that uses FSD category management

'use client';

import { CategoryManagement } from '@/features/category-management';
import CategoryErrorBoundary from '@/components/category/CategoryErrorBoundary';
import { JotaiProvider } from '@/components/providers/InvoiceProvider';

export default function CategoryClient() {
  return (
    <JotaiProvider>
      <CategoryErrorBoundary>
        <CategoryManagement />
      </CategoryErrorBoundary>
    </JotaiProvider>
  );
}
