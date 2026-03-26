// src/features/sales-management/lib/useSalesActions.ts
// Sales business logic and actions

import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { Sale, SalesFilters } from '@/features/sales-management/entities/sales/model/types';

export interface UseSalesActionsProps {
  sales: Sale[];
  onSalesChange?: (sales: Sale[]) => void;
  onRefreshSales?: () => Promise<void>;
}

export const useSalesActions = ({
  sales,
  onSalesChange,
  onRefreshSales,
}: UseSalesActionsProps) => {
  const deleteSale = useCallback(
    async (saleId: string) => {
      try {
        const response = await fetch('/api/sales', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: saleId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete sale');
        }

        toast.success('Sale deleted successfully');
        
        // Refresh sales data
        if (onRefreshSales) {
          await onRefreshSales();
        }
      } catch (error) {
        toast.error('Failed to delete sale');
        throw error;
      }
    },
    [onRefreshSales]
  );

  const updateSale = useCallback(
    async (saleId: string, data: Partial<Sale>) => {
      try {
        const response = await fetch(`/api/sales/${saleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update sale');
        }

        toast.success('Sale updated successfully');
        
        // Refresh sales data
        if (onRefreshSales) {
          await onRefreshSales();
        }
      } catch (error) {
        toast.error('Failed to update sale');
        throw error;
      }
    },
    [onRefreshSales]
  );

  const createSale = useCallback(
    async (data: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to create sale');
        }

        const result = await response.json();
        toast.success('Sale created successfully');
        
        // Refresh sales data
        if (onRefreshSales) {
          await onRefreshSales();
        }

        return result.data;
      } catch (error) {
        toast.error('Failed to create sale');
        throw error;
      }
    },
    [onRefreshSales]
  );

  const applyFilters = useCallback(
    async (filters: SalesFilters) => {
      try {
        const response = await fetch('/api/sales/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters),
        });

        if (!response.ok) {
          throw new Error('Failed to apply filters');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        toast.error('Failed to apply filters');
        throw error;
      }
    },
    []
  );

  return {
    deleteSale,
    updateSale,
    createSale,
    applyFilters,
  };
};
