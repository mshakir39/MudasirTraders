// src/app/dashboard/sales/page.tsx
// Use new FSD structure - preserve all functionality

import { getSales } from '@/actions/salesActions';
import SalesErrorBoundary from '@/components/sales/SalesErrorBoundary';
import SalesManagementPage from '@/pages/SalesManagementPage';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic'; // Better for real-time data
export const revalidate = 60; // Cache for 1 minute

export const metadata: Metadata = {
  title: 'Sales | Mudasir Traders',
  description: 'Manage your sales and track revenue',
};

async function getSalesData() {
  try {
    const salesResult = await getSales();

    if (!salesResult.success) {
      console.error('Failed to fetch sales:', salesResult.error);
      return [];
    }

    // Ensure we always return an array
    return Array.isArray(salesResult.data) ? salesResult.data : [];
  } catch (error) {
    console.error('Error loading sales data:', error);
    return [];
  }
}

export default async function SalesPage() {
  const sales = await getSalesData();

  return (
    <SalesErrorBoundary>
      <SalesManagementPage initialSales={sales} />
    </SalesErrorBoundary>
  );
}
