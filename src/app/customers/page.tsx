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
  const customers = await getCustomers();
  return (
    <CustomersLayout customers={Array.isArray(customers) ? customers : []} />
  );
}
