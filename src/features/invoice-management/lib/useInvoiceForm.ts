// src/features/invoice-management/lib/useInvoiceForm.ts
// Invoice form state and logic management

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { InvoiceFormData } from '@/entities/invoice';
import { validateForm } from '../shared/validators';

interface UseInvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData) => void;
}

export const useInvoiceForm = ({
  initialData,
  onSubmit,
}: UseInvoiceFormProps) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    customerType: 'WalkIn Customer',
    customerName: '',
    customerAddress: '',
    customerContactNumber: '',
    clientId: undefined,
    products: [],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    receivedAmount: 0,
    remainingAmount: 0,
    paymentMethod: [],
    paymentStatus: 'pending',
    useCustomDate: false,
    customDate: undefined,
    isChargingService: false,
    chargingServices: [],
    // Initialize battery fields
    batteriesRate: 0,
    batteriesCountAndWeight: '',
    ...initialData,
  });

  const [lastSyncedDate, setLastSyncedDate] = useState('');

  // Recalculate totals when data changes
  const calculateTotal = useCallback(
    (transformedProducts?: any[], chargingServices?: any[]) => {
      if (invoiceData.isChargingService) {
        const subtotal = (chargingServices || []).reduce(
          (sum, service) => sum + (service.total || 0),
          0
        );
        const total = subtotal + (invoiceData.taxAmount || 0);
        const remaining = total - (invoiceData.receivedAmount || 0);

        setInvoiceData((prev) => ({
          ...prev,
          subtotal,
          totalAmount: total,
          remainingAmount: Math.max(0, remaining),
        }));
      } else {
        const subtotal = (transformedProducts || []).reduce(
          (sum, product) => sum + (product.totalPrice || 0),
          0
        );
        const total = subtotal + (invoiceData.taxAmount || 0);
        const remaining = total - (invoiceData.receivedAmount || 0);

        setInvoiceData((prev) => ({
          ...prev,
          subtotal,
          totalAmount: total,
          remainingAmount: Math.max(0, remaining),
        }));
      }
    },
    [
      invoiceData.isChargingService,
      invoiceData.taxAmount,
      invoiceData.receivedAmount,
    ]
  );

  // Sync warranty dates with custom date
  const syncWarrantyDatesWithCustomDate = useCallback(
    (customDate: string, accordionData: any, accordionMethods: any) => {
      if (!customDate) return;

      const customDateOnly = customDate.split('T')[0];
      let updatedCount = 0;

      Object.keys(accordionData).forEach((accordionIndex) => {
        const index = parseInt(accordionIndex);
        const currentAccordion = accordionData[index];

        if (currentAccordion && currentAccordion.warrentyDuration) {
          const oldDate = currentAccordion.warrentyStartDate;

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
        console.log(
          `Warranty start dates synced with custom date: ${customDateOnly}`
        );
      }
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent, transformedProducts: any[], accordionData: any) => {
      e.preventDefault();

      if (!validateForm(invoiceData, accordionData)) return;

      const finalData = {
        ...invoiceData,
        products: invoiceData.isChargingService ? [] : transformedProducts,
        chargingServices: invoiceData.isChargingService
          ? invoiceData.chargingServices
          : [],
        subtotal: invoiceData.isChargingService
          ? (invoiceData.chargingServices || []).reduce(
              (sum, service) => sum + (service.total || 0),
              0
            )
          : transformedProducts.reduce(
              (sum, product) => sum + (product.totalPrice || 0),
              0
            ),
        taxAmount: invoiceData.taxAmount || 0,
        totalAmount: invoiceData.isChargingService
          ? (invoiceData.chargingServices || []).reduce(
              (sum, service) => sum + (service.total || 0),
              0
            ) + (invoiceData.taxAmount || 0)
          : transformedProducts.reduce(
              (sum, product) => sum + (product.totalPrice || 0),
              0
            ) + (invoiceData.taxAmount || 0),
        remainingAmount: Math.max(
          0,
          (invoiceData.isChargingService
            ? (invoiceData.chargingServices || []).reduce(
                (sum, service) => sum + (service.total || 0),
                0
              )
            : transformedProducts.reduce(
                (sum, product) => sum + (product.totalPrice || 0),
                0
              )) +
            (invoiceData.taxAmount || 0) -
            (invoiceData.receivedAmount || 0)
        ),
      };

      onSubmit(finalData);
    },
    [invoiceData, onSubmit]
  );

  return {
    invoiceData,
    setInvoiceData,
    handleSubmit,
    calculateTotal,
    syncWarrantyDatesWithCustomDate,
    lastSyncedDate,
    setLastSyncedDate,
  };
};
