import { getSalesPaginated, getSalesCustomerNames } from '@/actions/salesActions';
import SalesErrorBoundary from '@/components/sales/SalesErrorBoundary';
import SalesManagementPage from '@/pages/SalesManagementPage';
import { getDefaultSalesDateRange, SALES_BATCH_SIZE } from '@/lib/salesQuery';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Sales | Mudasir Traders',
  description: 'Manage your sales and track revenue',
};

async function getSalesPageData() {
  try {
    const dateRange = getDefaultSalesDateRange();
    const [salesResult, customersResult] = await Promise.all([
      getSalesPaginated(1, SALES_BATCH_SIZE, {
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
      getSalesCustomerNames(),
    ]);

    if (!salesResult.success) {
      console.error('Failed to fetch sales:', salesResult.error);
      return {
        sales: [],
        pagination: {
          page: 1,
          limit: SALES_BATCH_SIZE,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          avgSaleValue: 0,
          uniqueCustomers: 0,
        },
        customerNames: [] as string[],
      };
    }

    return {
      sales: Array.isArray(salesResult.data) ? salesResult.data : [],
      pagination: salesResult.pagination!,
      summary: salesResult.summary!,
      customerNames: customersResult.success
        ? (customersResult.data ?? [])
        : [],
    };
  } catch (error) {
    console.error('Error loading sales data:', error);
    return {
      sales: [],
      pagination: {
        page: 1,
        limit: SALES_BATCH_SIZE,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      summary: {
        totalSales: 0,
        totalRevenue: 0,
        avgSaleValue: 0,
        uniqueCustomers: 0,
      },
      customerNames: [] as string[],
    };
  }
}

export default async function SalesPage() {
  const { sales, pagination, summary, customerNames } =
    await getSalesPageData();

  return (
    <SalesErrorBoundary>
      <SalesManagementPage
        initialSales={sales}
        initialPagination={pagination}
        initialSummary={summary}
        customerNames={customerNames}
      />
    </SalesErrorBoundary>
  );
}
