import StockClient from './StockClient';
import StockErrorBoundary from '@/components/stock/StockErrorBoundary';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time stock data
export const revalidate = 0; // React 19: No caching for latest stock information

export default function Stock() {
  return (
    <StockErrorBoundary>
      <StockClient />
    </StockErrorBoundary>
  );
}
