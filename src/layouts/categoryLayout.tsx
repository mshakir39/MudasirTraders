'use client';
import Table from '@/components/table';
import React, { useEffect } from 'react';
import Button from '@/components/button';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Dropdown, { DropdownOption } from '@/components/dropdown';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import { POST } from '@/utils/api';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { ICategory, IBrand } from '../../interfaces';
import { FaEye } from 'react-icons/fa6';

interface BatteryData {
  name: string;
  plate: string;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

// Extend ICategory to ensure series is BatteryData[]
interface CategoryWithBatteryData extends Omit<ICategory, 'series'> {
  series: BatteryData[];
  salesTax: number;
}

interface CategoryLayoutProps {
  categories: CategoryWithBatteryData[];
}

const CategoryLayout: React.FC<CategoryLayoutProps> = ({ categories }) => {
  unstable_noStore();
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [modalType, setModalType] = React.useState<string>('');
  const [detailData, setDetailData] = React.useState<CategoryWithBatteryData>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [brands, setBrands] = React.useState<IBrand[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [editingBattery, setEditingBattery] = React.useState<string | null>(
    null
  );
  const [editingPrice, setEditingPrice] = React.useState<{
    [key: string]: number;
  }>({});
  const [editingSalesTax, setEditingSalesTax] = React.useState<{
    [key: string]: number;
  }>({});
  const [isEditingGlobalSalesTax, setIsEditingGlobalSalesTax] =
    React.useState<boolean>(false);
  const [globalSalesTax, setGlobalSalesTax] = React.useState<string>('18');
  const [category, setCategory] = React.useState<{
    series: string;
    brandName: string;
    salesTax: string;
  }>({ series: '', brandName: '', salesTax: '' });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        if (Array.isArray(data)) {
          setBrands(data);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error('Failed to load brands');
      }
    };

    fetchBrands();
  }, []);

  const brandOptions = brands.map((brand) => ({
    label: brand.brandName,
    value: brand.id,
  }));

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
        <FaEye
          className='cursor-pointer'
          title='View'
          onClick={() => {
            setModalType('detail');
            setIsModalOpen(true);
            setDetailData(item);
            setGlobalSalesTax(item.salesTax.toString());
          }}
        />
      ),
    },
  ];

  async function addAllCategories() {
    const brandName = 'OSAKA';
    const salesTax = 18; // Default sales tax percentage

    // List of all battery series
   

    const allSeries = [
      // HT SERIES LIGHT RANGE (DRY CHARGED UN-FILLED BATTERIES)
      { name: 'HT 50 R/L', ah: 24, plate: 7, retailPrice: 5600.00 },
      { name: 'HT 50 R/L PLUS', ah: 26, plate: 7, retailPrice: 5900.00 },
      { name: 'HT 55 R/L', ah: 30, plate: 9, retailPrice: 6700.00 },
      { name: 'HT 60 R/L', ah: 34, plate: 9, retailPrice: 7245.00 },
      { name: 'HT GR 65 R/L', ah: 40, plate: 11, retailPrice: 8759.00 },
      { name: 'HT 70Q', ah: 45, plate: 11, retailPrice: 8740.00 },
      { name: 'HT 75QL TALLWICK', ah: 50, plate: 12, retailPrice: 9720.00 },
      { name: 'HT 88 R/L', ah: 50, plate: 9, retailPrice: 10290.00 },
      { name: 'HT 92 R/L', ah: 60, plate: 11, retailPrice: 10650.00 },
      { name: 'HT 95 R/L', ah: 70, plate: 13, retailPrice: 12290.00 },
      { name: 'HT 110', ah: 70, plate: 11, retailPrice: 12650.00 },
      { name: 'HT 115 PLUS A', ah: 72, plate: 11, retailPrice: 13490.00 },
      { name: 'HT 120 R/L', ah: 85, plate: 13, retailPrice: 14530.00 },
      { name: 'HT 125 R/L', ah: 90, plate: 15, retailPrice: 16340.00 },
    
      // HT SERIES MEDIUM RANGE (DRY CHARGED UN-FILLED BATTERIES)
      { name: 'HT 130', ah: 90, plate: 13, retailPrice: 15750.00 },
      { name: 'HT 135', ah: 100, plate: 15, retailPrice: 16760.00 },
      { name: 'HT 145', ah: 105, plate: 17, retailPrice: 19130.00 },
      { name: 'HT 150', ah: 105, plate: 15, retailPrice: 19130.00 },
      { name: 'HT 155', ah: 110, plate: 17, retailPrice: 18350.00 },
      { name: 'HT 160', ah: 115, plate: 19, retailPrice: 20650.00 },
    
      // HT SERIES HEAVY RANGE (DRY CHARGED UN-FILLED BATTERIES)
      { name: 'HT 180', ah: 115, plate: 19, retailPrice: 22600.00 },
      { name: 'HT 200', ah: 120, plate: 21, retailPrice: 24800.00 },
      { name: 'HT 210 PLUS', ah: 130, plate: 21, retailPrice: 22530.00 },
      { name: 'HT 220', ah: 135, plate: 23, retailPrice: 26750.00 },
      { name: 'HT 225', ah: 135, plate: 21, retailPrice: 26190.00 },
      { name: 'HT 230', ah: 145, plate: 23, retailPrice: 28600.00 },
      { name: 'HT 240 PLUS', ah: 155, plate: 23, retailPrice: 28900.00 },
      { name: 'HT 260', ah: 175, plate: 25, retailPrice: 30900.00 },
      { name: 'HT 270', ah: 180, plate: 27, retailPrice: 33980.00 },
      { name: 'HT 280', ah: 190, plate: 27, retailPrice: 34900.00 },
      { name: 'HT 290', ah: 200, plate: 31, retailPrice: 36790.00 },
      { name: 'HT 300', ah: 215, plate: 33, retailPrice: 39290.00 },
    
      // SOLAR SERIES (DRY CHARGED UN-FILLED BATTERIES)
      { name: 'HT Solar 50', ah: 20, plate: 5, retailPrice: 4480.00 },
      { name: 'HT Solar 50 PLUS', ah: 22, plate: 5, retailPrice: 4750.00 },
      { name: 'HT Solar 100', ah: 55, plate: 9, retailPrice: 10750.00 },
    
      // OSAKA HIGH-TECH SERIES
      // FORD 3600 & FORD 4000 (DRY CHARGED UN-FILLED BATTERIES)
      { name: 'HT GLT 200', ah: 130, plate: 25, retailPrice: 35325.00 },
      { name: 'HT GLT 220', ah: 145, plate: 29, retailPrice: 36900.00 },
    
      // HT IPS SERIES (DRY CHARGED UN-FILLED BATTERIES)
      { name: 'HT IPS 1200', ah: 120, plate: 19, retailPrice: 27600.00 },
      { name: 'HT IPS 1400', ah: 130, plate: 21, retailPrice: 30600.00 },
      { name: 'HT IPS 1600', ah: 150, plate: 23, retailPrice: 32600.00 },
      { name: 'HT IPS 2000', ah: 175, plate: 25, retailPrice: 36600.00 },
    
      // MAINTENANCE FREE BATTERIES (FACTORY FILLED AND CHARGED BATTERIES)
      { name: 'MF 50 R/L', ah: 20, plate: 5, retailPrice: 6500.00 },
      { name: 'MF 55 R/L', ah: 38, plate: 9, retailPrice: 8210.00 },
      { name: 'MF 65 R/L', ah: 40, plate: 11, retailPrice: 9325.00 },
      { name: 'MF 70 R/L (ThinThick Pole)', ah: 48, plate: 11, retailPrice: 10530.00 },
      { name: 'MF 75 R/L (ThinThick Pole)', ah: 50, plate: 12, retailPrice: 10670.00 },
      { name: 'MF 80 R/L', ah: 50, plate: 9, retailPrice: 10760.00 },
      { name: 'MF 85 GR 25 R', ah: 75, plate: 11, retailPrice: 11450.00 },
      { name: 'MF 85 R/L', ah: 75, plate: 11, retailPrice: 11450.00 },
      { name: 'MF 110 R/L', ah: 80, plate: 13, retailPrice: 12750.00 },
      { name: 'MF 120 R/L', ah: 90, plate: 15, retailPrice: 14750.00 },
    
      // DIN SERIES MAINTENANCE FREE BATTERIES (FACTORY FILLED AND CHARGED BATTERIES)
      { name: 'MF DIN 555', ah: 45, plate: 9, retailPrice: 12615.00 },
      { name: 'MF DIN 666', ah: 60, plate: 11, retailPrice: 15410.00 },
      { name: 'MF DIN 777', ah: 66, plate: 13, retailPrice: 16640.00 },
      { name: 'MF DIN 888', ah: 88, plate: 17, retailPrice: 18850.00 },
    
      // TUBULAR BATTERIES (FACTORY FILLED AND CHARGED BATTERIES)
      { name: 'HT 1800', ah: 185, plate: 5, retailPrice: 41000.00 },
      { name: 'HT 2000', ah: 200, plate: 6, retailPrice: 43000.00 },
      { name: 'HT 2500', ah: 250, plate: 7, retailPrice: 44000.00 },
      { name: 'HT 3500', ah: 280, plate: 9, retailPrice: 53000.00 }
    ]
    .map((item) => ({
      ...item,
      salesTax: salesTax, // Set salesTax at series level
      maxRetailPrice: item.retailPrice
        ? item.retailPrice + (item.retailPrice * salesTax) / 100
        : undefined,
    }));

    try {
      // First, check if brand already exists
      const existingCategories = categories.find(
        (cat) => cat.brandName === brandName
      );
      if (existingCategories) {
        console.log(`Brand ${brandName} already exists. Skipping...`);
        return {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          successDetails: [],
          errorDetails: [
            {
              series: brandName,
              status: 'error',
              message: 'Brand already exists',
            },
          ],
        };
      }

      // Create a single category with all series
      const category = {
        brandName,
        series: allSeries,
        salesTax: salesTax.toString(),
      };

      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category),
        });
        const data = await response.json();

        if (data?.success) {
          console.log(
            `Successfully added brand ${brandName} with ${allSeries.length} series`
          );
          await revalidatePathCustom('/category');
          return {
            totalProcessed: allSeries.length,
            successful: allSeries.length,
            failed: 0,
            successDetails: [
              { series: brandName, status: 'success', message: data.message },
            ],
            errorDetails: [],
          };
        } else {
          console.error(`Error adding brand ${brandName}: ${data?.error}`);
          return {
            totalProcessed: allSeries.length,
            successful: 0,
            failed: allSeries.length,
            successDetails: [],
            errorDetails: [
              { series: brandName, status: 'error', message: data?.error },
            ],
          };
        }
      } catch (error) {
        console.error(`Failed to add brand ${brandName}:`, error);
        return {
          totalProcessed: allSeries.length,
          successful: 0,
          failed: allSeries.length,
          successDetails: [],
          errorDetails: [
            {
              series: brandName,
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
        };
      }
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
  }

  const handleSelectOption = (option: DropdownOption) => {
    setCategory({ ...category, brandName: option?.label });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response: any = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...category,
          salesTax: Number(category.salesTax) || 0, // Ensure sales tax is a number
        }),
      });

      if (response?.message) {
        toast.success(response?.message);
        await revalidatePathCustom('/category');
      }

      if (response?.error) {
        toast.error(response?.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error posting data:', error);
      toast.error('Failed to add category');
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === 'salesTax') {
      // Allow negative numbers
      if (/^-?\d*$/.test(value)) {
        setCategory({ ...category, [name]: value });
      }
    } else {
      setCategory({ ...category, [name]: value });
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

      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: detailData.id,
          data: {
            brandName: detailData.brandName,
            series: updatedSeries,
          },
        }),
      });

      const data = await response.json();

      if (data?.error) {
        throw new Error(data.error);
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

      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: detailData.id,
          data: {
            brandName: detailData.brandName,
            series: updatedSeries,
            salesTax: tax,
          },
        }),
      });
      const data = await response.json();

      if (data?.error) {
        throw new Error(data.error);
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
    <div className=''>
      <div className='flex w-full justify-between py-2'>
        <span className='text-3xl font-medium'>Categories</span>
      </div>
      <Table
        columns={columns}
        data={categories}
        buttonTitle='Add Category'
        buttonOnClick={() => {
          // addAllCategories();
          // setModalType('add');
          // setIsModalOpen(true);
        }}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSearchQuery('');
        }}
        title={
          modalType === 'add'
            ? 'Add Category'
            : detailData && detailData.brandName
        }
      >
        {modalType === 'add' ? (
          <form onSubmit={handleSubmit}>
            <div className='mt-4 flex w-full flex-col gap-2'>
              <div
                className='w-full'
                onClick={(event) => event.preventDefault()}
              >
                <Dropdown
                  options={brandOptions}
                  onSelect={handleSelectOption}
                  placeholder='Select Battery Brand'
                />
              </div>
              <Input
                type='text'
                label='Enter Series'
                name='series'
                onChange={handleChange}
              />
              <Input
                type='text'
                label='Sales Tax %'
                name='salesTax'
                value={category.salesTax}
                onChange={handleChange}
                placeholder='Enter sales tax percentage'
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
        ) : (
          <div className='max-h-[70vh] overflow-y-auto'>
            <div className='mb-4 flex items-end justify-between gap-4'>
              <div className='w-1/2'>
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
              <div className='w-1/4'>
                <div className='mb-1 flex items-center justify-between'>
                  <label className='text-sm text-gray-500'>Sales Tax %</label>
                  {!isEditingGlobalSalesTax ? (
                    <button
                      onClick={() => setIsEditingGlobalSalesTax(true)}
                      className='text-sm text-blue-500 hover:text-blue-700'
                    >
                      Edit
                    </button>
                  ) : (
                    <div className='flex gap-2'>
                      <button
                        onClick={handleSaveGlobalSalesTax}
                        className='text-sm text-green-500 hover:text-green-700'
                        disabled={isLoading}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingGlobalSalesTax(false);
                          setGlobalSalesTax('18'); // Reset to default
                        }}
                        className='text-sm text-red-500 hover:text-red-700'
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
                    className='w-full rounded border bg-white p-2'
                    placeholder='Enter sales tax percentage'
                  />
                ) : (
                  <div className='w-full rounded border bg-gray-100 p-2'>
                    {globalSalesTax}%
                  </div>
                )}
              </div>
            </div>
            <div className='flex flex-col gap-4'>
              <div className='grid grid-cols-1 gap-3'>
                {filteredSeries.length > 0 ? (
                  filteredSeries.map((item: BatteryData, index: number) => (
              <div
                key={index}
                      className='rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md'
                    >
                      <div className='grid grid-cols-2 gap-4 md:grid-cols-7'>
                        <div>
                          <span className='text-sm text-gray-500'>Name</span>
                          <p className='font-medium'>{item.name}</p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>Plate</span>
                          <p className='font-medium'>{item.plate}</p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>AH</span>
                          <p className='font-medium'>{item.ah}</p>
                        </div>
                        <div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-500'>
                              Retail Price
                            </span>
                            {editingBattery !== item.name ? (
                              <button
                                onClick={() => {
                                  setEditingBattery(item.name);
                                  setEditingPrice((prev) => ({
                                    ...prev,
                                    [item.name]: item.retailPrice || 0,
                                  }));
                                }}
                                className='text-sm text-blue-500 hover:text-blue-700'
                              >
                                Edit
                              </button>
                            ) : (
                              <div className='flex gap-2'>
                                <button
                                  onClick={() => handleSavePrice(item.name)}
                                  className='text-sm text-green-500 hover:text-green-700'
                                  disabled={isLoading}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingBattery(null);
                                    setEditingPrice({});
                                  }}
                                  className='text-sm text-red-500 hover:text-red-700'
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          {editingBattery === item.name ? (
                            <input
                              type='number'
                              value={
                                editingPrice[item.name] ??
                                item.retailPrice ??
                                ''
                              }
                              onChange={(e) =>
                                handlePriceChange(item.name, e.target.value)
                              }
                              className='mt-1 w-full rounded border p-1'
                              placeholder='Enter price'
                            />
                          ) : (
                            <p className='font-medium'>
                              {item.retailPrice || 'N/A'}
                            </p>
                          )}
                        </div>
                        <div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-500'>
                              Sales Tax (
                              {item.salesTax ?? detailData?.salesTax ?? 18}%)
                            </span>
                          </div>
                          <p className='font-medium'>
                            {item.retailPrice
                              ? (item.retailPrice *
                                  (item.salesTax ??
                                    detailData?.salesTax ??
                                    18)) /
                                100
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>
                            Max Retail Price
                          </span>
                          <p className='font-medium'>
                            {item.maxRetailPrice || 'N/A'}
                          </p>
                        </div>
                        {item.type && (
                          <div>
                            <span className='text-sm text-gray-500'>Type</span>
                            <p className='font-medium'>{item.type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='py-4 text-center text-gray-500'>
                    No batteries found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryLayout;
