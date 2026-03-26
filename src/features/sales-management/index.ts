// src/features/sales-management/index.ts
// Public API for sales management feature

export * from './entities/sales/model/types';
export * from './lib/useSalesActions';
export * from './shared/ui/components/SalesDataGrid';
export * from './shared/ui/components/ProductDetailModal';
export { SalesManagement } from './ui/SalesManagement';
export { SalesManagement as default } from './ui/SalesManagement';
