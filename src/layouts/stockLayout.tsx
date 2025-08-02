'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import { FaEdit, FaHistory, FaTrash } from 'react-icons/fa';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import {
  createStock,
  updateStock,
  getStockHistory,
  deleteStock,
} from '@/actions/stockActions';
import { ICategory, IDropdownOption, IStock } from '../../interfaces';
import { getSeries } from '@/models/getSeries';
import { convertDate } from '@/utils/convertTime';

const Dropdown = dynamic(() => import('@/components/dropdown'));
const Tabs = dynamic(() => import('@/components/tabs'));

interface BatteryDetails {
  name: string;
  plate: string | number | null;
  ah: number;
  type?: string;
}

interface StockBatteryData {
  series: string;
  productCost: string | number;
  inStock: string | number;
  updatedDate?: string;
  batteryDetails?: BatteryDetails;
  soldCount?: number;
  brandName: string; // Make this required
}

interface StockData {
  id?: number; // Make id optional since it's not always needed
  brandName: string;
  seriesStock: StockBatteryData[];
}

interface ApiResponse {
  message?: string;
  error?: string;
}

interface StockLayoutProps {
  categories: ICategory[];
  stock: {
    id: number;
    brandName: string;
    seriesStock: StockBatteryData[];
  }[];
}

interface SeriesOption extends IDropdownOption {
  batteryDetails?: BatteryDetails;
}

interface EditData {
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
}

interface FormStockData {
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
  batteryDetails?: BatteryDetails;
}

interface DeleteStockParams {
  brandName: string;
  series: string;
}

