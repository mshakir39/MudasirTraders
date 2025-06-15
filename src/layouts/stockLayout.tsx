'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('@/components/button'));
// const Table = dynamic(() => import('@/components/table'));
const Modal = dynamic(() => import('@/components/modal'));
const Input = dynamic(() => import('@/components/customInput'));
const Dropdown = dynamic(() => import('@/components/dropdown'));
const Tabs = dynamic(() => import('@/components/tabs'));

import { POST, PUT } from '@/utils/api';
import arrayStringToArrayObject from '@/utils/arrayStringToArrayObject';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { ICategory, IDropdownOption, IStock } from '../../interfaces';
import { getSeries } from '@/models/getSeries';
import { FaEdit } from 'react-icons/fa';
import { convertDate } from '@/utils/convertTime';
import DataGridDemo from '@/components/dataGrid';

interface BatteryDetails {
  name: string;
  plate: string;
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

  const gridColumns = [
    {
      field: 'series',
      headerName: 'Series',
      width: 250,
      renderCell: (item: { row: StockBatteryData }) => {
        const details = item.row.batteryDetails;
        return details
          ? `${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
          : item.row.series;
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
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);

      const stockPayload: StockBatteryData = {
        ...stockData,
        productCost: Number(stockData.productCost),
        inStock: Number(stockData.inStock),
        updatedDate: new Date().toISOString(),
      };

      const response = (await POST('api/stock', stockPayload)) as ApiResponse;

      if (response?.message) {
        toast.success(response.message);
        await revalidatePathCustom('/stock');
      }

      if (response?.error) {
        toast.error(response.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error posting data:', error);
      toast.error('Failed to add stock');
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

      const response = (await PUT('api/stock', {
        id: filtered[0].id,
        data: {
          brandName: editModalData.brandName,
          seriesStock: updatedStock,
        },
      })) as ApiResponse;

      if (response?.error) {
        throw new Error(response.error);
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
        const seriesOptions = seriesArray.map((battery) => ({
          label: `${battery.name} (${battery.plate}, ${battery.ah}AH${battery.type ? `, ${battery.type}` : ''})`,
          value: battery.name,
          batteryDetails: {
            name: battery.name,
            plate: battery.plate,
            ah: battery.ah,
            type: battery.type,
          },
        }));
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
      productCost: item.productCost.toString(),
      inStock: item.inStock.toString(),
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

      // Initialize stock for the first category if it doesn't exist
      if (!stock || stock.length === 0) {
        console.log('No stock data exists, initializing first category');
        if (firstCategoryBrandName) {
          fetchData(firstCategoryBrandName);
          setStockData({
            brandName: firstCategoryBrandName,
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
        (item) => item.brandName === firstCategoryBrandName
      );
      console.log('Filtered stock:', filteredStock);

      if (filteredStock && filteredStock.length > 0 && firstCategoryBrandName) {
        const newData = filteredStock[0].seriesStock?.map(
          (item: StockBatteryData, index: number) =>
            transformStockData(item, categories[0], index)
        );

        const totalAmount = filteredStock[0]?.seriesStock?.reduce(
          (acc: number, current: StockBatteryData) => {
            return acc + Number(current.productCost) * Number(current.inStock);
          },
          0
        );

        setStockCost(totalAmount);
        fetchData(firstCategoryBrandName);
        setStockData({
          brandName: firstCategoryBrandName,
          series: '',
          productCost: '',
          inStock: '',
          batteryDetails: undefined,
        });
        setTableData(newData || []);
      } else {
        console.log('No filtered stock found for first category');
        if (firstCategoryBrandName) {
          fetchData(firstCategoryBrandName);
          setStockData({
            brandName: firstCategoryBrandName,
            series: '',
            productCost: '',
            inStock: '',
            batteryDetails: undefined,
          });
        }
        setTableData([]);
      }
      setCurrentBrandName(firstCategoryBrandName);
    } else {
      console.log('No categories available');
      setTableData([]);
    }
  }, [categories, fetchData, stock]);

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
    return seriesOptions.find((option) => option.value === series);
  };

  return (
    <div className=''>
      <div className='flex w-full justify-between py-2'>
        <span className='text-3xl font-medium'>Stock</span>
      </div>
      <div className='mt-4'>
        <Tabs
          tabs={categories.map((category, index) => ({
      id: index,
            label: category.brandName || '',
            content: null,
          }))}
          onTabClick={handleTabClick}
        />
        <div className='mt-4'>
          <DataGridDemo
            rows={tableData}
            columns={gridColumns}
            stockCost={stockCost}
            buttonTitle='Create Stock'
            showButton={true}
            buttonOnClick={() => {
              // Always update the series options to match the current tab/brand
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
            >
        <form onSubmit={modalType === 'add' ? handleSubmit : handleSubmitEdit}>
                <div className='mt-4 flex w-full flex-col gap-2'>
                  <div
                    className='w-full'
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <Dropdown
                      className={''}
                      options={seriesOptions}
                      onSelect={handleSelectSeriesOption}
                      placeholder='Select Series'
                required={modalType === 'add' && !stockData.series}
                defaultValue={
                  modalType === 'edit' ? editModalData.series : undefined
                }
                    />
                  </div>
                  <Input
                    type='number'
                    label='Enter Cost Per Product'
                    name='productCost'
              value={
                modalType === 'add'
                  ? stockData.productCost || ''
                  : editModalData.productCost || ''
              }
              onChange={modalType === 'add' ? handleChange : handleEditChange}
              required={modalType === 'add'}
                  />
                  <Input
                    type='number'
                    label='Enter Quantity'
                    name='inStock'
              value={
                modalType === 'add'
                  ? stockData.inStock || ''
                  : editModalData.inStock || ''
              }
              onChange={modalType === 'add' ? handleChange : handleEditChange}
              required={modalType === 'add'}
                  />
                  <Button
                    className='w-fit'
                    variant='fill'
                    text='Save'
                    type='submit'
                    isPending={isLoading}
            />
                </div>
              </form>
            </Modal>
    </div>
  );
};

export default StockLayout;
