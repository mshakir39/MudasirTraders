import DashboardLayout from '@/layouts/dashboardLayout';
import { getDashboardStats } from '@/actions/dashboardActions';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time dashboard data
export const revalidate = 0; // React 19: No caching for latest dashboard information

// React 19: Enhanced server component with better error handling
async function getDashboardData() {
  try {
    const statsResult = await getDashboardStats();
    
    if (!statsResult.success) {
      console.error('Failed to fetch dashboard stats:', statsResult.error);
      return null;
    }
    
    return statsResult.data;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return null;
  }
}

export default async function Home() {
  const stats = await getDashboardData();
  return <DashboardLayout initialStats={stats} />;
}
