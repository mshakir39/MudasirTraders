import React from 'react';
import { SalesManagement } from '@/features/sales-management';
import {
  Sale,
  SalesSummary,
  SalesPaginationMeta,
} from '@/features/sales-management/entities/sales/model/types';

interface SalesManagementPageProps {
  initialSales: Sale[];
  initialPagination: SalesPaginationMeta;
  initialSummary: SalesSummary;
  customerNames: string[];
}

export default function SalesManagementPage({
  initialSales,
  initialPagination,
  initialSummary,
  customerNames,
}: SalesManagementPageProps) {
  return (
    <div className='p-0 md:px-6 md:pb-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Sales</h1>
      </div>

      <SalesManagement
        initialSales={initialSales}
        initialPagination={initialPagination}
        initialSummary={initialSummary}
        customerNames={customerNames}
      />
    </div>
  );
}
