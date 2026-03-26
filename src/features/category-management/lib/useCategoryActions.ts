// src/features/category-management/lib/useCategoryActions.ts
// Category management actions and state management

'use client';

import { useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  CategoryWithBatteryData,
  CategoryFormData,
} from '@/features/category-management/entities/category/model/types';

export interface UseCategoryActionsProps {
  categories: CategoryWithBatteryData[];
  onCategoriesChange: (categories: CategoryWithBatteryData[]) => void;
  onRefreshCategories: () => Promise<void>;
}

export const useCategoryActions = ({
  categories,
  onCategoriesChange,
  onRefreshCategories,
}: UseCategoryActionsProps) => {
  const createCategory = useCallback(
    async (data: CategoryFormData) => {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Category created successfully');
          await onRefreshCategories();
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to create category');
          return { error: result.error || 'Failed to create category' };
        }
      } catch (error) {
        toast.error('An error occurred while creating the category');
        return { error: 'An error occurred while creating the category' };
      }
    },
    [onRefreshCategories]
  );

  const updateCategory = useCallback(
    async (categoryId: string, data: Partial<CategoryFormData>) => {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Category updated successfully');
          await onRefreshCategories();
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to update category');
          return { error: result.error || 'Failed to update category' };
        }
      } catch (error) {
        toast.error('An error occurred while updating the category');
        return { error: 'An error occurred while updating the category' };
      }
    },
    [onRefreshCategories]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (!confirm('Are you sure you want to delete this category?')) return;

      try {
        const response = await fetch('/api/categories', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: categoryId }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Category deleted successfully');
          await onRefreshCategories();
        } else {
          toast.error(result.error || 'Failed to delete category');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the category');
      }
    },
    [onRefreshCategories]
  );

  const updateBatteryPrice = useCallback(
    async (categoryId: string, batteryId: string, price: number) => {
      try {
        const response = await fetch(
          `/api/categories/${categoryId}/battery/${batteryId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productPrice: price }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast.success('Battery price updated successfully');
          await onRefreshCategories();
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to update battery price');
          return { error: result.error || 'Failed to update battery price' };
        }
      } catch (error) {
        toast.error('An error occurred while updating the battery price');
        return { error: 'An error occurred while updating the battery price' };
      }
    },
    [onRefreshCategories]
  );

  const deleteBattery = useCallback(
    async (categoryId: string, batteryId: string) => {
      if (!confirm('Are you sure you want to delete this battery?')) return;

      try {
        const response = await fetch(
          `/api/categories/${categoryId}/battery/${batteryId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast.success('Battery deleted successfully');
          await onRefreshCategories();
        } else {
          toast.error(result.error || 'Failed to delete battery');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the battery');
      }
    },
    [onRefreshCategories]
  );

  const updateGlobalSalesTax = useCallback(
    async (categoryId: string, tax: number) => {
      try {
        const response = await fetch(
          `/api/categories/${categoryId}/sales-tax`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ salesTax: tax }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast.success('Sales tax updated successfully');
          await onRefreshCategories();
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to update sales tax');
          return { error: result.error || 'Failed to update sales tax' };
        }
      } catch (error) {
        toast.error('An error occurred while updating the sales tax');
        return { error: 'An error occurred while updating the sales tax' };
      }
    },
    [onRefreshCategories]
  );

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    updateBatteryPrice,
    deleteBattery,
    updateGlobalSalesTax,
  };
};
