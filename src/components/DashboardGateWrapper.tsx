'use client';
import { useDashboardGate } from '@/utils/hooks/useDashboardGate';

const DashboardGateWrapper = ({ children }: { children: React.ReactNode }) => {
  useDashboardGate();
  return <>{children}</>;
};

export default DashboardGateWrapper; 