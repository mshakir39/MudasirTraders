import { Metadata } from 'next';
import CustomersLayout from '@/layouts/customersLayout';
import { getCustomers } from '@/getData/getCustomers';
import CustomersErrorBoundary from '@/components/customers/CustomersErrorBoundary';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time data
export const revalidate = 0; // React 19: No caching for latest customer data

export const metadata: Metadata = {
  title: 'Customers | PowerHub',
  description: 'Manage your customers and their information',
};

// React 19: Enhanced server component with better error handling
async function getCustomersData() {
  try {
    const customers = await getCustomers();

    if (!Array.isArray(customers)) {
      console.error('Invalid customers data format');
      return [];
    }

    return customers;
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
}

export default async function CustomersPage() {
  const customers = await getCustomersData();

  return (
    <CustomersErrorBoundary>
      <CustomersLayout
        customers={customers}
        // React 19: Pass server-side timestamp for cache invalidation
        serverTimestamp={Date.now()}
      />
    </CustomersErrorBoundary>
  );
}
