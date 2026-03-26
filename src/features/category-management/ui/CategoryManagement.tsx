// src/features/category-management/ui/CategoryManagement.tsx
// Main category management component

'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useOptimistic,
  useActionState,
} from 'react';
import { unstable_noStore } from 'next/cache';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { CategoryWithBatteryData, BatteryData } from '@/types/category';
import { categoriesAtom, fetchCategoriesAtom } from '@/store/sharedAtoms';
import { useCategoryActions } from '@/features/category-management/lib/useCategoryActions';
import { CategoryTable } from '@/features/category-management/shared/ui/components/CategoryTable';
import { BatteryList } from '@/features/category-management';
import { revalidatePathAction } from '../../../../actions/revalidatePath';
import { IBatterySeries, IBrand, ICategory } from '@/interfaces';
import PdfUploadModal from '@/features/category-management/shared/ui/components/PdfUploadModal';
import Modal from '@/components/modal';
import Button from '@/components/button';

interface CategoryManagementProps {
  initialCategories?: CategoryWithBatteryData[];
  initialBrands?: IBrand[];
  className?: string;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  initialCategories,
  initialBrands = [],
  className = '',
}) => {
  unstable_noStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<CategoryWithBatteryData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBattery, setEditingBattery] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: number }>(
    {}
  );
  const [globalSalesTax, setGlobalSalesTax] = useState<string>('0');
  const [isEditingGlobalSalesTax, setIsEditingGlobalSalesTax] =
    useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [brands, setBrands] = useState<IBrand[]>(initialBrands);

  // Global state management
  const [categories, setCategories] = useAtom(categoriesAtom);
  const fetchCategories = useAtom(fetchCategoriesAtom)[1];

  // React 19: Optimistic updates for category operations
  const [optimisticCategories, addOptimisticCategory] = useOptimistic(
    categories,
    (state, newCategory: any) => {
      if (newCategory.action === 'delete') {
        return state.filter((cat) => cat.id !== newCategory.id);
      }
      if (newCategory.action === 'add') {
        return [...state, { ...newCategory.data, id: `temp-${Date.now()}` }];
      }
      if (newCategory.action === 'update') {
        return state.map((cat) =>
          cat.id === newCategory.id ? { ...cat, ...newCategory.data } : cat
        );
      }
      return state;
    }
  );

  // React 19: useActionState for category creation
  const [createCategoryState, createCategoryAction, isCreatePending] =
    useActionState(async (prevState: any, formData: FormData) => {
      const brandName = formData.get('brandName') as string;
      const salesTax = formData.get('salesTax') as string;

      if (!brandName?.trim()) {
        toast.error('Brand name is required');
        return { error: 'Brand name is required' };
      }

      try {
        // Add optimistic update
        const newCategory = {
          brandName: brandName.trim(),
          salesTax: parseFloat(salesTax) || 18,
          series: [],
          createdAt: new Date(),
        };
        addOptimisticCategory({ action: 'add', data: newCategory });

        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: brandName.trim(),
            salesTax: parseFloat(salesTax) || 18,
            series: [], // Empty array of IBatterySeries for new category
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create category');
        }

        toast.success('Category created successfully');
        await fetchCategories();
        setIsModalOpen(false);
        return { success: true };
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create category'
        );
        return {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create category',
        };
      }
    }, null);

  // Memoized values
  const brandOptions = React.useMemo(
    () =>
      brands
        .filter((brand) => brand.id) // Filter out brands without IDs
        .map((brand) => ({
          label: brand.brandName,
          value: brand.id as string, // We know id exists because of the filter
        })),
    [brands]
  );

  // Data is pre-loaded by GlobalDataProvider, but fetch if empty
  React.useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchCategories();
    }
  }, [categories, fetchCategories]);

  const handleRefreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const handlePdfUploadSuccess = useCallback(
    async (data: {
      brandName: string;
      series: any[];
      salesTax: string;
      batteryType: 'battery' | 'tonic';
    }) => {
      try {
        setIsLoading(true);

        // Handle Battery Tonic data - use selected brand
        let finalBrandName = data.brandName;
        let finalSeries = data.series;
        let finalSalesTax = Number(data.salesTax);

        if (data.batteryType === 'tonic') {
          // Handle "Other" brand option for Battery Tonic
          if (data.brandName === 'other') {
            finalBrandName = 'Other';
          }
          finalSalesTax = 0; // Battery Tonic doesn't have sales tax

          // Ensure all series have batteryType set for Battery Tonic
          finalSeries = data.series.map((series: any) => ({
            ...series,
            batteryType: 'tonic',
            name: series.name || 'Battery Tonic',
          }));
        }

        // Check if category already exists for the final brand
        const existingCategory = categories.find(
          (cat) => cat.brandName === finalBrandName
        );

        const categoryData: Omit<ICategory, 'id'> = {
          brandName: finalBrandName,
          series: finalSeries,
          salesTax: finalSalesTax,
        };

        if (existingCategory && existingCategory.id) {
          // Smart merge: Add new products, update existing ones, keep old ones
          console.log('Before merge:', {
            existingCount: existingCategory.series?.length || 0,
            newCount: finalSeries.length,
            existingProducts: existingCategory.series?.map((s: any) => s.name),
            newProducts: finalSeries.map((s: any) => s.name),
          });

          // Create a map of existing products by name for quick lookup
          const existingProductsMap = new Map(
            existingCategory.series?.map((product: any) => [
              product.name,
              product,
            ]) || []
          );

          // Merge logic:
          // 1. Keep all existing products (preserve references)
          // 2. Add new products from JSON that don't exist
          // 3. Update existing products with new data from JSON
          const mergedSeries = [...(existingCategory.series || [])];

          let newProductsAdded = 0;
          let existingProductsUpdated = 0;

          finalSeries.forEach((newProduct) => {
            const existingProduct = existingProductsMap.get(newProduct.name);

            if (existingProduct) {
              // Update existing product with new data
              const existingIndex = mergedSeries.findIndex(
                (p) => p.name === newProduct.name
              );
              if (existingIndex !== -1) {
                mergedSeries[existingIndex] = {
                  ...existingProduct, // Keep existing fields
                  ...newProduct, // Override with new data
                };
                existingProductsUpdated++;
              }
            } else {
              // Add new product
              mergedSeries.push(newProduct);
              newProductsAdded++;
            }
          });

          // Update category with merged series
          const response = await fetch('/api/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingCategory.id,
              brandName: finalBrandName,
              series: mergedSeries,
              salesTax: finalSalesTax,
            }),
          });
          const result = await response.json();

          if (!result.success) {
            throw new Error(
              result.error || 'Failed to merge series into category'
            );
          }

          console.log('After merge:', {
            resultCount: result.data?.series?.length || 0,
            newProductsAdded,
            existingProductsUpdated,
            totalProducts: mergedSeries.length,
          });

          toast.success(
            `Merged ${finalBrandName} category: ${newProductsAdded} new products added, ${existingProductsUpdated} products updated, ${mergedSeries.length} total products`
          );
        } else if (!existingCategory) {
          // Create new category
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData),
          });
          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'Failed to create category');
          }

          toast.success(
            `Created new category for ${finalBrandName} with ${finalSeries.length} series`
          );
        } else {
          throw new Error('Category is missing an id');
        }

        // Call revalidatePath and wait for it to complete
        await revalidatePathAction('/category');
        await fetchCategories(); // Refresh the categories list
        setIsLoading(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to save category from PDF'
        );
        setIsLoading(false);
      }
    },
    [categories, fetchCategories]
  );

  const {
    createCategory,
    updateCategory,
    deleteCategory,
    updateBatteryPrice,
    deleteBattery,
    updateGlobalSalesTax,
  } = useCategoryActions({
    categories,
    onCategoriesChange: setCategories,
    onRefreshCategories: handleRefreshCategories,
  });

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return optimisticCategories;

    const lowerSearchQuery = searchQuery.toLowerCase();
    return optimisticCategories.filter(
      (category) =>
        category.brandName.toLowerCase().includes(lowerSearchQuery) ||
        category.series.some(
          (battery: any) =>
            (battery.name || '').toLowerCase().includes(lowerSearchQuery) ||
            (battery.warrentyCode || '')
              .toLowerCase()
              .includes(lowerSearchQuery)
        )
    );
  }, [optimisticCategories, searchQuery]);

  const handleViewDetails = useCallback((category: any) => {
    setDetailData(category);
    setGlobalSalesTax(String(category.salesTax || 0));
  }, []);

  const handleEditCategory = useCallback((category: any) => {
    // TODO: Implement edit modal
    toast.info('Edit category functionality coming soon');
  }, []);

  const handleDeleteCategory = useCallback(
    async (category: any) => {
      await deleteCategory(category.id);
      if (detailData?.id === category.id) {
        setDetailData(null);
      }
    },
    [deleteCategory, detailData]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePriceChange = useCallback((batteryId: string, price: string) => {
    const numPrice = parseFloat(price) || 0;
    setEditingPrice((prev) => ({ ...prev, [batteryId]: numPrice }));
  }, []);

  const handleSavePrice = useCallback(
    async (batteryId: string) => {
      const price = editingPrice[batteryId];
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      if (detailData) {
        await updateBatteryPrice(detailData.id, batteryId, price);
        setEditingBattery(null);
        setEditingPrice((prev) => {
          const newState = { ...prev };
          delete newState[batteryId];
          return newState;
        });
      }
    },
    [updateBatteryPrice, editingPrice, detailData]
  );

  const handleEditGlobalSalesTax = useCallback(() => {
    // This will be handled by the input change
  }, []);

  const handleSaveGlobalSalesTax = useCallback(async () => {
    if (detailData) {
      const tax = parseFloat(globalSalesTax);
      await updateGlobalSalesTax(detailData.id, tax);
      setGlobalSalesTax(globalSalesTax);
      setIsEditingGlobalSalesTax(false);
      await revalidatePathAction('/category');
    }
  }, [updateGlobalSalesTax, detailData, globalSalesTax]);

  const handleDeleteBattery = useCallback(
    async (batteryId: string) => {
      if (detailData) {
        await deleteBattery(detailData.id, batteryId);
      }
    },
    [deleteBattery, detailData]
  );

  return (
    <div className={`p-0 py-6 md:p-6 ${className}`}>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Categories</h1>
        <div className='flex gap-2'>
          <Button
            variant='fill'
            text='Upload PDF'
            onClick={() => setIsPdfModalOpen(true)}
          />
        </div>
      </div>

      {/* Category Table */}
      <CategoryTable
        categories={filteredCategories}
        onViewDetails={handleViewDetails}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        isLoading={isLoading}
        className='mb-6'
      />

      {/* Category Details Modal */}
      <Modal
        size='large'
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
        title={detailData?.brandName || 'Category Details'}
      >
        {detailData && (
          <BatteryList
            detailData={detailData}
            searchQuery={searchQuery}
            editingBattery={editingBattery}
            editingPrice={editingPrice}
            globalSalesTax={globalSalesTax}
            isEditingGlobalSalesTax={isEditingGlobalSalesTax}
            isLoading={isLoading}
            onSearchChange={handleSearchChange}
            onPriceChange={handlePriceChange}
            onSavePrice={handleSavePrice}
            setEditingBattery={setEditingBattery}
            setEditingPrice={setEditingPrice}
            setIsEditingGlobalSalesTax={setIsEditingGlobalSalesTax}
            setGlobalSalesTax={setGlobalSalesTax}
            onSaveGlobalSalesTax={handleSaveGlobalSalesTax}
            onDeleteBattery={handleDeleteBattery}
          />
        )}
      </Modal>

      {/* PDF Upload Modal */}
      <PdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSuccess={handlePdfUploadSuccess}
        brands={brandOptions}
        categories={categories}
      />

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-full max-w-md rounded-lg bg-white p-6'>
            <h2 className='mb-4 text-xl font-bold'>Add New Category</h2>
            <form action={createCategoryAction} className='space-y-4'>
              <div>
                <label
                  htmlFor='brandName'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Brand Name
                </label>
                <input
                  type='text'
                  id='brandName'
                  name='brandName'
                  required
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter brand name'
                />
              </div>
              <div>
                <label
                  htmlFor='salesTax'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Sales Tax (%)
                </label>
                <input
                  type='number'
                  id='salesTax'
                  name='salesTax'
                  defaultValue='18'
                  step='0.1'
                  min='0'
                  max='100'
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter sales tax percentage'
                />
              </div>
              <div className='flex gap-3 pt-4'>
                <button
                  type='submit'
                  disabled={isCreatePending}
                  className='flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isCreatePending ? 'Creating...' : 'Create Category'}
                </button>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='flex-1 rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
