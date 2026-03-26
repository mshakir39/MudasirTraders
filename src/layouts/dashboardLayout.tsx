'use client';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useTransition,
  useOptimistic,
  useActionState,
} from 'react';
import { usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AlertsBanner } from '@/components/AlertsBanner';
import { DateRangeControls } from '@/components/dashboard/DateRangeControls';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import Link from 'next/link';
import { MdElectricalServices, MdDashboard } from 'react-icons/md';
// Local prop types to satisfy dynamic() generics
interface TopSellingProductsProps {
  products: Array<{
    brandName: string;
    series: string;
    soldCount: number;
    inStock: number;
  }>;
  dateRange: DateRange;
}
interface SalesTrendChartProps {
  data: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  dateRange: DateRange;
}
interface InventoryByBrandChartProps {
  data: Array<{
    brand: string;
    value: number;
    products: number;
  }>;
}
const TopSellingProductsLazy = dynamic<TopSellingProductsProps>(
  () =>
    import('@/components/dashboard/TopSellingProducts').then(
      (m) => m.TopSellingProducts as any
    ),
  { ssr: false, loading: () => null }
);
const SalesTrendChartLazy = dynamic<SalesTrendChartProps>(
  () =>
    import('@/components/dashboard/SalesTrendChart').then(
      (m) => m.SalesTrendChart as any
    ),
  { ssr: false, loading: () => null }
);
const InventoryByBrandChartLazy = dynamic<InventoryByBrandChartProps>(
  () =>
    import('@/components/dashboard/InventoryByBrandChart').then(
      (m) => m.InventoryByBrandChart as any
    ),
  { ssr: false, loading: () => null }
);
const ProfitAnalysisLazy = dynamic(
  () =>
    import('@/components/dashboard/ProfitAnalysis').then(
      (m) => m.default
    ),
  { ssr: false, loading: () => null }
);
import { lockDashboard } from '@/actions/dashboardActions';

interface DateRange {
  start: Date;
  end: Date;
}

interface StreamlinedDashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit?: number;
  averageOrderValue: number;
  totalPending: number;
  totalCustomers: number;
  topSellingProducts: Array<{
    brandName: string;
    series: string;
    soldCount: number;
    inStock: number;
  }>;
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingPayments: number;
  };
  salesTrend?: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  inventoryByBrand?: Array<{
    brand: string;
    value: number;
    products: number;
  }>;
}

interface DashboardLayoutProps {
  initialStats: any;
  sales: any[];
  serverTimestamp?: number;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  initialStats,
  sales,
  serverTimestamp,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // React 19: Optimistic state for dashboard stats
  const [optimisticStats, addOptimisticStats] = useOptimistic(
    initialStats || null,
    (state: any, action: any) => {
      if (action.type === 'update') {
        return { ...state, ...action.data };
      }
      return state;
    }
  );

