// src/features/invoice-management/ui/components/InvoiceEditModal.tsx
// Invoice edit modal - <80 lines

'use client';

import React, { useEffect } from 'react';
import Modal from '@/components/modal';
import {
  InvoiceForm,
  InvoiceCustomerSection,
  InvoiceProductsSectionJotai,
  InvoicePaymentSection,
  InvoiceDateSection,
} from './index';
import { Invoice, InvoiceFormData } from '@/entities/invoice';
import { useAccordionData } from '../../lib/useAccordionData';
import { useCustomers } from '../../lib/useCustomers';
import { useInvoiceForm } from '../../lib/useInvoiceForm';
import { useAccordionLogic } from '../../lib/useAccordionLogic';
import {
  transformAccordionData,
  calculateInvoiceTotals,
} from '../../shared/transformers';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSubmit: (data: InvoiceFormData) => void;
  isLoading: boolean;
  categories: any[];
  customers: any[];
  stock: any[];
}

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
  isLoading,
  categories,
  customers,
  stock,
}) => {
  // Initialize accordion data and customers
  const {
    accordionData,
    setAccordionData,
    resetAccordionData,
    ...accordionMethods
  } = useAccordionData(categories, stock);
  const { customers: customerList } = useCustomers();

  // Initialize form with invoice data
  const initialFormData: InvoiceFormData = {
    invoiceNo: invoice.invoiceNo,
    customerType: invoice.customerType || 'WalkIn Customer',
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress,
    customerContactNumber: invoice.customerContactNumber,
    products: invoice.products || [],
    subtotal: invoice.subtotal || 0,
    taxAmount: invoice.taxAmount || 0,
    totalAmount: invoice.totalAmount || 0,
    receivedAmount: invoice.receivedAmount || 0,
    remainingAmount: invoice.remainingAmount || 0,
    paymentMethod: invoice.paymentMethod || [],
    paymentStatus: invoice.paymentStatus || 'pending',
    useCustomDate: invoice.useCustomDate || false,
    customDate: invoice.customDate,
  };

  // Use custom hooks for form and accordion logic
  const { invoiceData, setInvoiceData, handleSubmit } = useInvoiceForm({
    onSubmit,
    initialData: initialFormData,
  });

  const { expandedAccordionIndex, handleAccordionClick } = useAccordionLogic(
    accordionData,
    accordionMethods,
    invoiceData
  );

  // Initialize accordion data with existing products
  useEffect(() => {
    const calculateWarrentyDuration = (startDate: string, endDate: string) => {
      if (!startDate || !endDate) return '';
      const start = new Date(startDate);
      const end = new Date(endDate);
      const monthsDiff =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return monthsDiff.toString();
    };

    if (invoice.products && invoice.products.length > 0) {
      // Convert existing products to accordion format
      const initialAccordionData: any = {};
      invoice.products.forEach((product, index) => {
        initialAccordionData[index] = {
          brandName: product.brandName,
          series: product.series,
          quantity: product.quantity,
          productPrice: product.productPrice,
          totalPrice: product.totalPrice,
          warrentyCode: product.warrentyCode,
          warrentyStartDate: product.warrentyStartDate,
          warrentyDuration: calculateWarrentyDuration(
            product.warrentyStartDate,
            product.warrentyEndDate
          ),
          // Add other necessary fields
        };
      });
      setAccordionData(initialAccordionData);
    }
  }, [invoice.products, setAccordionData]);

  // Handle form submission with transformed data
  const handleFormSubmit = (e: React.FormEvent) => {
    const transformedProducts = transformAccordionData(accordionData);
    handleSubmit(e, transformedProducts, accordionData);
  };

  // Recalculate totals when data changes
  useEffect(() => {
    const transformedProducts = transformAccordionData(accordionData);
    const totals = calculateInvoiceTotals(
      invoiceData.isChargingService || false,
      transformedProducts,
      invoiceData.chargingServices || [],
      invoiceData.taxAmount || 0,
      invoiceData.receivedAmount || 0
    );

    setInvoiceData((prev) => ({
      ...prev,
      ...totals,
    }));
  }, [
    accordionData,
    invoiceData.chargingServices,
    invoiceData.taxAmount,
    invoiceData.receivedAmount,
    invoiceData.isChargingService,
  ]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetAccordionData();
      // Reset form data handled by useInvoiceForm hook
    }
  }, [isOpen, resetAccordionData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Invoice #${invoice.invoiceNo}`}
      size='large'
      dialogPanelClass='w-full max-w-6xl'
    >
      <InvoiceForm
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        isLoading={isLoading}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
      >
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='flex h-full flex-col'>
            <div className='space-y-4'>
              <InvoiceCustomerSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
                customers={customerList}
              />
              <InvoiceDateSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
              />
            </div>
          </div>

          <div className='hidden lg:relative lg:block'>
            <div className='absolute bottom-0 left-0 top-0 w-px bg-gray-200'></div>
            <div className='flex h-full flex-col pl-6'>
              <InvoiceProductsSectionJotai
                categories={categories}
                stock={stock}
                brandOptions={categories.map((category) => ({
                  label: category.brandName || '',
                  value: category.brandName || '',
                }))}
              />
            </div>
          </div>

          <div className='hidden lg:relative lg:block'>
            <div className='absolute bottom-0 left-0 top-0 w-px bg-gray-200'></div>
            <div className='flex h-full flex-col pl-6'>
              <InvoicePaymentSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
              />
            </div>
          </div>
        </div>
      </InvoiceForm>
    </Modal>
  );
};
