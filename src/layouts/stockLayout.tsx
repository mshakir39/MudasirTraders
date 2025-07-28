'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

// const Table = dynamic(() => import('@/components/table'));
const Dropdown = dynamic(() => import('@/components/dropdown'));
const Tabs = dynamic(() => import('@/components/tabs'));

// Import components directly instead of using dynamic import
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';

import arrayStringToArrayObject from '@/utils/arrayStringToArrayObject';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { createStock, updateStock, getStockHistory, deleteStock } from '@/actions/stockActions';
import { ICategory, IDropdownOption, IStock } from '../../interfaces';
import { getSeries } from '@/models/getSeries';
import { FaEdit, FaHistory, FaTrash } from 'react-icons/fa';
import { convertDate } from '@/utils/convertTime';
import DataGridDemo from '@/components/dataGrid';

interface BatteryDetails {
  name: string;
  plate: string | number | null;
  ah: number;
  type?: string;
}

interface StockBatteryData {
  brandName: string;
  series: string;
  productCost: number;
  inStock: number;
  updatedDate: string;
  batteryDetails?: BatteryDetails;
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
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<{ brandName: string; series: string; seriesName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const gridColumns = [
    {
      field: 'series',
      headerName: 'Series',
      width: 250,
      renderCell: (item: { row: StockBatteryData }) => {
        const details = item.row.batteryDetails;
        if (details) {
          const plateDisplay = details.plate ? details.plate : 'N/A';
          return `${details.name} (${plateDisplay}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`;
        }
        return item.row.series;
      },
    },
    {
      field: 'inStock',
      headerName: 'InStock',
      width: 120,
    },
    {
      field: 'productCost',
      headerName: 'Cost/Item',
      width: 150,
      renderCell: (item: { row: StockBatteryData }) => {
        return 'Rs ' + item.row.productCost;
      },
    },
    {
      field: 'updatedDate',
      headerName: 'Updated Date',
      width: 180,
      renderCell: (item: { row: StockBatteryData }) => {
        const { dateTime } = convertDate(item.row.updatedDate || '');
        return <span>{dateTime}</span>;
      },
    },
    {
      field: 'totalCost',
      headerName: 'Total Cost',
      width: 150,
      renderCell: (item: { row: StockBatteryData }) =>
        'Rs ' + Number(item.row.productCost) * Number(item.row.inStock),
    },
    {
      field: 'edit',
      headerName: '',
      width: 80,
      renderCell: (item: { row: StockBatteryData }) => (
        <div className='flex h-full w-full items-center justify-start'>
          <FaEdit
            className='cursor-pointer text-[#5b4eea]'
            onClick={() => handleEditClick(item.row, currentBrandName)}
          />
        </div>
      ),
    },
    {
      field: 'history',
      headerName: '',
      width: 80,
      renderCell: (item: { row: StockBatteryData }) => (
        <div className='flex h-full w-full items-center justify-start'>
          <FaHistory
            className='cursor-pointer text-blue-600 hover:text-blue-800'
            onClick={() => handleViewStockHistory(currentBrandName, item.row.series)}
            title="View History"
          />
        </div>
      ),
    },
    {
      field: 'delete',
      headerName: '',
      width: 80,
      renderCell: (item: { row: StockBatteryData }) => (
        <div className='flex h-full w-full items-center justify-start'>
          <FaTrash
            className='cursor-pointer text-red-600 hover:text-red-800'
            onClick={() => handleDeleteClick(item.row, currentBrandName)}
            title="Delete Stock"
          />
        </div>
      ),
    },
  ];

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
      if (!editModalData || !editModalData.series) {
        throw new Error('Invalid edit data');
      }
      const filtered = stock?.filter(
        (item) => item.brandName === editModalData.brandName
      );

      if (!filtered || filtered.length === 0) {
        throw new Error('Stock data not found');
      }

      const updatedStock = filtered[0].seriesStock.map((item) =>
        item.series === editModalData.series
          ? {
              ...item,
              productCost: Number(editModalData.productCost),
              inStock: Number(editModalData.inStock),
              updatedDate: new Date().toISOString(),
            }
          : item
      );

      const result = await updateStock({
        brandName: editModalData.brandName,
        series: editModalData.series,
        productCost: editModalData.productCost,
        inStock: editModalData.inStock,
      });

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
      toast.success('Stock updated successfully');
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

  const handleEditClick = (item: StockBatteryData, brandName: string) => {
    setEditModalData({
      brandName,
      series: item.series,
      productCost: String(item.productCost),
      inStock: String(item.inStock),
    });
    fetchData(brandName);
    setIsModalOpen(true);
    setModalType('edit');
  };

  useEffect(() => {
    console.log('useEffect triggered with categories:', categories);
    console.log('Current stock data:', stock);

    if (categories.length > 0) {
      const firstCategoryBrandName = categories[0].brandName || '';
      console.log('First category brand name:', firstCategoryBrandName);

      // If no currentBrandName is set, initialize with first category
      if (!currentBrandName) {
        console.log('No current brand name set, initializing with first category');
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
        const category = categories.find((cat) => cat.brandName === currentBrandName);
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

  const handleViewStockHistory = async (brandName: string, series?: string) => {
    if (!brandName) return;
    try {
      setIsLoadingHistory(true);
      const result = await getStockHistory(brandName, series);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stock history');
      }
      
      // Ensure the data exists and has the correct shape
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid stock history data received');
      }
      
      setStockHistory(result.data);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch stock history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteClick = (item: StockBatteryData, brandName: string) => {
    setDeleteItem({
      brandName,
      series: item.series,
      seriesName: item.batteryDetails?.name || item.series
    });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStock = async () => {
    if (!deleteItem) return;
    
    try {
      setIsDeleting(true);
      const result = await deleteStock(deleteItem.brandName, deleteItem.series);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete stock');
      }
      
      toast.success('Stock deleted successfully');
      await revalidatePathCustom('/stock');
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete stock');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 sm:bg-white pt-14 sm:pt-0'>
      {/* Mobile Header */}
      <div className='fixed top-0 left-0 right-0 bg-white px-4 py-2 shadow-sm sm:hidden z-10 h-14'>
        <div className='flex items-center justify-between h-full'>
          {/* Left side - Menu icon positioned to align with content below */}
          <div className='flex items-center gap-0 flex-1 min-w-0'>

          </div>
          
          {/* Center - Title */}
          <div className='absolute left-1/2 transform -translate-x-1/2'>
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
            className='rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 touch-manipulation flex-shrink-0'
          >
            Add Stock
          </button>
        </div>
      </div>
  
      {/* Desktop/Tablet Header */}
      <div className='hidden sm:block p-4 sm:p-6 lg:p-8'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>Stock</h1>
        </div>
      </div>
  
      {/* Main Content Container */}
      <div className='px-4 pb-4 sm:px-6 lg:px-8'>
        {/* Tabs Section - Mobile Optimized */}
        <div className='mb-4 sm:mb-6 bg-white sm:bg-transparent rounded-lg sm:rounded-none shadow-sm sm:shadow-none'>
          <div className='p-4 sm:p-0'>
            <div className='flex items-center justify-between mb-4'>
              <div className='overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 flex-1'>
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
        <div className='mb-4 bg-white rounded-lg shadow-sm p-4 sm:hidden'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500'>Total Stock Cost</p>
              <p className='text-lg font-semibold text-gray-900'>PKR {stockCost?.toLocaleString()}</p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-500'>Items</p>
              <p className='text-lg font-semibold text-gray-900'>{tableData?.length || 0}</p>
            </div>
          </div>
        </div>
  
        {/* Data Grid Section - Mobile Optimized */}
        <div className='bg-white rounded-lg shadow-sm sm:shadow-none sm:bg-transparent sm:rounded-none'>
          {/* Mobile Search */}
          <div className='p-4 border-b border-gray-200 sm:hidden'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search stock...'
                className='w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              />
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
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
                        <h3 className='text-sm font-medium text-gray-900'>{row.series}</h3>
                        <div className='mt-1 flex items-center gap-4 text-xs text-gray-500'>
                          <span>Stock: {row.inStock}</span>
                          <span>Cost: PKR {row.productCost?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button 
                          onClick={() => {
                            // Handle edit functionality
                            setEditModalData({
                              brandName: row.brandName,
                              series: row.series,
                              productCost: String(row.productCost),
                              inStock: String(row.inStock),
                            });
                            setModalType('edit');
                            setIsModalOpen(true);
                          }}
                          className='rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 touch-manipulation'
                        >
                          <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleViewStockHistory(currentBrandName, row.series)}
                          className='rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 touch-manipulation'
                          title="View History"
                        >
                          <FaHistory className='h-4 w-4' />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(row, currentBrandName)}
                          className='rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 touch-manipulation'
                          title="Delete Stock"
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
                <div className='text-gray-400 mb-2'>
                  <svg className='mx-auto h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
                  </svg>
                </div>
                <h3 className='text-sm font-medium text-gray-900 mb-1'>No stock items</h3>
                <p className='text-sm text-gray-500'>Get started by adding your first stock item.</p>
              </div>
            )}
          </div>
  
          {/* Desktop Data Grid */}
          <div className='hidden sm:block'>
            <DataGridDemo
              rows={tableData}
              columns={gridColumns}
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
        }}
        title={modalType === 'add' ? 'Add Stock' : 'Edit Stock'}
        dialogPanelClass="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 sm:mx-auto"
      >
        <form 
          onSubmit={modalType === 'add' ? handleSubmit : handleSubmitEdit}
          className="space-y-4"
        >
          <div className='flex w-full flex-col gap-4'>
            {/* Series Dropdown - Mobile Optimized */}
            <div className='w-full'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Select Series
              </label>
              <div
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="relative w-full"
              >
                <Dropdown
                  className="w-full"
                  options={seriesOptions}
                  onSelect={handleSelectSeriesOption}
                  placeholder='Select Series'
                  required={modalType === 'add' && !stockData.series}
                  defaultValue={
                    modalType === 'edit' ? editModalData.series : undefined
                  }
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
                className="w-full text-base h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:outline-none focus:ring-0 focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                inputMode="decimal"
                placeholder="0.00"
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
                className="w-full text-base h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:outline-none focus:ring-0 focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                inputMode="numeric"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
  
            {/* Action Buttons - Mobile First */}
            <div className='flex flex-col gap-3 pt-4 w-full'>
              <Button
                className='w-full h-12 text-base font-medium focus:outline-none focus:ring-0'
                variant='fill'
                text={modalType === 'add' ? 'Add Stock' : 'Update Stock'}
                type='submit'
                isPending={isLoading}
                disabled={isLoading}
              />
              <Button
                className='w-full h-12 text-base focus:outline-none focus:ring-0'
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
        title="Stock History"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : stockHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stock history available
            </div>
          ) : (
            <div className="space-y-4">
              {!selectedHistoryEntry ? (
                // History List View
                <div className="grid gap-4">
                  {stockHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedHistoryEntry(entry)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{entry.brandName} - {entry.series}</h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <span className="mr-4">Quantity: {entry.oldQuantity} → {entry.newQuantity} ({entry.quantityDifference > 0 ? '+' : ''}{entry.quantityDifference})</span>
                            <span>Cost: Rs {entry.oldCost} → Rs {entry.newCost} ({entry.costDifference > 0 ? '+' : ''}Rs {entry.costDifference})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(entry.historyDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
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
                    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to History List
                  </button>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          This is a historical view from {new Date(selectedHistoryEntry.historyDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Render the series-level history detail */}
                  <div className="rounded-lg bg-white p-4 shadow">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <span className="text-sm text-gray-500">Brand</span>
                        <p className="font-medium text-gray-900">{selectedHistoryEntry.brandName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Series</span>
                        <p className="font-medium text-gray-900">{selectedHistoryEntry.series}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Quantity Change</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">{selectedHistoryEntry.oldQuantity}</span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">{selectedHistoryEntry.newQuantity}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedHistoryEntry.quantityDifference > 0 ? 'bg-green-100 text-green-800' : 
                            selectedHistoryEntry.quantityDifference < 0 ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedHistoryEntry.quantityDifference > 0 ? '+' : ''}{selectedHistoryEntry.quantityDifference}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Cost Change</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">Rs {selectedHistoryEntry.oldCost}</span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">Rs {selectedHistoryEntry.newCost}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedHistoryEntry.costDifference > 0 ? 'bg-green-100 text-green-800' : 
                            selectedHistoryEntry.costDifference < 0 ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedHistoryEntry.costDifference > 0 ? '+' : ''}Rs {selectedHistoryEntry.costDifference}
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
        title="Delete Stock"
        dialogPanelClass="w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <FaTrash className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Stock Item
            </h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this stock item? This action cannot be undone.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  Stock Item to Delete
                </h4>
                <div className="mt-2 text-sm text-red-700">
                  <p><strong>Brand:</strong> {deleteItem?.brandName}</p>
                  <p><strong>Series:</strong> {deleteItem?.seriesName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              className="w-full h-12 text-base font-medium focus:outline-none focus:ring-0"
              variant="fill"
              text="Delete Stock"
              onClick={handleDeleteStock}
              isPending={isDeleting}
              disabled={isDeleting}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            />
            <Button
              className="w-full h-12 text-base focus:outline-none focus:ring-0"
              variant="outline"
              text="Cancel"
              type="button"
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
