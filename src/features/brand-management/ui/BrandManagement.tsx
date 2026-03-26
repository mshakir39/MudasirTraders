// src/features/brand-management/ui/BrandManagement.tsx
// Main brand management component

'use client';

import React, { useState, useCallback } from 'react';
import { unstable_noStore } from 'next/cache';
import { useAtom } from 'jotai';
import { Brand } from '@/features/brand-management/entities/brand/model/types';
import { brandsAtom, fetchBrandsAtom } from '@/store/sharedAtoms';
import { useBrandActions } from '@/features/brand-management/lib/useBrandActions';
import { BrandTable } from '@/features/brand-management/shared/ui/components/BrandTable';
import { BrandCreateModal } from '@/features/brand-management/shared/ui/components/BrandCreateModal';

interface BrandManagementProps {
  initialBrands?: Brand[];
  serverTimestamp?: number;
}

export const BrandManagement: React.FC<BrandManagementProps> = ({
  initialBrands,
}) => {
  unstable_noStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [brands, setBrands] = useAtom(brandsAtom);
  const fetchBrands = useAtom(fetchBrandsAtom)[1];

  // Data is pre-loaded by GlobalDataProvider, no individual fetching needed

  const handleRefreshBrands = useCallback(async () => {
    await fetchBrands();
  }, [fetchBrands]);

  const { optimisticBrands, createBrand, deleteBrand } = useBrandActions({
    brands,
    onBrandsChange: setBrands,
    onRefreshBrands: handleRefreshBrands,
  });

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCreateBrand = useCallback(
    async (data: { brandName: string }) => {
      await createBrand(data);
      handleCloseModal();
    },
    [createBrand, handleCloseModal]
  );

  return (
    <div className='p-0 py-6 md:p-6'>
      <h1 className='mb-6 text-2xl font-bold'>Brands</h1>

      <BrandTable
        brands={optimisticBrands}
        onDeleteBrand={deleteBrand}
        onAddBrand={handleOpenModal}
        className='mb-6'
      />

      <BrandCreateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateBrand}
        isLoading={false}
      />
    </div>
  );
};
