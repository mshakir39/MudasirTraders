'use client';

import React, { useCallback, useEffect, useState, useOptimistic } from 'react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAtom, useSetAtom } from 'jotai';
import Button from '@/components/button';

import { revalidatePathAction } from '../../actions/revalidatePath';
import {
  EditData,
  FormStockData,
  SeriesOption,
  StockBatteryData,
  StockLayoutProps,
} from '@/interfaces';
import { useTabOrder } from '@/utils/hooks/useTabOrder';
import { useStockColumns } from '@/utils/hooks/useStockColumns';
import { transformStockData, calculateStockCost } from '@/utils/stockUtils';
import { stockAtom, fetchStockAtom, setStockAtom, stockLoadingAtom, stockErrorAtom, categoriesAtom } from '@/store/sharedAtoms';
import { DraggableTabs } from '@/components/stock/DraggableTabs';
import { MobileStockList } from '@/components/stock/MobileStockList';
import { StockFormModal } from '@/components/stock/StockFormModal';
import { StockHistoryModal } from '@/components/stock/StockHistoryModal';
import { DeleteConfirmModal } from '@/components/stock/DeleteConfirmModal';

const Table = dynamic(() => import('@/components/table'));

const EMPTY_FORM_STOCK: FormStockData = {
  brandName: '',
  series: '',
  productCost: '',
  inStock: '',
  batteryDetails: undefined,
};

const EMPTY_EDIT_DATA: EditData = {
  brandName: '',
  series: '',
  productCost: '',
  inStock: '',
};

