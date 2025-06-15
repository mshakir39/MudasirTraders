import { getSales } from '@/getData/getSales';
import SalesLayout from '@/layouts/salesLayout';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Sales | PowerHub',
  description: 'Manage your sales and track revenue',
};

export default async function SalesPage() {
  const sales = await getSales();
  return <SalesLayout sales={Array.isArray(sales) ? sales : []} />;
} 