const StockLayout: React.FC<StockLayoutProps> = ({ categories, stock }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('');
  const [editModalData, setEditModalData] = useState<EditData>({
    brandName: '',
    series: '',
    productCost: '',
    inStock: '',
  });
  const [tableData, setTableData] = useState<StockBatteryData[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stockData, setStockData] = useState<FormStockData>({
    brandName: '',
    series: '',
    productCost: '',
    inStock: '',
    batteryDetails: undefined,
  });
  const [stockCost, setStockCost] = useState(0);
  const [currentBrandName, setCurrentBrandName] = useState<string>('');
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any | null>(
    null
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<{
    brandName: string;
    series: string;
    seriesName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
      if (window.confirm('Are you sure you want to delete this stock?')) {
        setIsDeleting(true);
        try {
          const result = await deleteStock(brandName, item.series);

          if (result.success) {
            toast.success('Stock deleted successfully');
            await revalidatePathCustom('/stock');
            fetchData(brandName);
          } else {
            toast.error(result.error || 'Failed to delete stock');
          }
        } catch (error) {
          console.error('Error deleting stock:', error);
          toast.error('An error occurred while deleting stock');
        } finally {
          setIsDeleting(false);
        }
      }
    },
    []
  );

  const handleViewStockHistory = useCallback(
    async (brandName: string, series?: string) => {
      if (!brandName) return;
      try {
        setIsLoadingHistory(true);
        const result = await getStockHistory(brandName, series);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch stock history');
        }

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid stock history data received');
        }

        setStockHistory(result.data);
        setIsHistoryModalOpen(true);
      } catch (error) {
        console.error('Error fetching stock history:', error);
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

  const columns = React.useMemo<ColumnDef<StockBatteryData>[]>(
    () => [
      {
        accessorKey: 'series',
        header: 'Series',
        cell: ({ row }) => {
          const batteryDetails = row.original.batteryDetails;
          return batteryDetails ? (
            <div>
              <div>{batteryDetails.name}</div>
              <div className='text-xs text-gray-500'>
                {batteryDetails.plate} plates, {batteryDetails.ah}AH
                {batteryDetails.type && `, ${batteryDetails.type}`}
              </div>
            </div>
          ) : (
            row.original.series
          );
        },
      },
      {
        accessorKey: 'productCost',
        header: 'Product Cost',
        cell: ({ row }) =>
          `Rs ${Number(row.original.productCost).toLocaleString()}`,
      },
      {
        accessorKey: 'inStock',
        header: 'In Stock',
        cell: ({ row }) => Number(row.original.inStock).toLocaleString(),
      },
      {
        accessorKey: 'soldCount',
        header: 'Sold Count',
        cell: ({ row }) => Number(row.original.soldCount || 0).toLocaleString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(row.original, currentBrandName);
              }}
              className='p-2 text-blue-600 transition-colors hover:text-blue-800'
              title='Edit Stock'
            >
              <FaEdit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewStockHistory(currentBrandName, row.original.series);
              }}
              className='p-2 text-gray-600 transition-colors hover:text-gray-800'
              title='View History'
            >
              <FaHistory size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.original, currentBrandName);
              }}
              className='p-2 text-red-600 transition-colors hover:text-red-800'
              title='Delete Stock'
            >
              <FaTrash size={16} />
            </button>
          </div>
        ),
      },
    ],
    [
      currentBrandName,
      handleEditClick,
      handleDeleteClick,
      handleViewStockHistory,
    ]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);

      const result = await createStock({
        brandName: stockData.brandName,
        series: stockData.series,
        productCost: stockData.productCost,
        inStock: stockData.inStock,
      });

      if (result.success) {
        toast.success('Stock added successfully');
        await revalidatePathCustom('/stock');
        setIsModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error posting data:', error);
      toast.error('Failed to add stock');
    } finally {
      setIsLoading(false);
    }
  };

  function replaceInArray(
    arr: StockBatteryData[],
    obj: StockBatteryData
  ): StockBatteryData[] {
    return arr?.map((item) => {
      if (item.series === obj.series) {
        return {
          ...obj,
          series: obj.series,
          productCost: obj.productCost,
          inStock: obj.inStock,
          updatedDate: obj.updatedDate,
        };
      }
      return item;
    });
  }

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      console.log('Edit modal data:', editModalData);

      if (!editModalData || !editModalData.series) {
        throw new Error('Invalid edit data');
      }

      const result = await updateStock({
        brandName: editModalData.brandName,
        series: editModalData.series,
        productCost: editModalData.productCost,
        inStock: editModalData.inStock,
      });

      console.log('Update result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update stock');
      }

      // Refetch all stock data to get the latest updates
      await revalidatePathCustom('/stock');
      setEditModalData({
        brandName: '',
        series: '',
        productCost: '',
        inStock: '',
      });
      setIsModalOpen(false);
      setModalType('');
      toast.success('Stock updated successfully');

      // Refresh the current view
      if (editModalData.brandName === currentBrandName) {
        fetchData(currentBrandName);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update stock'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStockData((prevStock) => ({ ...prevStock, [name]: value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditModalData((prevStock) => ({
      ...prevStock,
      [name]: value,
    }));
  };

  const handleSelectSeriesOption = (option: SeriesOption) => {
    if (modalType === 'add') {
      setStockData((prevStock) => ({
        ...prevStock,
        series: option.value,
        batteryDetails: option.batteryDetails,
      }));
    } else {
      setEditModalData((prevStock) => ({
        ...prevStock,
        series: option.value,
      }));
    }
  };

  const fetchData = useCallback(
    async (brandName: string) => {
      console.log('fetchData called with brandName:', brandName);
      const category = categories.find((cat) => cat.brandName === brandName);
      console.log('category found:', category);
      if (category) {
        // Cast the series to BatteryDetails[] since we know the structure
        const seriesArray = category.series as unknown as BatteryDetails[];
        const seriesOptions = seriesArray.map((battery) => {
          // Handle null/undefined plate values
          const plateDisplay = battery.plate ? battery.plate : 'N/A';
          const label = `${battery.name} (${plateDisplay}, ${battery.ah}AH${battery.type ? `, ${battery.type}` : ''})`;

          return {
            label,
            value: battery.name,
            batteryDetails: {
              name: battery.name,
              plate: battery.plate || 'N/A',
              ah: battery.ah,
              type: battery.type,
            },
          };
        });
        console.log('seriesOptions created:', seriesOptions);
        setSeriesOptions(seriesOptions);
      }
    },
    [categories]
  );

  const transformStockData = (
    stockItem: StockBatteryData,
    categoryData: ICategory,
    index: number
  ): StockBatteryData => {
    // Type guard function to check if an object is a BatteryDetails
    const isBatteryDetails = (obj: any): obj is BatteryDetails => {
      return (
        obj &&
        typeof obj === 'object' &&
        'name' in obj &&
        'plate' in obj &&
        'ah' in obj
      );
    };

    const series = categoryData.series.find(
      (s) => isBatteryDetails(s) && s.name === stockItem.series
    );

    return {
      ...stockItem,
      batteryDetails: isBatteryDetails(series) ? series : undefined,
      updatedDate: stockItem.updatedDate || new Date().toISOString(),
    };
  };

  useEffect(() => {
    console.log('useEffect triggered with categories:', categories);
    console.log('Current stock data:', stock);

    if (categories.length > 0) {
      const firstCategoryBrandName = categories[0].brandName || '';
      console.log('First category brand name:', firstCategoryBrandName);

      // If no currentBrandName is set, initialize with first category
      if (!currentBrandName) {
        console.log(
          'No current brand name set, initializing with first category'
        );
        setCurrentBrandName(firstCategoryBrandName);
      }

      // Initialize stock for the current category if it doesn't exist
      if (!stock || stock.length === 0) {
        console.log('No stock data exists, initializing current category');
        if (currentBrandName) {
          fetchData(currentBrandName);
          setStockData({
            brandName: currentBrandName,
            series: '',
            productCost: '',
            inStock: '',
            batteryDetails: undefined,
          });
        }
        setTableData([]);
        return;
      }

      const filteredStock = stock?.filter(
        (item) => item.brandName === currentBrandName
      );
      console.log('Filtered stock for current brand:', filteredStock);

      if (filteredStock && filteredStock.length > 0 && currentBrandName) {
        const category = categories.find(
          (cat) => cat.brandName === currentBrandName
        );
        const newData = filteredStock[0].seriesStock?.map(
          (item: StockBatteryData, index: number) =>
            transformStockData(item, category || categories[0], index)
        );

        const totalAmount = filteredStock[0]?.seriesStock?.reduce(
          (acc: number, current: StockBatteryData) => {
            return acc + Number(current.productCost) * Number(current.inStock);
          },
          0
        );

        setStockCost(totalAmount);
        fetchData(currentBrandName);
        setStockData({
          brandName: currentBrandName,
          series: '',
          productCost: '',
          inStock: '',
          batteryDetails: undefined,
        });
        setTableData(newData || []);
      } else {
        console.log('No filtered stock found for current category');
        if (currentBrandName) {
          fetchData(currentBrandName);
          setStockData({
            brandName: currentBrandName,
            series: '',
            productCost: '',
            inStock: '',
            batteryDetails: undefined,
          });
        }
        setTableData([]);
      }
    } else {
      console.log('No categories available');
      setTableData([]);
    }
  }, [categories, fetchData, stock, currentBrandName]);

  // Effect to handle modal data initialization
  useEffect(() => {
    if (isModalOpen && modalType === 'edit' && editModalData.brandName) {
      fetchData(editModalData.brandName);
    }
  }, [isModalOpen, modalType, editModalData.brandName, fetchData]);

  const handleTabClick = (id: number, brandName: string) => {
    setCurrentBrandName(brandName);
    const filtered = stock?.filter((item) => item.brandName === brandName);

    // Reset table data and stock cost by default
    setTableData([]);
    setStockCost(0);

    // Only set data if we have stock for this brand
    if (filtered && filtered.length > 0) {
      const transformedData = filtered[0].seriesStock.map((item, index) => {
        const category = categories.find((c) => c.brandName === brandName);
        return category ? transformStockData(item, category, index) : item;
      });
      setTableData(transformedData);

      // Calculate total cost for this brand
      const totalAmount = filtered[0].seriesStock.reduce(
        (acc: number, current: StockBatteryData) => {
          return acc + Number(current.productCost) * Number(current.inStock);
        },
        0
      );
      setStockCost(totalAmount);
    }
  };

  const findSeriesOption = (series: string): SeriesOption | undefined => {
    return seriesOptions.find((option) => option.label === series);
  };

  return (
    <div className='min-h-screen bg-gray-50 pt-14 sm:bg-white sm:pt-0'>
      {/* Mobile Header */}
      <div className='fixed left-0 right-0 top-0 z-10 h-14 bg-white px-4 py-2 shadow-sm sm:hidden'>
        <div className='flex h-full items-center justify-between'>
          {/* Left side - Menu icon positioned to align with content below */}
          <div className='flex min-w-0 flex-1 items-center gap-0'></div>

          {/* Center - Title */}
          <div className='absolute left-1/2 -translate-x-1/2 transform'>
            <h1 className='text-base font-semibold text-gray-900'>Stock</h1>
          </div>

          {/* Right side - Add Stock button */}
          <button
            onClick={() => {
              fetchData(currentBrandName);
              setStockData({
                brandName: currentBrandName,
                series: '',
                productCost: '',
                inStock: '',
                batteryDetails: undefined,
              });
              setModalType('add');
              setIsModalOpen(true);
            }}
            className='flex-shrink-0 touch-manipulation rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600'
          >
            Add Stock
          </button>
        </div>
      </div>

      {/* Desktop/Tablet Header */}
      <div className='hidden p-4 sm:block sm:p-6 lg:p-8'>
        <div className='flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl'>
            Stock
          </h1>
        </div>
      </div>

      {/* Main Content Container */}
      <div className='px-4 pb-4 sm:px-6 lg:px-8'>
        {/* Tabs Section - Mobile Optimized */}
        <div className='mb-4 rounded-lg bg-white shadow-sm sm:mb-6 sm:rounded-none sm:bg-transparent sm:shadow-none'>
          <div className='p-4 sm:p-0'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='-mx-4 flex-1 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
                <Tabs
                  tabs={categories.map((category, index) => ({
                    id: index,
                    label: category.brandName || '',
                    content: null,
                  }))}
                  onTabClick={handleTabClick}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Summary Card - Mobile */}
        <div className='mb-4 rounded-lg bg-white p-4 shadow-sm sm:hidden'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500'>Total Stock Cost</p>
              <p className='text-lg font-semibold text-gray-900'>
                PKR {stockCost?.toLocaleString()}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-500'>Items</p>
              <p className='text-lg font-semibold text-gray-900'>
                {tableData?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Data Grid Section - Mobile Optimized */}
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

          {/* Mobile List View */}
          <div className='sm:hidden'>
            {tableData && tableData.length > 0 ? (
              <div className='divide-y divide-gray-200'>
                {tableData.map((row, index) => (
                  <div key={index} className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <h3 className='text-sm font-medium text-gray-900'>
                          {row.series}
                        </h3>
                        <div className='mt-1 flex items-center gap-4 text-xs text-gray-500'>
                          <span>Stock: {row.inStock}</span>
                          <span>
                            Cost: PKR {row.productCost?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => {
                            // Handle edit functionality
                            setEditModalData({
                              brandName: currentBrandName,
                              series: row.series,
                              productCost: String(row.productCost),
                              inStock: String(row.inStock),
                            });
                            setModalType('edit');
                            setIsModalOpen(true);
                          }}
                          className='touch-manipulation rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200'
                        >
                          <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            handleViewStockHistory(currentBrandName, row.series)
                          }
                          className='touch-manipulation rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200'
                          title='View History'
                        >
                          <FaHistory className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(row, currentBrandName)
                          }
                          className='touch-manipulation rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200'
                          title='Delete Stock'
                        >
                          <FaTrash className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-8 text-center'>
                <div className='mb-2 text-gray-400'>
                  <svg
                    className='mx-auto h-12 w-12'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1}
                      d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                    />
                  </svg>
                </div>
                <h3 className='mb-1 text-sm font-medium text-gray-900'>
                  No stock items
                </h3>
                <p className='text-sm text-gray-500'>
                  Get started by adding your first stock item.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Data Grid */}
          <div className='hidden sm:block'>
            <Table
              data={tableData}
              columns={columns}
              enableSearch={true}
              searchPlaceholder='Search stock...'
              stockCost={stockCost}
              buttonTitle='Create Stock'
              showButton={true}
              buttonOnClick={() => {
                fetchData(currentBrandName);
                setStockData({
                  brandName: currentBrandName,
                  series: '',
                  productCost: '',
                  inStock: '',
                  batteryDetails: undefined,
                });
                setModalType('add');
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal - Mobile Optimized */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditModalData({
            brandName: '',
            series: '',
            productCost: '',
            inStock: '',
          });
          setStockData({
            brandName: '',
            series: '',
            productCost: '',
            inStock: '',
            batteryDetails: undefined,
          });
          setModalType('');
        }}
        title={modalType === 'add' ? 'Add Stock' : 'Edit Stock'}
        dialogPanelClass='w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 sm:mx-auto'
      >
        <form
          onSubmit={modalType === 'add' ? handleSubmit : handleSubmitEdit}
          className='space-y-4'
        >
          <div className='flex w-full flex-col gap-4'>
            {/* Series Dropdown - Mobile Optimized */}
            <div className='w-full'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Select Series
              </label>
              <div
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className='relative w-full'
              >
                <Dropdown
                  className='w-full'
                  options={seriesOptions}
                  onSelect={handleSelectSeriesOption}
                  placeholder='Select Series'
                  required={modalType === 'add' && !stockData.series}
                  defaultValue={
                    modalType === 'edit' ? editModalData.series : undefined
                  }
                  disabled={modalType === 'edit'}
                />
              </div>
            </div>

            {/* Cost Input - Enhanced for Mobile */}
            <div className='w-full'>
              <Input
                type='number'
                label='Cost Per Product'
                name='productCost'
                value={
                  modalType === 'add'
                    ? stockData.productCost || ''
                    : editModalData.productCost || ''
                }
                onChange={modalType === 'add' ? handleChange : handleEditChange}
                required={modalType === 'add'}
                className='h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-blue-500 focus:shadow-none focus:outline-none focus:ring-0'
                style={{ outline: 'none', boxShadow: 'none' }}
                inputMode='decimal'
                placeholder='0.00'
              />
            </div>

            {/* Quantity Input - Enhanced for Mobile */}
            <div className='w-full'>
              <Input
                type='number'
                label='Quantity'
                name='inStock'
                value={
                  modalType === 'add'
                    ? stockData.inStock || ''
                    : editModalData.inStock || ''
                }
                onChange={modalType === 'add' ? handleChange : handleEditChange}
                required={modalType === 'add'}
                className='h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-blue-500 focus:shadow-none focus:outline-none focus:ring-0'
                style={{ outline: 'none', boxShadow: 'none' }}
                inputMode='numeric'
                placeholder='0'
                min='0'
                step='1'
              />
            </div>

            {/* Action Buttons - Mobile First */}
            <div className='flex w-full flex-col gap-3 pt-4'>
              <Button
                className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
                variant='fill'
                text={modalType === 'add' ? 'Add Stock' : 'Update Stock'}
                type='submit'
                isPending={isLoading}
                disabled={isLoading}
              />
              <Button
                className='h-12 w-full text-base focus:outline-none focus:ring-0'
                variant='outline'
                text='Cancel'
                type='button'
                onClick={() => {
                  setIsModalOpen(false);
                  setEditModalData({
                    brandName: '',
                    series: '',
                    productCost: '',
                    inStock: '',
                  });
                  setStockData({
                    brandName: '',
                    series: '',
                    productCost: '',
                    inStock: '',
                    batteryDetails: undefined,
                  });
                  setModalType('');
                }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Stock History Modal */}
      <Modal
        size='large'
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedHistoryEntry(null);
        }}
        title='Stock History'
      >
        <div className='max-h-[80vh] overflow-y-auto'>
          {isLoadingHistory ? (
            <div className='flex items-center justify-center py-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
            </div>
          ) : stockHistory.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>
              No stock history available
            </div>
          ) : (
            <div className='space-y-4'>
              {!selectedHistoryEntry ? (
                // History List View
                <div className='grid gap-4'>
                  {stockHistory.map((entry, index) => (
                    <div
                      key={index}
                      className='cursor-pointer rounded-lg border p-4 hover:bg-gray-50'
                      onClick={() => setSelectedHistoryEntry(entry)}
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-medium'>
                            {entry.brandName} - {entry.series}
                          </h3>
                          <div className='mt-1 text-sm text-gray-500'>
                            <span className='mr-4'>
                              Quantity: {entry.oldQuantity} →{' '}
                              {entry.newQuantity} (
                              {entry.quantityDifference > 0 ? '+' : ''}
                              {entry.quantityDifference})
                            </span>
                            <span>
                              Cost: Rs {entry.oldCost} → Rs {entry.newCost} (
                              {entry.costDifference > 0 ? '+' : ''}Rs{' '}
                              {entry.costDifference})
                            </span>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm text-gray-600'>
                            {new Date(entry.historyDate).toLocaleDateString()}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {new Date(entry.historyDate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Historical Data Detail View
                <div>
                  <button
                    onClick={() => setSelectedHistoryEntry(null)}
                    className='mb-4 flex items-center gap-1 text-blue-600 hover:text-blue-800'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                    Back to History List
                  </button>

                  <div className='mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4'>
                    <div className='flex'>
                      <div className='flex-shrink-0'>
                        <svg
                          className='h-5 w-5 text-yellow-400'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                      <div className='ml-3'>
                        <p className='text-sm text-yellow-700'>
                          This is a historical view from{' '}
                          {new Date(
                            selectedHistoryEntry.historyDate
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Render the series-level history detail */}
                  <div className='rounded-lg bg-white p-4 shadow'>
                    <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                      <div>
                        <span className='text-sm text-gray-500'>Brand</span>
                        <p className='font-medium text-gray-900'>
                          {selectedHistoryEntry.brandName}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm text-gray-500'>Series</span>
                        <p className='font-medium text-gray-900'>
                          {selectedHistoryEntry.series}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm text-gray-500'>
                          Quantity Change
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='text-red-600'>
                            {selectedHistoryEntry.oldQuantity}
                          </span>
                          <span>→</span>
                          <span className='font-medium text-green-600'>
                            {selectedHistoryEntry.newQuantity}
                          </span>
                          <span
                            className={`rounded px-2 py-1 text-xs ${
                              selectedHistoryEntry.quantityDifference > 0
                                ? 'bg-green-100 text-green-800'
                                : selectedHistoryEntry.quantityDifference < 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {selectedHistoryEntry.quantityDifference > 0
                              ? '+'
                              : ''}
                            {selectedHistoryEntry.quantityDifference}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className='text-sm text-gray-500'>
                          Cost Change
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='text-red-600'>
                            Rs {selectedHistoryEntry.oldCost}
                          </span>
                          <span>→</span>
                          <span className='font-medium text-green-600'>
                            Rs {selectedHistoryEntry.newCost}
                          </span>
                          <span
                            className={`rounded px-2 py-1 text-xs ${
                              selectedHistoryEntry.costDifference > 0
                                ? 'bg-green-100 text-green-800'
                                : selectedHistoryEntry.costDifference < 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {selectedHistoryEntry.costDifference > 0 ? '+' : ''}
                            Rs {selectedHistoryEntry.costDifference}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteItem(null);
        }}
        title='Delete Stock'
        dialogPanelClass='w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto'
      >
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
              <FaTrash className='h-8 w-8 text-red-600' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              Delete Stock Item
            </h3>
            <p className='text-sm text-gray-500'>
              Are you sure you want to delete this stock item? This action
              cannot be undone.
            </p>
          </div>

          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
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
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3 pt-4'>
            <Button
              className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
              variant='fill'
              text='Delete Stock'
              onClick={() => {
                setIsDeleting(true);
                if (deleteItem?.brandName && deleteItem?.series) {
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
                    .catch((error) => {
                      console.error('Error deleting stock:', error);
                      toast.error('An error occurred while deleting stock');
                    })
                    .finally(() => {
                      setIsDeleting(false);
                    });
                }
              }}
              isPending={isDeleting}
              disabled={isDeleting}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            />
            <Button
              className='h-12 w-full text-base focus:outline-none focus:ring-0'
              variant='outline'
              text='Cancel'
              type='button'
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteItem(null);
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StockLayout;
