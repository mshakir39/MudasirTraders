'use client';

import React, { useCallback, useEffect, useState, useOptimistic } from 'react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import {
  createStock,
  updateStock,
  getStockHistory,
  deleteStock,
  deleteAllBrandStock,
} from '@/actions/stockActions';
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

const StockLayout: React.FC<StockLayoutProps> = ({ categories, stock }) => {
  const {
    orderedCategories,
    setOrderedCategories,
    currentBrandName,
    setCurrentBrandName,
  } = useTabOrder(categories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | ''>('');
  const [editModalData, setEditModalData] = useState<EditData>(EMPTY_EDIT_DATA);
  const [tableData, setTableData] = useState<StockBatteryData[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<FormStockData>(EMPTY_FORM_STOCK);
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
  }, [
    currentBrandName,
    orderedCategories,
    optimisticStock,
    stock,
    categories,
    fetchData,
  ]);

  // Open edit modal pre-fills series options
  useEffect(() => {
    if (isModalOpen && modalType === 'edit' && editModalData.brandName) {
      fetchData(editModalData.brandName);
    }
  }, [isModalOpen, modalType, editModalData.brandName, fetchData]);

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditModalData(EMPTY_EDIT_DATA);
    setStockData(EMPTY_FORM_STOCK);
    setModalType('');
  };

  const openAddModal = () => {
    fetchData(currentBrandName);
    setStockData({ ...EMPTY_FORM_STOCK, brandName: currentBrandName });
    setModalType('add');
    setIsModalOpen(true);
  };

  const handleTabClick = (brandName: string) => {
    setCurrentBrandName(brandName);
  };

  // --- CRUD handlers ---
  const handleSubmitAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await createStock({
        brandName: stockData.brandName,
        series: stockData.series,
        productCost: stockData.productCost,
        inStock: stockData.inStock,
      });
      if (result.success) {
        toast.success('Stock added successfully');
        await revalidatePathCustom('/stock');
        closeFormModal();
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to add stock');
      }
    } catch {
      toast.error('Failed to add stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!editModalData.series) throw new Error('Invalid edit data');
      const result = await updateStock({
        brandName: editModalData.brandName,
        series: editModalData.series,
        productCost: editModalData.productCost,
        inStock: editModalData.inStock,
      });
      if (!result.success)
        throw new Error(result.error || 'Failed to update stock');

      await revalidatePathCustom('/stock');
      closeFormModal();
      toast.success('Stock updated successfully');
      fetchData(currentBrandName);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update stock'
      );
    } finally {
      setIsLoading(false);
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
        const result = await deleteStock(brandName, item.series);
        if (result.success) {
          toast.success('Stock deleted successfully');
          await revalidatePathCustom('/stock');
          window.location.reload();
        } else {
          toast.error(result.error || 'Failed to delete stock');
        }
      } catch {
        toast.error('An error occurred while deleting stock');
      } finally {
        setIsDeleting(false);
      }
    },
    [addOptimisticStock]
  );

  const handleViewHistory = useCallback(
    async (brandName: string, series?: string) => {
      if (!brandName) return;
      setIsLoadingHistory(true);
      try {
        const result = await getStockHistory(brandName, series);
        if (!result.success || !Array.isArray(result.data))
          throw new Error(result.error || 'Failed to fetch history');
        setStockHistory(result.data);
        setIsHistoryModalOpen(true);
      } catch (error) {
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
      const result = await deleteAllBrandStock(currentBrandName);
      if (result.success) {
        toast.success(`Successfully deleted all stock for ${currentBrandName}`);
        await revalidatePathCustom('/stock');
        setIsDeleteAllModalOpen(false);
        fetchData(currentBrandName);
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
    <div className='min-h-screen pt-14 sm:pt-0'>
      {/* Mobile Header */}
      <div className='fixed left-0 right-0 top-0 z-10 h-14 bg-white px-4 py-2 shadow-sm sm:hidden'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex min-w-0 flex-1 items-center gap-0' />
          <div className='absolute left-1/2 -translate-x-1/2 transform'>
            <h1 className='text-base font-semibold text-gray-900'>Stock</h1>
          </div>
          <button
            onClick={openAddModal}
            className='flex-shrink-0 touch-manipulation rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600'
          >
            Add Stock
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className='hidden p-4 sm:block sm:p-6 lg:p-8'>
        <div className='flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl'>
            Stock
          </h1>
        </div>
      </div>

      <div className='px-4 pb-4 sm:px-6 lg:px-8'>
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
          <div className='border-b border-gray-200 p-4 sm:hidden'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search stock...'
                className='w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              />
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <svg
                  className='h-4 w-4 text-gray-400'
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
          </div>

          {/* Mobile List */}
          <div className='sm:hidden'>
            <MobileStockList
              tableData={tableData}
              currentBrandName={currentBrandName}
              onEdit={(row: any) => handleEditClick(row, currentBrandName)}
              onHistory={handleViewHistory}
              onDelete={(row: any) => handleDeleteClick(row, currentBrandName)}
            />
          </div>

          {/* Desktop Table */}
          <div className='hidden sm:block'>
            <Table
              data={tableData}
              columns={columns as any}
              enableSearch={true}
              searchPlaceholder='Search stock...'
              stockCost={stockCost}
              buttonTitle='Create Stock'
              showButton={true}
              extraGlobalSearchText={(row) => {
                const parts: string[] = [];
                const series = (row as any)?.series ?? '';
                const bd = (row as any)?.batteryDetails ?? {};
                const plate = String(bd?.plate ?? '').trim();
                const ah = bd?.ah ? String(bd.ah) : '';
                const name = bd?.name ? String(bd.name) : '';

                if (series) parts.push(String(series));
                if (name) parts.push(name);
                if (ah) parts.push(`${ah}ah`, `${ah} ah`);
                if (plate) {
                  const n = plate.replace(/\s+/g, '');
                  parts.push(
                    `${plate}p`,
                    `${plate} p`,
                    `${plate} plate`,
                    `${plate} plates`,
                    `${plate}-plate`,
                    `${plate}-plates`,
                    `${n}p`,
                    `${n} p`,
                    `${n} plate`,
                    `${n} plates`
                  );
                }
                return parts.filter(Boolean).join(' ');
              }}
              customGlobalFilter={(row, searchText, query) => {
                const m = query.match(
                  /^(\s*)(\d{1,3})(\s*)(p|pl|pla|plat|plate|plates)?/
                );
                if (m) {
                  const numStr = m[2];
                  const hasPlateWord = !!m[4];
                  if (hasPlateWord) {
                    const bd = (row.original as any)?.batteryDetails ?? {};
                    const plateNum = Number(
                      String(bd?.plate).replace(/[^0-9]/g, '')
                    );
                    const qNum = Number(numStr);
                    if (!isNaN(plateNum) && !isNaN(qNum))
                      return plateNum === qNum;
                    return false;
                  }
                }
                return searchText.includes(query);
              }}
              buttonOnClick={openAddModal}
              secondaryButtonTitle='Delete All Stock'
              showSecondaryButton={tableData.length > 0}
              secondaryButtonOnClick={() => setIsDeleteAllModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <StockFormModal
        isOpen={isModalOpen}
        modalType={modalType}
        stockData={stockData}
        editModalData={editModalData}
        seriesOptions={seriesOptions}
        isLoading={isLoading}
        onClose={closeFormModal}
        onSubmitAdd={handleSubmitAdd}
        onSubmitEdit={handleSubmitEdit}
        onChangeAdd={(
          e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) =>
          setStockData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        }
        onChangeEdit={(
          e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) =>
          setEditModalData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }))
        }
        onSeriesChange={(value) =>
          setStockData((prev) => ({ ...prev, series: value }))
        }
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
        onConfirm={() => {
          if (!deleteItem) return;
          setIsDeleting(true);
          deleteStock(deleteItem.brandName, deleteItem.series)
            .then(async (result) => {
              if (result.success) {
                toast.success('Stock deleted successfully');
                await revalidatePathCustom('/stock');
                setIsDeleteModalOpen(false);
                setDeleteItem(null);
                fetchData(deleteItem.brandName);
              } else {
                toast.error(result.error || 'Failed to delete stock');
              }
            })
            .catch(() => toast.error('An error occurred while deleting stock'))
            .finally(() => setIsDeleting(false));
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
