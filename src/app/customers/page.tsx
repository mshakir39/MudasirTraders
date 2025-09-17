import { Metadata } from 'next';
import CustomersLayout from '@/layouts/customersLayout';
import { getCustomers } from '@/getData/getCustomers';

export const dynamic = 'auto';
export const revalidate = 60; // Cache for 1 minute

export const metadata: Metadata = {
  title: 'Customers | PowerHub',
  description: 'Manage your customers and their information',
};

export default async function CustomersPage() {
  try {
    const customers = await getCustomers();
    return (
      <CustomersLayout customers={Array.isArray(customers) ? customers : []} />
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Return empty customers array if fetch fails during build
    return (
      <CustomersLayout customers={[]} />
    );
  }
}
