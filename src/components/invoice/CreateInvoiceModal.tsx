import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { cloneDeep } from 'lodash';
import CustomerSection from './CustomerSection';
import ProductSection from './ProductSection';
import PaymentSection from './PaymentSection';

const Modal = React.lazy(() => import('@/components/modal'));
const Button = React.lazy(() => import('@/components/button'));
const Input = React.lazy(() => import('@/components/customInput'));

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

  const transformData = (data: { [key: number]: any }): any[] => {
    return Object.values(data).map((item) => {
      const { seriesOption, batteryDetails, warrentyStartDate, warrentyDuration, ...rest } = item;

      return {
        ...rest,
        warrentyStartDate,
        warrentyDuration,
        warrantyEndDate: calculateEndDate(item.warrantyStartDate, item.warrantyDuration),
        totalPrice: Number(rest.productPrice) * Number(rest.quantity),
        batteryDetails,
      };
    });
  };

  const calculateEndDate = (startDate: string, months: number | string): string => {
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return '';
    }

    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months as string));
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

    // Check if any products have been added
    const hasProducts = Object.values(accordionData).some((item: any) =>
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

    // Validate payment method
    if (!invoiceData?.paymentMethod || invoiceData?.paymentMethod.length === 0) {
      toast.error('Please select at least one payment method');
      return false;
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
    
    // Set customer type and related fields
    formData.customerType = invoiceData?.customerType || 'WalkIn Customer';
    formData.clientName = invoiceData?.customerType === 'Regular' ? invoiceData?.clientName : invoiceData?.customerName;
    
    // Ensure customerId is included for regular customers
    if (invoiceData?.customerType === 'Regular') {
      formData.customerId = invoiceData?.customerId;
    } else {
      // For walk-in customers, set customerId to null or remove it
      formData.customerId = null;
    }
    
    formData.productDetail = transformData(accordionData);

    console.log('📋 Form data being submitted:', formData);
    console.log('👤 Customer ID:', formData.customerId);
    console.log('🏷️ Customer Type:', formData.customerType);

    const clonedFormData = cloneDeep(formData);
    onSubmit(clonedFormData);
  };

  const handleAccordionClick = (accordionIndex: number) => {
    setExpandedAccordionIndex(
      expandedAccordionIndex === accordionIndex ? -1 : accordionIndex
    );
  };

  return (
    <Modal
      dialogPanelClass='!w-[70%]'
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

          <Input
            type='text'
            label='Vehicle Number'
            name='vehicleNo'
            value={invoiceData?.vehicleNo || ''}
            maxLength={20}
            onChange={onChange}
          />

          <ProductSection
            accordionData={accordionData}
            categories={categories}
            brandOptions={brandOptions}
            expandedAccordionIndex={expandedAccordionIndex}
            onAccordionClick={handleAccordionClick}
            accordionMethods={accordionMethods}
            stock={stock}
          />

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