import { getCustomersPaginated } from '@/actions/customerActions';
import CustomersErrorBoundary from '@/components/customers/CustomersErrorBoundary';
import CustomersPageClient from './CustomersPageClient';
import { CUSTOMERS_BATCH_SIZE } from '@/lib/customersQuery';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customers | Mudasir Traders',
  description: 'Manage customers',
};

async function getCustomersPageData() {
  try {
    const result = await getCustomersPaginated(1, CUSTOMERS_BATCH_SIZE);

    if (!result.success) {
      console.error('Failed to fetch customers:', result.error);
      return {
        customers: [],
        pagination: {
          page: 1,
          limit: CUSTOMERS_BATCH_SIZE,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    return {
      customers: Array.isArray(result.data) ? result.data : [],
      pagination: result.pagination!,
    };
  } catch (error) {
    console.error('Error loading customers:', error);
    return {
      customers: [],
      pagination: {
        page: 1,
        limit: CUSTOMERS_BATCH_SIZE,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export default async function CustomersPage() {
  const { customers, pagination } = await getCustomersPageData();

  return (
    <CustomersErrorBoundary>
      <CustomersPageClient
        initialCustomers={customers}
        initialPagination={pagination}
      />
    </CustomersErrorBoundary>
  );
}
