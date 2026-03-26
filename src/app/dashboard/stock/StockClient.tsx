// src/app/dashboard/stock/StockClient.tsx
// Client component that uses global state for stock management

'use client';

import StockLayout from '@/layouts/stockLayout';
import StockErrorBoundary from '@/components/stock/StockErrorBoundary';
import { JotaiProvider } from '@/components/providers/InvoiceProvider';

export default function StockClient() {
  return (
    <JotaiProvider>
      <StockErrorBoundary>
        <StockLayout categories={[]} />
      </StockErrorBoundary>
    </JotaiProvider>
  );
}
