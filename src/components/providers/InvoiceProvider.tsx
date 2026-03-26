// src/components/providers/InvoiceProvider.tsx
// Invoice provider (now simplified since Jotai Provider is in root)

'use client';

import { ReactNode } from 'react';

interface InvoiceProviderProps {
  children: ReactNode;
}

export const InvoiceProvider: React.FC<InvoiceProviderProps> = ({
  children,
}) => {
  return <>{children}</>;
};

// Export a shared provider for all Jotai state management
export const JotaiProvider = InvoiceProvider;
