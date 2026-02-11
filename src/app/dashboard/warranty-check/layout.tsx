import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Warranty Check | Mudasir Traders',
  description: 'Check warranty status for your products',
};

export default function WarrantyCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
