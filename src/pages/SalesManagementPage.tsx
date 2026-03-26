// src/pages/SalesManagementPage.tsx
// Sales management page - <50 lines (composition only)

import React from 'react';
import { SalesManagement } from '@/features/sales-management';

interface SalesManagementPageProps {
  initialSales: any[];
}

export default function SalesManagementPage({
  initialSales,
}: SalesManagementPageProps) {
  return (
    <div className='p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Sales</h1>
      </div>

      {/* Sales Management Component */}
      <SalesManagement initialSales={initialSales} />
    </div>
  );
}
