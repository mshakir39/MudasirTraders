import DashboardLayout from '@/layouts/dashboardLayout';
import { getDashboardStats } from '@/actions/dashboardActions';

export const dynamic = 'auto';
export const revalidate = 60; // Cache for 1 minute

export default async function Home() {
  const statsResult = await getDashboardStats();
  const stats = statsResult.success ? statsResult.data : null;

  return <DashboardLayout initialStats={stats} />;
}
