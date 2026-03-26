// src/features/invoice-management/ui/components/InvoiceEditModalJotai.tsx
// Jotai version of InvoiceEditModal - for testing prop drilling elimination

'use client';

import React, { useEffect } from 'react';
import Modal from '@/components/modal';
import { InvoiceForm, InvoiceProductsSection, InvoicePaymentSection, InvoiceDateSection } from './index';
import { Invoice, InvoiceFormData } from '@/entities/invoice';
import { useAccordionData } from '../../lib/useAccordionData';
import { useCustomers } from '../../lib/useCustomers';
import { useInvoiceForm } from '../../lib/useInvoiceForm';
import { useAccordionLogic } from '../../lib/useAccordionLogic';
import { transformAccordionData, calculateInvoiceTotals } from '../../shared/transformers';
import { useAtom, useSetAtom } from 'jotai';
import { invoiceFormDataAtom, setInvoiceFormDataAtom, accordionDataAtom, setAccordionDataAtom, expandedAccordionIndexAtom, setExpandedAccordionIndexAtom } from '@/store/invoiceAtoms';

interface InvoiceEditModalJotaiProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSubmit: (data: InvoiceFormData) => void;
  isLoading: boolean;
  categories: any[];
  customers: any[];
  stock: any[];
}

export const InvoiceEditModalJotai: React.FC<InvoiceEditModalJotaiProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
  isLoading,
  categories,
  customers,
  stock
}) => {
  // Initialize accordion data and customers
  const {
    accordionData,
    setAccordionData,
    resetAccordionData,
    ...accordionMethods
  } = useAccordionData(categories, stock);
  const { customers: customerList } = useCustomers();

  // Jotai atoms
  const [invoiceData, setInvoiceData] = useAtom(invoiceFormDataAtom);
  const [accordionDataState, setAccordionDataState] = useAtom(accordionDataAtom);
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useAtom(expandedAccordionIndexAtom);
  const setInvoiceFormDataAtomAction = useSetAtom(setInvoiceFormDataAtom);
  const setAccordionDataAtomAction = useSetAtom(setAccordionDataAtom);
  const setExpandedAccordionIndexAtomAction = useSetAtom(setExpandedAccordionIndexAtom);

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

  // Initialize Jotai atoms with invoice data when modal opens
  useEffect(() => {
    if (isOpen) {
      setInvoiceFormDataAtomAction(initialFormData);
    }
  }, [isOpen, invoice.id, setInvoiceFormDataAtomAction]);

  // Initialize accordion data with existing products
  useEffect(() => {
    if (isOpen && invoice.products && invoice.products.length > 0) {
      const calculateWarrentyDuration = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return '';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return monthsDiff.toString();
      };

      // Convert existing products to accordion format
      const initialAccordionData: any = {};
      invoice.products.forEach((product, index) => {
        initialAccordionData[index] = {
          brandName: product.brandName,
          series: product.series,
          quantity: product.quantity.toString(),
          productPrice: product.productPrice.toString(),
          totalPrice: product.totalPrice.toString(),
          warrentyCode: product.warrentyCode,
          warrentyStartDate: product.warrentyStartDate,
          warrentyDuration: calculateWarrentyDuration(product.warrentyStartDate, product.warrentyEndDate),
          seriesOption: [],
          noWarranty: product.noWarranty || false,
          batteryDetails: product.batteryDetails,
        };
      });
      setAccordionDataAtomAction(initialAccordionData);
    }
  }, [isOpen, invoice.products, setAccordionDataAtomAction]);

  // Use custom hooks for form and accordion logic (still using local state for now)
  const {
    handleSubmit,
  } = useInvoiceForm({ onSubmit, initialData: initialFormData });

  const {
    expandedAccordionIndex: expandedIndex,
    handleAccordionClick,
  } = useAccordionLogic(accordionData, accordionMethods, invoiceData);

  // Update Jotai atoms when local state changes
  useEffect(() => {
    setExpandedAccordionIndexAtomAction(expandedIndex);
  }, [expandedIndex, setExpandedAccordionIndexAtomAction]);

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
    
    setInvoiceData(prev => ({
      ...prev,
      ...totals
    }));
  }, [accordionData, invoiceData.chargingServices, invoiceData.taxAmount, invoiceData.receivedAmount, invoiceData.isChargingService]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetAccordionData();
      // Reset Jotai atoms
      setAccordionDataAtomAction({});
      setExpandedAccordionIndexAtomAction(-1);
    }
  }, [isOpen, resetAccordionData, setAccordionDataAtomAction, setExpandedAccordionIndexAtomAction]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Invoice #${invoice.invoiceNo}`}
      size="large"
      dialogPanelClass="w-full max-w-6xl"
    >
      <InvoiceForm
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        isLoading={isLoading}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col h-full">
            <div className="space-y-4">
              {/* Customer section placeholder */}
              <div className="p-4 border rounded">
                <p>Customer section (InvoiceCustomerSectionJotai not found)</p>
              </div>
              <InvoiceDateSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
              />
            </div>
          </div>
          
          <div className="hidden lg:block lg:relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
            <div className="pl-6 flex flex-col h-full">
              <InvoiceProductsSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
                categories={categories}
                stock={stock}
                accordionData={accordionData}
                expandedAccordionIndex={expandedAccordionIndex}
                onAccordionClick={handleAccordionClick}
                accordionMethods={accordionMethods}
                brandOptions={categories.map((category) => ({
                  label: category.brandName || '',
                  value: category.brandName || '',
                }))}
              />
            </div>
          </div>
          
          <div className="hidden lg:block lg:relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
            <div className="pl-6 flex flex-col h-full">
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
