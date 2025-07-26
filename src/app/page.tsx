import DashboardLayout from '@/layouts/dashboardLayout';
import { getDashboardStats } from '@/actions/dashboardActions';

export default async function Home() {
  const statsResult = await getDashboardStats();
  const stats = statsResult.success ? statsResult.data : null;

  return <DashboardLayout initialStats={stats} />;
}
