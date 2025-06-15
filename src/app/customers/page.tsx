import CustomersLayout from '@/layouts/customersLayout';
import { getCustomers } from '@/getData/getCustomers';

export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomersLayout customers={customers} />;
} 