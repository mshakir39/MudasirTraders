'use client';
import { useDashboardAutoLock } from '@/utils/hooks/useDashboardAutoLock';

interface DashboardAutoLockWrapperProps {
  children: React.ReactNode;
}

const DashboardAutoLockWrapper: React.FC<DashboardAutoLockWrapperProps> = ({ children }) => {
  useDashboardAutoLock();
  
  return <>{children}</>;
};

export default DashboardAutoLockWrapper; 