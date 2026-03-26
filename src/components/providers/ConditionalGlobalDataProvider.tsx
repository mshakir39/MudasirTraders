// src/components/providers/ConditionalGlobalDataProvider.tsx
// Only wraps children with GlobalDataProvider on dashboard routes

'use client';

import { usePathname } from 'next/navigation';
import { GlobalDataProvider } from './GlobalDataProvider';

interface ConditionalGlobalDataProviderProps {
  children: React.ReactNode;
}

export default function ConditionalGlobalDataProvider({
  children,
}: ConditionalGlobalDataProviderProps) {
  const pathname = usePathname();

  // Only provide GlobalDataProvider for dashboard routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  return isDashboardRoute ? (
    <GlobalDataProvider>{children}</GlobalDataProvider>
  ) : (
    <>{children}</>
  );
}