const StockLayout: React.FC<StockLayoutProps> = ({ categories: propCategories }) => {
  // Use global state for categories (pre-loaded by GlobalDataProvider)
  const [categories] = useAtom(categoriesAtom);
  const {
    orderedCategories,
    setOrderedCategories,
    currentBrandName,
    setCurrentBrandName,
  } = useTabOrder(categories);

  // Use Jotai atoms for stock data (pre-loaded by GlobalDataProvider)
  const [stock, setStock] = useAtom(stockAtom);
  const fetchStock = useSetAtom(fetchStockAtom);
  const updateGlobalStock = useSetAtom(setStockAtom);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | ''>('');
  const [editModalData, setEditModalData] = useState<EditData>(EMPTY_EDIT_DATA);
  const [tableData, setTableData] = useState<StockBatteryData[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [formData, setFormData] = useState<FormStockData>(EMPTY_FORM_STOCK);
  const [stockCost, setStockCost] = useState(0);
  const [showStockCost, setShowStockCost] = useState(false);

  // History modal
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Delete single
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    brandName: string;
    series: string;
    seriesName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete all
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Optimistic updates
  const [optimisticStock, addOptimisticStock] = useOptimistic(
    stock,
    (state, action: any) => {
      if (action.type === 'delete') {
        return state.filter(
          (item) =>
            !(
              item.brandName === action.brandName &&
              item.seriesStock.some((s: any) => s.series === action.series)
            )
        );
      }
      if (action.type === 'add') return [...state, action.data];
      if (action.type === 'update') {
        return state.map((item) =>
          item.brandName === action.brandName
            ? {
                ...item,
                seriesStock: item.seriesStock.map((s: any) =>
                  s.series === action.series ? action.data : s
                ),
              }
            : item
        );
      }
      return state;
    }
  );

  // Populate series options for current brand
  const fetchData = useCallback(
    (brandName: string) => {
      const category = categories.find((cat) => cat.brandName === brandName);
      if (!category) return;
      const options: SeriesOption[] = (category.series as any[]).map(
        (battery) => ({
          label: `${battery.name} (${battery.plate ?? 'N/A'}, ${battery.ah}AH${battery.type ? `, ${battery.type}` : ''})`,
          value: battery.name,
          batteryDetails: {
            name: battery.name,
            plate: battery.plate || 'N/A',
            ah: battery.ah,
            type: battery.type,
          },
        })
      );
      setSeriesOptions(options);
    },
    [categories]
  );

  // Sync table data when brand or stock changes
  useEffect(() => {
    if (!currentBrandName || orderedCategories.length === 0) return;

    const filtered = (optimisticStock || stock).filter(
      (item) => item.brandName === currentBrandName
    );

    if (filtered.length > 0) {
      const category = categories.find((c) => c.brandName === currentBrandName);
      const transformed = filtered[0].seriesStock.map(
        (item: StockBatteryData, idx: number) =>
          category ? transformStockData(item, category, idx) : item
      );
      setTableData(transformed);
      setStockCost(calculateStockCost(filtered[0].seriesStock));
    } else {
      fetchData(currentBrandName);
      setTableData([]);
      setStockCost(0);
    }
  }, [stock, currentBrandName, orderedCategories, categories, optimisticStock, fetchData]);

  // Open edit modal pre-fills series options
  useEffect(() => {
    if (isModalOpen && modalType === 'edit' && editModalData.brandName) {
      fetchData(editModalData.brandName);
    }
  }, [isModalOpen, modalType, editModalData.brandName, fetchData]);

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditModalData(EMPTY_EDIT_DATA);
    setFormData(EMPTY_FORM_STOCK);
    setModalType('');
  };

  const openAddModal = () => {
    fetchData(currentBrandName);
    setFormData({ ...EMPTY_FORM_STOCK, brandName: currentBrandName });
    setModalType('add');
    setIsModalOpen(true);
  };

  const handleTabClick = (brandName: string) => {
    setCurrentBrandName(brandName);
  };

  // --- CRUD handlers ---
  const handleSubmitAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/stock/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create', 
          data: {
            brandName: formData.brandName,
            series: formData.series,
            productCost: formData.productCost,
            inStock: formData.inStock,
          }
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Stock added successfully');
        await revalidatePathAction('/stock');
        closeFormModal();
        // Refresh global stock state instead of reloading page
        await fetchStock();
      } else {
        toast.error(result.error || 'Failed to add stock');
      }
    } catch {
      toast.error('Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!editModalData.series) throw new Error('Invalid edit data');
      const response = await fetch('/api/stock/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update', 
          data: {
            brandName: editModalData.brandName,
            series: editModalData.series,
            productCost: editModalData.productCost,
            inStock: editModalData.inStock,
          }
        }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to update stock');

      await revalidatePathAction('/stock');
      closeFormModal();
      toast.success('Stock updated successfully');
      // Refresh global stock state instead of just fetching local data
      await fetchStock();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update stock'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = useCallback(
    (item: StockBatteryData, brandName: string) => {
      setEditModalData({
        brandName,
        series: item.series,
        productCost: item.productCost.toString(),
        inStock: item.inStock.toString(),
      });
      setModalType('edit');
      setIsModalOpen(true);
    },
    []
  );

  const handleDeleteClick = useCallback(
    async (item: StockBatteryData, brandName: string) => {
      if (!window.confirm('Are you sure you want to delete this stock?'))
        return;
      setIsDeleting(true);
      try {
        addOptimisticStock({ type: 'delete', brandName, series: item.series });
        const response = await fetch('/api/stock/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'delete', 
            data: { brandName, series: item.series }
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success('Stock deleted successfully');
          await revalidatePathAction('/stock');
          await fetchStock();
        } else {
          toast.error(result.error || 'Failed to delete stock');
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete stock'
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [addOptimisticStock, fetchStock]
  );

  const handleViewHistory = useCallback(
    async (brandName: string, series?: string) => {
      console.log('🔍 handleViewHistory called with:', { brandName, series });
      
      if (!brandName) {
        console.log('❌ No brandName provided to handleViewHistory');
        return;
      }
      
      setIsLoadingHistory(true);
      try {
        // Build query parameters
        const params = new URLSearchParams({ brandName });
        if (series) params.append('series', series);
        
        const url = `/api/stock/actions?${params.toString()}`;
        console.log('🌐 Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        const result = await response.json();
        console.log('📋 Response result:', result);
        
        if (!result.success || !Array.isArray(result.data)) {
          console.log('❌ Invalid response:', result);
          throw new Error(result.error || 'Failed to fetch history');
        }
        
        setStockHistory(result.data);
        setIsHistoryModalOpen(true);
      } catch (error) {
        console.error('❌ handleViewHistory error:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to fetch stock history'
        );
      } finally {
        setIsLoadingHistory(false);
      }
    },
    []
  );

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const response = await fetch('/api/stock/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'deleteAllBrand', 
          data: { brandName: currentBrandName }
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Successfully deleted all stock for ${currentBrandName}`);
        await revalidatePathAction('/stock');
        setIsDeleteAllModalOpen(false);
        // Refresh global stock state instead of just fetching local data
        await fetchStock();
      } else {
        toast.error(result.error || 'Failed to delete all stock');
      }
    } catch {
      toast.error('An error occurred while deleting stock');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const columns = useStockColumns({
    currentBrandName,
    categories,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onHistory: handleViewHistory,
  });

  return (
    <div className='min-h-screen p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Stock</h1>
        <Button
          variant='fill'
          text='Add Stock'
          onClick={openAddModal}
        />
      </div>

      {/* Tabs */}
      <div className='mb-4 rounded-lg bg-white shadow-sm sm:mb-6 sm:rounded-none sm:bg-transparent sm:shadow-none'>
        <div className='p-4 sm:p-0'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='-mx-4 flex-1 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
              <DraggableTabs
                categories={orderedCategories}
                currentBrandName={currentBrandName}
                onTabClick={handleTabClick}
                onReorder={setOrderedCategories}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className='rounded-lg bg-white shadow-sm sm:rounded-none sm:bg-transparent sm:shadow-none'>
        {/* Mobile Search */}
        <div className='flex flex-col space-y-3 border-b border-secondary-200 p-4 sm:hidden'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Search stock...'
              className='w-full rounded-lg border border-secondary-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
            />
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <svg
                className='h-4 w-4 text-secondary-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
          </div>
          {!loading && stockCost > 0 && (
            <button
              onClick={() => setShowStockCost(!showStockCost)}
              className='whitespace-nowrap font-bold text-gray-500 transition-colors hover:text-gray-700 text-sm'
              title={showStockCost ? 'Hide Stock Cost' : 'Show Stock Cost'}
            >
              Total Stock Cost:{' '}
              {showStockCost
                ? Math.round(stockCost).toLocaleString()
                : '•••••••'}
            </button>
          )}
        </div>

        {/* Mobile List */}
        <div className='sm:hidden'>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-600">Loading stock data...</p>
              </div>
            </div>
          ) : (
            <MobileStockList
              tableData={tableData}
              currentBrandName={currentBrandName}
              onEdit={(row: any) => handleEditClick(row, currentBrandName)}
              onHistory={handleViewHistory}
              onDelete={(row: any) => handleDeleteClick(row, currentBrandName)}
            />
          )}
        </div>

        {/* Desktop Table */}
        <div className='hidden sm:block'>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-600">Loading stock data...</p>
              </div>
            </div>
          ) : (
            <Table
              data={tableData}
              columns={columns as any}
              enableSearch={true}
              searchPlaceholder='Search stock...'
              stockCost={stockCost}
              defaultShowStockCost={false}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <StockFormModal
        isOpen={isModalOpen}
        modalType={modalType}
        stockData={formData}
        editModalData={editModalData}
        seriesOptions={seriesOptions}
        isLoading={loading}
        onClose={closeFormModal}
        onSubmitAdd={handleSubmitAdd}
        onSubmitEdit={handleSubmitEdit}
        onChangeAdd={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
          setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        }
        onChangeEdit={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
          setEditModalData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        }
        onSeriesChange={(value) => {
          if (modalType === 'add') {
            setFormData((prev) => ({ ...prev, series: value }));
          } else {
            setEditModalData((prev) => ({ ...prev, series: value }));
          }
        }}
      />

      {/* History Modal */}
      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        isLoading={isLoadingHistory}
        stockHistory={stockHistory}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Delete Single Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        title='Delete Stock'
        description='Are you sure you want to delete this stock item? This action cannot be undone.'
        warningContent={
          <>
            <h4 className='text-sm font-medium text-red-800'>
              Stock Item to Delete
            </h4>
            <div className='mt-2 text-sm text-red-700'>
              <p>
                <strong>Brand:</strong> {deleteItem?.brandName}
              </p>
              <p>
                <strong>Series:</strong> {deleteItem?.seriesName}
              </p>
            </div>
          </>
        }
        confirmText='Delete Stock'
        onConfirm={async () => {
          if (!deleteItem) return;
          setIsDeleting(true);
          try {
            const response = await fetch('/api/stock/actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'delete', 
                data: { brandName: deleteItem.brandName, series: deleteItem.series }
              }),
            });
            const result = await response.json();
            if (result.success) {
              toast.success('Stock deleted successfully');
              await revalidatePathAction('/stock');
              setIsDeleteModalOpen(false);
              setDeleteItem(null);
              fetchData(deleteItem.brandName);
            } else {
              toast.error(result.error || 'Failed to delete stock');
            }
          } catch {
            toast.error('An error occurred while deleting stock');
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteItem(null);
        }}
      />

      {/* Delete All Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteAllModalOpen}
        isDeleting={isDeletingAll}
        title='Delete All Stock'
        description={
          <>
            Are you sure you want to delete all stock items for{' '}
            <strong>{currentBrandName}</strong>? This will permanently remove{' '}
            {tableData.length} item{tableData.length !== 1 ? 's' : ''} and
            cannot be undone.
          </>
        }
        warningContent={
          <>
            <h4 className='text-sm font-medium text-red-800'>
              Warning: Permanent Action
            </h4>
            <div className='mt-2 text-sm text-red-700'>
              <p>
                <strong>Brand:</strong> {currentBrandName}
              </p>
              <p>
                <strong>Total Items:</strong> {tableData.length}
              </p>
              {showStockCost && (
                <p>
                  <strong>Total Cost:</strong> PKR {stockCost?.toLocaleString()}
                </p>
              )}
              <button
                onClick={() => setShowStockCost(!showStockCost)}
                className='mt-1 p-1 text-gray-500 transition-colors hover:text-gray-700'
                title={showStockCost ? 'Hide Stock Cost' : 'Show Stock Cost'}
              >
                {showStockCost ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </>
        }
        confirmText={`Delete All ${tableData.length} Item${tableData.length !== 1 ? 's' : ''}`}
        onConfirm={handleDeleteAll}
        onClose={() => setIsDeleteAllModalOpen(false)}
      />
    </div>
  );
};

export default StockLayout;
