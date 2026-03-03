import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { revalidatePathCustom } from '@/actions/revalidatePathCustom';
import Input from '@/components/customInput';
import ProductSection from './ProductSection';
import ChargingServiceSection from './ChargingServiceSection';
import PaymentSection from './PaymentSection';
import { cloneDeep } from 'lodash';
import CustomerSection from './CustomerSection';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { normalizeStockData } from '@/utils/stockUtils';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: any;
  setInvoiceData: (data: any) => void;
  accordionData: any;
  categories: any[];
  customers: any[];
  brandOptions: any[];
  isLoading: boolean;
  accordionMethods: any;
  onSubmit: (data: any) => void;
  onChange: (e: any) => void;
  stock: any[];
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  setInvoiceData,
  accordionData,
  categories,
  customers,
  brandOptions,
  isLoading,
  accordionMethods,
  onSubmit,
  onChange,
  stock,
}) => {
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(-1);

  // Function to sync warranty start dates with custom date
  const syncWarrantyDatesWithCustomDate = useCallback(
    (customDate: string) => {
      if (!customDate) return;

      const customDateOnly = customDate.split('T')[0]; // Extract date part only
      let updatedCount = 0;

      // Update all accordion items to use the custom date for warranty start
      Object.keys(accordionData).forEach((accordionIndex) => {
        const index = parseInt(accordionIndex);
        const currentAccordion = accordionData[index];

        if (currentAccordion && currentAccordion.warrentyDuration) {
          const oldDate = currentAccordion.warrentyStartDate;

          // Only update if the date is different
          if (oldDate !== customDateOnly) {
            accordionMethods.handleAccordionChange(
              index,
              'warrentyStartDate',
              customDateOnly
            );

            updatedCount++;
          }
        }
      });

      if (updatedCount > 0) {
        toast.success(
          `Warranty start dates synced with custom date: ${customDateOnly}`
        );
      }
    },
    [accordionData, accordionMethods]
  );

  // Track if sync has already been performed for the current custom date
  const [lastSyncedDate, setLastSyncedDate] = useState<string>('');

  // Watch for custom date changes and sync warranty dates
  useEffect(() => {
    if (invoiceData?.useCustomDate && invoiceData?.customDate) {
      const customDateOnly = invoiceData.customDate.split('T')[0];

      // Only sync if we haven't already synced this exact date
      if (lastSyncedDate !== customDateOnly) {
        syncWarrantyDatesWithCustomDate(invoiceData.customDate);
        setLastSyncedDate(customDateOnly);
      } else {
      }
    }
  }, [
    invoiceData?.useCustomDate,
    invoiceData?.customDate,
    syncWarrantyDatesWithCustomDate,
    lastSyncedDate,
  ]);

  const transformData = (data: { [key: number]: any }): any[] => {
    return Object.values(data).map((item) => {
      const {
        seriesOption,
        batteryDetails,
        warrentyStartDate,
        warrentyDuration,
        noWarranty,
        ...rest
      } = item;

      return {
        ...rest,
        warrentyStartDate: noWarranty ? '' : warrentyStartDate,
        warrentyDuration: noWarranty ? '0' : warrentyDuration,
        warrentyCode: noWarranty ? 'No Warranty' : item.warrentyCode,
        warrantyEndDate: noWarranty
          ? ''
          : calculateEndDate(item.warrentyStartDate, item.warrentyDuration),
        totalPrice: Number(rest.productPrice) * Number(rest.quantity),
        batteryDetails,
      };
    });
  };

  const calculateEndDate = (
    startDate: string,
    months: number | string
  ): string => {
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return '';
    }

    // Handle empty or invalid months value
    const monthsValue = parseInt(String(months));
    if (isNaN(monthsValue) || monthsValue <= 0) {
      return '';
    }

    const date = new Date(startDate);
    date.setMonth(date.getMonth() + monthsValue);
    return date.toISOString().split('T')[0];
  };

  const validateForm = () => {
    // Validate customer information
    if (invoiceData?.customerType === 'Regular') {
      if (!invoiceData?.customerName || !invoiceData?.customerId) {
        toast.error('Please select a regular customer');
        return false;
      }
    } else {
      if (!invoiceData?.customerName) {
        toast.error('Please enter customer name');
        return false;
      }
      if (!invoiceData?.customerAddress) {
        toast.error('Please enter customer address');
        return false;
      }
    }

    // Validate products based on invoice type
    if (invoiceData?.isChargingService) {
      if (
        !invoiceData?.chargingServices ||
        invoiceData?.chargingServices?.length === 0
      ) {
        toast.error('Please add at least one charging service');
        return false;
      }

      // Validate each charging service
      for (const service of invoiceData?.chargingServices) {
        if (!service.description || service.description.trim() === '') {
          toast.error('Please enter battery name for all charging services');
          return false;
        }
        if (!service.total || isNaN(parseFloat(service.total))) {
          toast.error('Please enter valid amount for all charging services');
          return false;
        }
      }
    } else {
      // Check if any products have been added
      const hasProducts = Object.values(accordionData).some(
        (item: any) =>
          item.brandName || item.series || item.productPrice || item.quantity
      );

      if (hasProducts) {
        const accordionKeys = Object.keys(accordionData);
        for (const key of accordionKeys) {
          const item = accordionData[parseInt(key)];
          if (!item.brandName) {
            toast.error(`Please select brand for Row ${key}`);
            return false;
          }
          if (!item.series) {
            toast.error(`Please select series for Row ${key}`);
            return false;
          }
          if (!item.productPrice || Number(item.productPrice) <= 0) {
            toast.error(`Please enter valid product price for Row ${key}`);
            return false;
          }
          if (!item.quantity || Number(item.quantity) <= 0) {
            toast.error(`Please enter valid quantity for Row ${key}`);
            return false;
          }
        }
      }
    }

    // Validate payment method
    if (
      !invoiceData?.paymentMethod ||
      invoiceData?.paymentMethod.length === 0
    ) {
      toast.error('Please select at least one payment method');
      return false;
    }

    // Validate custom date if toggle is enabled
    if (invoiceData?.useCustomDate === true) {
      if (!invoiceData?.customDate) {
        toast.error('Please select a date and time for the invoice');
        return false;
      }

      const selectedDate = new Date(invoiceData.customDate);
      if (isNaN(selectedDate.getTime())) {
        toast.error('Please select a valid date and time');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      return;
    }

    const formData = { ...invoiceData };
    if (!invoiceData?.paymentMethod?.includes('Old Battery')) {
      formData.batteriesRate = 0;
      formData.batteriesCountAndWeight = '';
    }

    // Ensure custom date fields are properly set
    if (!formData.useCustomDate) {
      formData.customDate = null; // Clear custom date when toggle is off
    }

    // Set customer type and related fields
    formData.customerType = invoiceData?.customerType || 'WalkIn Customer';
    formData.clientName =
      invoiceData?.customerType === 'Regular'
        ? invoiceData?.clientName
        : invoiceData?.customerName;

    // Ensure customerId is included for regular customers
    if (invoiceData?.customerType === 'Regular') {
      formData.customerId = invoiceData?.customerId;
    } else {
      // For walk-in customers, set customerId to null or remove it
      formData.customerId = null;
    }

    // Handle product data based on invoice type
    if (invoiceData?.isChargingService) {
      // For charging services, create multiple product entries with all required fields
      formData.productDetail =
        invoiceData?.chargingServices?.map((service: any) => ({
          brandName: 'Charging Service',
          series: service.description || 'Battery Charging',
          productPrice: parseFloat(String(service.total)) || 0, // Use total as price since quantity is always 1
          quantity: '1',
          totalPrice: parseFloat(String(service.total)) || 0,
          productName: service.description,
          isChargingService: true,
          // Add all required fields that the API expects
          batteryType: 'Charging',
          model: service.description || 'Unknown',
          capacity: 'N/A',
          voltage: 'N/A',
          warranty: 'N/A',
        })) || [];
    } else {
      formData.productDetail = accordionData
        ? Object.values(accordionData).map((item: any) => ({
            brandName: item.brandName,
            series: item.series,
            productPrice: parseFloat(String(item.productPrice)) || 0,
            quantity: String(item.quantity || 1),
            totalPrice: parseFloat(
              String((item.productPrice || 0) * (item.quantity || 1))
            ),
            productName: `${item.brandName} ${item.series}`,
            isChargingService: false,
            // Add all required fields for regular products
            batteryType: item.batteryType || 'Unknown',
            model: item.model || 'Unknown',
            capacity: item.capacity || 'Unknown',
            voltage: item.voltage || 'Unknown',
            warranty: item.warranty || 'N/A',
            // Add warranty fields
            warrentyCode: item.noWarranty ? 'No Warranty' : item.warrentyCode,
            warrentyStartDate: item.noWarranty ? '' : item.warrentyStartDate,
            warrentyDuration: item.noWarranty ? '0' : item.warrentyDuration,
            warrantyEndDate: item.noWarranty ? '' : item.warrantyEndDate,
            noWarranty: item.noWarranty || false,
          }))
        : [];
    }

    const clonedFormData = cloneDeep(formData);
    onSubmit(clonedFormData);
  };

  const handleAccordionClick = (accordionIndex: number) => {
    setExpandedAccordionIndex(
      expandedAccordionIndex === accordionIndex ? -1 : accordionIndex
    );
  };
  // Normalize stock data to ensure consistent data types
  const normalizedStock = normalizeStockData(stock);

  return (
    <Modal
      dialogPanelClass='!w-[90%] !max-w-6xl'
      isOpen={isOpen}
      onClose={onClose}
      title='Create Invoice'
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className='mt-4 flex w-full flex-col gap-2'>
          <CustomerSection
            invoiceData={invoiceData}
            setInvoiceData={setInvoiceData}
            customers={customers}
            onChange={onChange}
          />

          <div className='mb-4'>
            <div className='mb-2 flex items-center justify-between'>
              <label className='text-sm font-medium text-gray-700'>
                Use Custom Date & Time
              </label>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  className='peer sr-only'
                  checked={invoiceData?.useCustomDate || false}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setInvoiceData((prev: any) => ({
                      ...prev,
                      useCustomDate: newValue,
                      customDate: newValue ? prev.customDate : null,
                    }));

                    // If custom date is disabled, reset warranty dates to current date
                    if (!newValue) {
                      const currentDate = new Date()
                        .toISOString()
                        .split('T')[0];
                      Object.keys(accordionData).forEach((accordionIndex) => {
                        const index = parseInt(accordionIndex);
                        const currentAccordion = accordionData[index];

                        if (
                          currentAccordion &&
                          currentAccordion.warrentyDuration
                        ) {
                          accordionMethods.handleAccordionChange(
                            index,
                            'warrentyStartDate',
                            currentDate
                          );
                        }
                      });

                      // Reset the last synced date
                      setLastSyncedDate('');
                    }
                  }}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
              </label>
            </div>

            {invoiceData?.useCustomDate ? (
              <>
                <Input
                  type='datetime-local'
                  label='Invoice Date & Time'
                  name='customDate'
                  value={invoiceData?.customDate || ''}
                  onChange={onChange}
                  required
                />
                <p className='mt-1 text-sm text-gray-600'>
                  Select the date and time for this invoice. Use this for old
                  invoices or specific timing.
                </p>
                <p className='mt-1 text-sm font-medium text-blue-600'>
                  🔄 Warranty start dates will automatically sync with this
                  custom date
                </p>
              </>
            ) : (
              <div className='rounded-lg bg-gray-50 p-3'>
                <p className='text-sm text-gray-600'>
                  Invoice will be created with current date and time.
                </p>
              </div>
            )}
          </div>

          <div className='mb-4'>
            <div className='mb-2 flex items-center justify-between'>
              <label className='text-sm font-medium text-gray-700'>
                Invoice for Battery Charging
              </label>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  className='peer sr-only'
                  checked={invoiceData?.isChargingService || false}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setInvoiceData((prev: any) => {
                      const updatedData = {
                        ...prev,
                        isChargingService: newValue,
                        productName: newValue ? prev.productName : '',
                      };

                      // Auto-create first service when enabling charging mode
                      if (
                        newValue &&
                        (!prev.chargingServices ||
                          prev.chargingServices.length === 0)
                      ) {
                        updatedData.chargingServices = [
                          {
                            id: Date.now().toString(),
                            description: '',
                            quantity: 1,
                            price: 0,
                            total: 0,
                          },
                        ];
                      }

                      return updatedData;
                    });
                  }}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
              </label>
            </div>

            {invoiceData?.isChargingService ? (
              <ChargingServiceSection
                chargingServices={invoiceData?.chargingServices || []}
                expandedAccordionIndex={expandedAccordionIndex}
                onAccordionClick={handleAccordionClick}
                onServiceChange={(index: number, field: string, value: any) => {
                  const updatedServices = [
                    ...(invoiceData?.chargingServices || []),
                  ];
                  updatedServices[index] = {
                    ...updatedServices[index],
                    [field]: value,
                  };

                  // Auto-calculate total when quantity or price changes
                  if (field === 'quantity' || field === 'price') {
                    updatedServices[index].total =
                      (updatedServices[index].quantity || 1) *
                      (updatedServices[index].price || 0);
                  }

                  setInvoiceData((prev: any) => ({
                    ...prev,
                    chargingServices: updatedServices,
                  }));
                }}
                onServiceRemove={(index: number) => {
                  const updatedServices = (
                    invoiceData?.chargingServices || []
                  ).filter((_: any, i: number) => i !== index);
                  setInvoiceData((prev: any) => ({
                    ...prev,
                    chargingServices: updatedServices,
                  }));
                }}
                onServiceAdd={() => {
                  const newService = {
                    id: Date.now().toString(),
                    description: '',
                    quantity: 1,
                    price: 0,
                    total: 0,
                  };
                  setInvoiceData((prev: any) => ({
                    ...prev,
                    chargingServices: [
                      ...(prev.chargingServices || []),
                      newService,
                    ],
                  }));
                }}
              />
            ) : (
              <div className='rounded-lg bg-gray-50 p-3'>
                <p className='text-sm text-gray-600'>
                  Regular battery invoice with product details.
                </p>
              </div>
            )}
          </div>

          {!invoiceData?.isChargingService && (
            <ProductSection
              accordionData={accordionData}
              categories={categories}
              brandOptions={brandOptions}
              expandedAccordionIndex={expandedAccordionIndex}
              onAccordionClick={handleAccordionClick}
              accordionMethods={accordionMethods}
              stock={normalizedStock}
            />
          )}

          <PaymentSection
            invoiceData={invoiceData}
            onChange={onChange}
            setInvoiceData={setInvoiceData}
            accordionData={accordionData}
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
  );
};

export default CreateInvoiceModal;
