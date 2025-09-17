import { getSales } from '@/actions/salesActions';
import SalesLayout from '@/layouts/salesLayout';
import { Metadata } from 'next';

export const dynamic = 'auto';
export const revalidate = 60; // Cache for 1 minute

export const metadata: Metadata = {
  title: 'Sales | PowerHub',
  description: 'Manage your sales and track revenue',
};

export default async function SalesPage() {
  const salesResult = await getSales();
  const sales =
    salesResult.success && Array.isArray(salesResult.data)
      ? salesResult.data
      : [];
  return <SalesLayout sales={sales} />;
}
