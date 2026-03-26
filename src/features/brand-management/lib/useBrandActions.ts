// src/features/brand-management/lib/useBrandActions.ts
// Brand management actions and state management

'use client';

import { useCallback, useOptimistic } from 'react';
import { toast } from 'react-toastify';
import { Brand, BrandCreateRequest, BrandDeleteRequest } from '@/features/brand-management/entities/brand/model/types';

export interface UseBrandActionsProps {
  brands: Brand[];
  onBrandsChange: (brands: Brand[]) => void;
  onRefreshBrands: () => Promise<void>;
}

export const useBrandActions = ({
  brands,
  onBrandsChange,
  onRefreshBrands,
}: UseBrandActionsProps) => {
  // Optimistic updates for brand creation
  const [optimisticBrands, addOptimisticBrand] = useOptimistic(
    brands,
    (state, newBrand: Brand) => [
      ...state,
      { ...newBrand, id: `temp-${Date.now()}` },
    ]
  );

  const createBrand = useCallback(async (data: BrandCreateRequest) => {
    try {
      // Add optimistic update
      addOptimisticBrand({ brandName: data.brandName } as Brand);

      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brandName: data.brandName.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Brand created successfully');
        await onRefreshBrands(); // Refresh store after create
        return { success: true };
      } else {
        toast.error(result.error || 'Failed to create brand');
        return { error: result.error || 'Failed to create brand' };
      }
    } catch (error) {
      toast.error('An error occurred while creating the brand');
      return { error: 'An error occurred while creating the brand' };
    }
  }, [addOptimisticBrand, onRefreshBrands]);

  const deleteBrand = useCallback(async (id: string) => {
    if (!id) {
      toast.error('Cannot delete brand: ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const response = await fetch('/api/brands', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Brand deleted successfully');
        await onRefreshBrands(); // Refresh store after delete
      } else {
        toast.error(result.error || 'Failed to delete brand');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the brand');
    }
  }, [onRefreshBrands]);

  return {
    optimisticBrands,
    createBrand,
    deleteBrand,
  };
};
