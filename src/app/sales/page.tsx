import { getSales } from '@/getData/getSales';
import SalesLayout from '@/layouts/salesLayout';



export default async function SalesPage() {
  const sales = await getSales();
  return <SalesLayout sales={sales} />;
} 