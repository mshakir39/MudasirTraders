import { Metadata } from 'next';
import CustomersLayout from '@/layouts/customersLayout';
import { getCustomers } from '@/getData/getCustomers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
