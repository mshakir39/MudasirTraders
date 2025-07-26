'use client';
import Table from '@/components/table';
import React, { useEffect } from 'react';
import Button from '@/components/button';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import { revalidatePathCustom } from '@/actions/revalidatePathCustom';
import { createCategory, updateCategory, patchCategory, getCategoryHistory } from '@/actions/categoryActions';
import { ICategory, IBrand, IBatterySeries } from '@/interfaces';
import { FaEye, FaUpload } from 'react-icons/fa6';
import { useCategoryStore } from '@/store/categoryStore';
import PdfUploadModal from '@/components/PdfUploadModal';
import { ObjectId } from 'mongodb';

// Use IBatterySeries directly instead of creating a new interface
type BatteryData = IBatterySeries;

// Extend ICategory to ensure series is BatteryData[]
interface CategoryWithBatteryData extends ICategory {
  id: string; // Make id required for the UI
  historyDate?: Date; // Optional for history entries
}

interface CategoryLayoutProps {
  initialCategories: CategoryWithBatteryData[];
  initialBrands: IBrand[];
}

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface HistoryEntry {
  _id?: string;
  categoryId?: string;
  brandName: string;
  series: BatteryData[];
  salesTax: number;
  historyDate: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const CategoryLayout: React.FC<CategoryLayoutProps> = ({ initialCategories, initialBrands }) => {
  unstable_noStore();
  const { categories, fetchCategories, setCategories } = useCategoryStore();
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [detailData, setDetailData] = React.useState<CategoryWithBatteryData>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [editingBattery, setEditingBattery] = React.useState<string | null>(null);
  const [editingPrice, setEditingPrice] = React.useState<{
    [key: string]: number;
  }>({});
  const [editingSalesTax, setEditingSalesTax] = React.useState<{
    [key: string]: number;
  }>({});
  const [isEditingGlobalSalesTax, setIsEditingGlobalSalesTax] = React.useState<boolean>(false);
  const [globalSalesTax, setGlobalSalesTax] = React.useState<string>('18');
  const [isPdfModalOpen, setIsPdfModalOpen] = React.useState<boolean>(false);
  const [brands, setBrands] = React.useState<IBrand[]>(initialBrands);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState<boolean>(false);
  const [historyData, setHistoryData] = React.useState<CategoryWithBatteryData[]>([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = React.useState<CategoryWithBatteryData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState<boolean>(false);

  useEffect(() => {
    // Initialize categories from server-side props
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories as ICategory[]);
    } else {
      fetchCategories();
    }
  }, [initialCategories, setCategories, fetchCategories]);

  const brandOptions = brands
    .filter(brand => brand.id) // Filter out brands without IDs
    .map((brand) => ({
      label: brand.brandName,
      value: brand.id as string, // We know id exists because of the filter
    }));

  const handleViewHistory = async (categoryId: string) => {
    if (!categoryId) return;
    try {
      setIsLoadingHistory(true);
      const result = await getCategoryHistory(categoryId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch history');
      }
      
      // Ensure the data exists and has the correct shape
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid history data received');
      }
      
      // Transform the history data into the expected format
      const typedData = result.data.map((entry: HistoryEntry) => {
        // Ensure we have a valid ID
        const entryId = entry._id || entry.categoryId;
        if (!entryId) {
          throw new Error('History entry missing ID');
        }
        
        // Handle dates safely
        const historyDate = new Date(entry.historyDate ?? '');
        const createdAt = entry.createdAt ? new Date(entry.createdAt) : historyDate;
        const updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : historyDate;

        return {
          id: entryId,
          brandName: entry.brandName,
          series: entry.series,
          salesTax: entry.salesTax,
          historyDate,
          createdAt,
          updatedAt
        } as CategoryWithBatteryData;
      });
      
      setHistoryData(typedData);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const columns = [
    {
      label: 'BrandName',
      renderCell: (item: CategoryWithBatteryData) => item.brandName,
    },
    {
      label: 'Series',
      renderCell: (item: CategoryWithBatteryData) =>
        item.series.map((s) => s.name).join(', '),
    },
    {
      label: '',
      renderCell: (item: CategoryWithBatteryData) => (
        <div className="flex gap-2">
          <FaEye
            className='cursor-pointer'
            title='View'
            onClick={() => {
              setIsModalOpen(true);
              setDetailData(item);
              setGlobalSalesTax(item.salesTax.toString());
            }}
          />
          <button
            onClick={() => handleViewHistory(item.id!)}
            className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            disabled={isLoadingHistory}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </div>
      ),
    },
  ];

  const handlePdfUploadSuccess = async (data: {
    brandName: string;
    series: BatteryData[];
    salesTax: string;
  }) => {
    try {
      setIsLoading(true);
      
      // Check if category already exists for this brand
      const existingCategory = categories.find(
        (cat) => cat.brandName === data.brandName
      );

      const categoryData: Omit<ICategory, 'id'> = {
        brandName: data.brandName,
        series: data.series,
        salesTax: Number(data.salesTax)
      };

      if (existingCategory && existingCategory.id) {
        // Update existing category
        const result = await patchCategory(existingCategory.id, categoryData);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update category');
        }

        toast.success(`Updated existing category for ${data.brandName} with ${data.series.length} series`);
      } else if (!existingCategory) {
        // Create new category
        const result = await createCategory(categoryData);

        if (!result.success) {
          throw new Error(result.error || 'Failed to create category');
        }

        toast.success(`Created new category for ${data.brandName} with ${data.series.length} series`);
      } else {
        throw new Error('Category is missing an id');
      }

      // Call revalidatePath and wait for it to complete
      await revalidatePathCustom('/category');
      await fetchCategories(); // Refresh the categories list
    } catch (error) {
      console.error('Error saving category from PDF:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save category from PDF'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (batteryName: string, value: string) => {
    setEditingPrice((prev) => ({
      ...prev,
      [batteryName]: Number(value) || 0,
    }));
  };

  const handleSavePrice = async (batteryName: string) => {
    try {
      setIsLoading(true);
      const updatedSeries = detailData?.series.map((item) =>
        item.name === batteryName
          ? { ...item, retailPrice: editingPrice[batteryName] }
          : item
      );

      if (!detailData || !updatedSeries) return;

      const result = await patchCategory(detailData.id!, {
        brandName: detailData.brandName,
        series: updatedSeries,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              series: updatedSeries,
            }
          : undefined
      );

      toast.success('Price updated successfully');
      setEditingBattery(null);
      setEditingPrice({});
      await revalidatePathCustom('/category');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update price'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGlobalSalesTax = async () => {
    try {
      setIsLoading(true);
      if (!detailData) return;

      const tax = Number(globalSalesTax) || 0;

      const updatedSeries = detailData.series.map((item) => ({
        ...item,
        salesTax: tax,
        maxRetailPrice: item.retailPrice
          ? item.retailPrice + (item.retailPrice * tax) / 100
          : undefined,
      }));

      const result = await patchCategory(detailData.id!, {
        brandName: detailData.brandName,
        series: updatedSeries,
        salesTax: tax,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update both the series and the parent salesTax
      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              series: updatedSeries,
              salesTax: tax,
            }
          : undefined
      );

      toast.success('Sales tax updated successfully');
      setIsEditingGlobalSalesTax(false);
      await revalidatePathCustom('/category');
    } catch (error) {
      console.error('Error updating sales tax:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update sales tax'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSeries = React.useMemo(() => {
    if (!detailData || !detailData.series) return [];

    if (!searchQuery.trim()) return detailData.series;

    const query = searchQuery.toLowerCase().trim();
    return detailData.series.filter(
      (item: BatteryData) =>
        item.name.toLowerCase().includes(query) ||
        item.plate.toLowerCase().includes(query) ||
        item.ah.toString().includes(query) ||
        (item.type && item.type.toLowerCase().includes(query))
    );
  }, [detailData, searchQuery]);

  return (
    <div className='md:p-6 p-0 py-6'>
      <div className='flex items-center justify-between py-2'>
        <h1 className='text-2xl font-bold'>Categories</h1>
        <div className='flex gap-2'>
          <Button
            variant='fill'
            text='Upload PDF'
            onClick={() => setIsPdfModalOpen(true)}
          />
        </div>
      </div>

      <Table
        data={categories}
        columns={columns}
        showButton={false}
      />

      {/* PDF Upload Modal */}
      <PdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSuccess={handlePdfUploadSuccess}
        brands={brandOptions}
        categories={categories}
      />

      <Modal
        size='large'
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSearchQuery('');
        }}
        title={detailData && detailData.brandName}
      >
        {/* Fully Responsive Battery List Component */}
        <div className='max-h-[80vh] overflow-y-auto'>
          {/* Header Controls - Responsive Layout */}
          <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
            {/* Search Input - Full width on mobile, half on desktop */}
            <div className='w-full sm:w-1/2 lg:w-3/5'>
              <Input
                type='text'
                label='Search batteries'
                placeholder='Search by name, plate, AH or type...'
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>
            
            {/* Sales Tax Control - Full width on mobile, smaller on desktop */}
            <div className='w-full sm:w-1/3 lg:w-1/4'>
              <div className='mb-1 flex items-center justify-between'>
                <label className='text-sm text-gray-500'>Sales Tax %</label>
                {!isEditingGlobalSalesTax ? (
                  <button
                    onClick={() => setIsEditingGlobalSalesTax(true)}
                    className='rounded px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 hover:text-blue-700 touch-manipulation'
                  >
                    Edit
                  </button>
                ) : (
                  <div className='flex gap-1 sm:gap-2'>
                    <button
                      onClick={handleSaveGlobalSalesTax}
                      className='rounded px-2 py-1 text-sm text-green-500 hover:bg-green-50 hover:text-green-700 touch-manipulation'
                      disabled={isLoading}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingGlobalSalesTax(false);
                        setGlobalSalesTax('18'); // Reset to default
                      }}
                      className='rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 touch-manipulation'
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {isEditingGlobalSalesTax ? (
                <input
                  type='text'
                  value={globalSalesTax}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (/^-?\d*$/.test(value)) {
                      setGlobalSalesTax(value);
                    }
                  }}
                  className='w-full rounded border bg-white p-2 text-sm focus:border-blue-500 focus:outline-none'
                  placeholder='Enter sales tax percentage'
                />
              ) : (
                <div className='w-full rounded border bg-gray-100 p-2 text-sm font-medium'>
                  {globalSalesTax}%
                </div>
              )}
            </div>
          </div>

          {/* Battery List */}
          <div className='flex flex-col gap-3 sm:gap-4'>
            <div className='grid grid-cols-1 gap-3 sm:gap-4'>
              {filteredSeries.length > 0 ? (
                filteredSeries.map((item: BatteryData, index: number) => (
                  <div
                    key={index}
                    className='rounded-lg bg-white p-3 sm:p-4 shadow transition-shadow hover:shadow-md'
                  >
                    {/* Mobile Card Layout */}
                    <div className='block sm:hidden'>
                      {/* Header Row */}
                      <div className='mb-3 flex items-start justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900'>{item.name}</h3>
                          <div className='mt-1 flex flex-wrap gap-2 text-sm text-gray-600'>
                            <span>Plate: {item.plate}</span>
                            <span>•</span>
                            <span>AH: {item.ah}</span>
                            {item.type && (
                              <>
                                <span>•</span>
                                <span>Type: {item.type}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className='space-y-3'>
                        {/* Retail Price */}
                        <div className='rounded-lg bg-gray-50 p-3'>
                          <div className='mb-2 flex items-center justify-between'>
                            <span className='text-sm font-medium text-gray-700'>Retail Price</span>
                            {editingBattery !== item.name ? (
                              <button
                                onClick={() => {
                                  setEditingBattery(item.name);
                                  setEditingPrice((prev) => ({
                                    ...prev,
                                    [item.name]: item.retailPrice || 0,
                                  }));
                                }}
                                className='rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200 touch-manipulation'
                              >
                                Edit
                              </button>
                            ) : (
                              <div className='flex gap-2'>
                                <button
                                  onClick={() => handleSavePrice(item.name)}
                                  className='rounded-full bg-green-100 px-3 py-1 text-sm text-green-600 hover:bg-green-200 touch-manipulation'
                                  disabled={isLoading}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingBattery(null);
                                    setEditingPrice({});
                                  }}
                                  className='rounded-full bg-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-200 touch-manipulation'
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          {editingBattery === item.name ? (
                            <input
                              type='number'
                              value={editingPrice[item.name] ?? item.retailPrice ?? ''}
                              onChange={(e) => handlePriceChange(item.name, e.target.value)}
                              className='w-full rounded border p-2 text-base focus:border-blue-500 focus:outline-none'
                              placeholder='Enter price'
                            />
                          ) : (
                            <p className='text-lg font-semibold text-gray-900'>
                              Rs {item.retailPrice || 'N/A'}
                            </p>
                          )}
                        </div>

                        {/* Tax and Max Price Row */}
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='rounded-lg bg-gray-50 p-3'>
                            <span className='text-xs text-gray-500'>
                              Sales Tax ({item.salesTax ?? detailData?.salesTax ?? 18}%)
                            </span>
                            <p className='font-medium text-gray-900'>
                              Rs {item.retailPrice
                                ? Math.round((item.retailPrice * (item.salesTax ?? detailData?.salesTax ?? 18)) / 100)
                                : 'N/A'}
                            </p>
                          </div>
                          <div className='rounded-lg bg-gray-50 p-3'>
                            <span className='text-xs text-gray-500'>Max Retail Price</span>
                            <p className='font-medium text-gray-900'>
                              Rs {item.maxRetailPrice || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Grid Layout */}
                    <div className='hidden sm:block'>
                      <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7'>
                        <div>
                          <span className='text-sm text-gray-500'>Name</span>
                          <p className='font-medium text-gray-900 break-words'>{item.name}</p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>Plate</span>
                          <p className='font-medium text-gray-900'>{item.plate}</p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>AH</span>
                          <p className='font-medium text-gray-900'>{item.ah}</p>
                        </div>
                        <div className='col-span-2 md:col-span-1 lg:col-span-1'>
                          <div className='mb-1 flex items-center justify-between'>
                            <span className='text-sm text-gray-500'>Retail Price</span>
                            {editingBattery !== item.name ? (
                              <button
                                onClick={() => {
                                  setEditingBattery(item.name);
                                  setEditingPrice((prev) => ({
                                    ...prev,
                                    [item.name]: item.retailPrice || 0,
                                  }));
                                }}
                                className='rounded px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 hover:text-blue-700 touch-manipulation'
                              >
                                Edit
                              </button>
                            ) : (
                              <div className='flex gap-1'>
                                <button
                                  onClick={() => handleSavePrice(item.name)}
                                  className='rounded px-2 py-1 text-xs text-green-500 hover:bg-green-50 hover:text-green-700 touch-manipulation'
                                  disabled={isLoading}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingBattery(null);
                                    setEditingPrice({});
                                  }}
                                  className='rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 touch-manipulation'
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          {editingBattery === item.name ? (
                            <input
                              type='number'
                              value={editingPrice[item.name] ?? item.retailPrice ?? ''}
                              onChange={(e) => handlePriceChange(item.name, e.target.value)}
                              className='w-full rounded border p-1 text-sm focus:border-blue-500 focus:outline-none'
                              placeholder='Enter price'
                            />
                          ) : (
                            <p className='font-medium text-gray-900'>
                              Rs {item.retailPrice || 'N/A'}
                            </p>
                          )}
                        </div>
                        <div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-500'>
                              Sales Tax ({item.salesTax ?? detailData?.salesTax ?? 18}%)
                            </span>
                          </div>
                          <p className='font-medium text-gray-900'>
                            Rs {item.retailPrice
                              ? Math.round((item.retailPrice * (item.salesTax ?? detailData?.salesTax ?? 18)) / 100)
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>Max Retail Price</span>
                          <p className='font-medium text-gray-900'>
                            Rs {item.maxRetailPrice || 'N/A'}
                          </p>
                        </div>
                        {item.type && (
                          <div>
                            <span className='text-sm text-gray-500'>Type</span>
                            <p className='font-medium text-gray-900'>{item.type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='rounded-lg bg-gray-50 py-8 text-center'>
                  <div className='mx-auto max-w-md px-4'>
                    <div className='text-gray-400 mb-3'>
                      <svg className='mx-auto h-12 w-12' fill='currentColor' viewBox='0 0 24 24'>
                        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/>
                      </svg>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 mb-1'>No batteries found</h3>
                    <p className='text-sm text-gray-500'>
                      No batteries match your search criteria. Try adjusting your search terms.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        size='large'
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedHistoryEntry(null);
        }}
        title="Category History"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No history available
            </div>
          ) : (
            <div className="space-y-4">
              {!selectedHistoryEntry ? (
                // History List View
                <div className="grid gap-4">
                  {historyData.map((entry, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedHistoryEntry(entry)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{entry.brandName}</h3>
                          <p className="text-sm text-gray-500">
                            {entry.series.length} series items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(entry.historyDate ?? '').toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.historyDate ?? '').toLocaleTimeString()}
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
                          This is a historical view from {new Date(selectedHistoryEntry.historyDate ?? '').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Render the same battery list view but with historical data */}
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {selectedHistoryEntry.series.map((item: BatteryData, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg bg-white p-3 sm:p-4 shadow"
                      >
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                          <div>
                            <span className="text-sm text-gray-500">Name</span>
                            <p className="font-medium text-gray-900 break-words">{item.name}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Plate</span>
                            <p className="font-medium text-gray-900">{item.plate}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">AH</span>
                            <p className="font-medium text-gray-900">{item.ah}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Retail Price</span>
                            <p className="font-medium text-gray-900">
                              Rs {item.retailPrice || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">
                              Sales Tax ({item.salesTax ?? selectedHistoryEntry.salesTax ?? 18}%)
                            </span>
                            <p className="font-medium text-gray-900">
                              Rs {item.retailPrice
                                ? Math.round((item.retailPrice * (item.salesTax ?? selectedHistoryEntry.salesTax ?? 18)) / 100)
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Max Retail Price</span>
                            <p className="font-medium text-gray-900">
                              Rs {item.maxRetailPrice || 'N/A'}
                            </p>
                          </div>
                          {item.type && (
                            <div>
                              <span className="text-sm text-gray-500">Type</span>
                              <p className="font-medium text-gray-900">{item.type}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CategoryLayout;