  // React 19: useActionState for date range filtering
  const [filterState, filterAction, isFilterPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;

      // Add optimistic update
      addOptimisticStats({
        type: 'update',
        data: { isFiltering: true },
      });

      // Simulate API call (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        startDate,
        endDate,
        message: 'Dashboard data filtered successfully',
      };
    },
    null
  );

  const handleLockDashboard = () => {
    startTransition(() => {
      lockDashboard();
    });
  };

  const [stats, setStats] = useState<StreamlinedDashboardStats>(() => {
    if (initialStats) {
      return {
        totalProducts: initialStats.totalStockItems || 0,
        totalInventoryValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalSales: initialStats.totalSales || 0,
        totalRevenue: initialStats.totalSales || 0,
        totalProfit: 0,
        averageOrderValue: 0,
        totalPending: 0,
        totalCustomers: initialStats.totalCustomers || 0,
        topSellingProducts: initialStats.topSellingProducts || [],
        alerts: {
          lowStock: 0,
          outOfStock: 0,
          pendingPayments: 0,
        },
      };
    }
    return {
      totalProducts: 0,
      totalInventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averageOrderValue: 0,
      totalPending: 0,
      totalCustomers: 0,
      topSellingProducts: [],
      alerts: {
        lowStock: 0,
        outOfStock: 0,
        pendingPayments: 0,
      },
    };
  });
  const [loading, setLoading] = useState(!initialStats);
  const [error, setError] = useState<string | null>(null);

  // Date Ranges
  const [revenueDateRange, setRevenueDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const [topProductsDateRange, setTopProductsDateRange] = useState<DateRange>(
    () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  );

  const [salesTrendDateRange, setSalesTrendDateRange] = useState<DateRange>(
    () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 13);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  );

  const initialLoadRef = useRef(false);
  const fetchingRef = useRef(false);

  // Fetch data with date ranges
  const fetchData = useCallback(
    async (
      revenueRange: DateRange,
      topProductsRange: DateRange,
      salesTrendRange: DateRange,
      shouldBlock: boolean = true
    ) => {
      if (fetchingRef.current) return;
      try {
        fetchingRef.current = true;
        if (shouldBlock) setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('revenueStart', revenueRange.start.toISOString());
        params.append('revenueEnd', revenueRange.end.toISOString());
        params.append('topProductsStart', topProductsRange.start.toISOString());
        params.append('topProductsEnd', topProductsRange.end.toISOString());
        params.append('salesTrendStart', salesTrendRange.start.toISOString());
        params.append('salesTrendEnd', salesTrendRange.end.toISOString());

        const url = `/api/dashboard?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setStats(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data'
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    // Background fetch on first mount; do not block UI if initialStats exist
    fetchData(
      revenueDateRange,
      topProductsDateRange,
      salesTrendDateRange,
      false
    );
  }, [revenueDateRange, topProductsDateRange, salesTrendDateRange, fetchData]);

  const handleRevenueDateChange = useCallback(
    (range: DateRange) => {
      setRevenueDateRange(range);
      fetchData(range, topProductsDateRange, salesTrendDateRange);
    },
    [topProductsDateRange, salesTrendDateRange, fetchData]
  );

  const handleTopProductsDateChange = useCallback(
    (range: DateRange) => {
      setTopProductsDateRange(range);
      fetchData(revenueDateRange, range, salesTrendDateRange);
    },
    [revenueDateRange, salesTrendDateRange, fetchData]
  );

  const handleSalesTrendDateChange = useCallback(
    (range: DateRange) => {
      setSalesTrendDateRange(range);
      fetchData(revenueDateRange, topProductsDateRange, range);
    },
    [revenueDateRange, topProductsDateRange, fetchData]
  );

  if (loading && !initialStats) return <LoadingSpinner />;

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const chartData = {
    salesTrend: stats.salesTrend || [],
    inventoryByBrand: stats.inventoryByBrand || [],
  };

  return (
    <div className='min-h-screen p-0 py-6 md:p-6'>
      <DashboardHeader onLock={handleLockDashboard} />

      <AlertsBanner alerts={stats.alerts} />

      {/* Quick Analytics Section */}
      <div className='mb-8 rounded-xl   bg-white p-4 shadow-sm'>
        <h3 className='mb-4 text-lg font-semibold text-secondary-900'>
          Quick Analytics
        </h3>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Link
            href='/dashboard/charging-analytics'
            className={`flex items-center gap-2 rounded-lg border border-secondary-300 px-4 py-3 transition-colors ${
              pathname === '/dashboard/charging-analytics'
                ? 'bg-accent-100 text-accent-800'
                : 'bg-accent-50 text-accent-700 hover:bg-accent-100'
            }`}
          >
            <MdElectricalServices className='h-5 w-5' style={{ color: '#0ea5e9' }} />
            <span className='font-medium'>Charging Analytics</span>
          </Link>
          <Link
            href='/dashboard'
            className={`flex items-center gap-2 rounded-lg border border-secondary-300 px-4 py-3 transition-colors ${
              pathname === '/dashboard'
                ? 'bg-primary-100 text-primary-800'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            <MdDashboard className='h-5 w-5' style={{ color: '#4287f5' }} />
            <span className='font-medium'>Main Dashboard</span>
          </Link>
        </div>
      </div>

      <DateRangeControls
        revenueDateRange={revenueDateRange}
        topProductsDateRange={topProductsDateRange}
        salesTrendDateRange={salesTrendDateRange}
        onRevenueDateChange={handleRevenueDateChange}
        onTopProductsDateChange={handleTopProductsDateChange}
        onSalesTrendDateChange={handleSalesTrendDateChange}
      />

      <StatsGrid stats={stats} revenueDateRange={revenueDateRange} />

      {/* Charts Section */}
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:min-h-[500px]'>
        <TopSellingProductsLazy
          products={stats.topSellingProducts}
          dateRange={topProductsDateRange}
        />

        <SalesTrendChartLazy
          data={chartData.salesTrend}
          dateRange={salesTrendDateRange}
        />
      </div>

      {/* Inventory by Brand Chart */}
      <div className='mb-8'>
        <InventoryByBrandChartLazy data={chartData.inventoryByBrand} />
      </div>

      {/* Profit Analysis Section */}
      <div className='mb-8'>
        <ProfitAnalysisLazy />
      </div>
    </div>
  );
};

export default DashboardLayout;
