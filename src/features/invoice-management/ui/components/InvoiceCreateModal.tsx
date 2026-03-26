// src/features/invoice-management/ui/components/InvoiceCreateModal.tsx
// Invoice creation modal - <150 lines (includes all original functionality)

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import {
  InvoiceForm,
  InvoiceCustomerSection,
  InvoiceProductsSection,
  InvoicePaymentSection,
  InvoiceDateSection,
} from './index';
import { InvoiceFormData } from '@/entities/invoice';
import { useAccordionData } from '../../lib/useAccordionData';
import { useCustomers } from '../../lib/useCustomers';
import { useInvoiceForm } from '../../lib/useInvoiceForm';
import { useAccordionLogic } from '../../lib/useAccordionLogic';
import {
  transformAccordionData,
  calculateInvoiceTotals,
} from '../../shared/transformers';
import { PendingInvoice } from '@/entities/invoice/model/types';
import { FaExclamationTriangle } from 'react-icons/fa';

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceFormData) => void;
  isLoading: boolean;
  categories: any[];
  customers: any[];
  stock: any[];
}

const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  categories,
  customers,
  stock,
}) => {
  // NEW: Add pending invoices state with debouncing
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  // Debouncing refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCustomerNameRef = useRef<string>('');

  // Initialize accordion data and customers
  const {
    accordionData,
    setAccordionData,
    resetAccordionData,
    ...accordionMethods
  } = useAccordionData(categories, stock);
  const { customers: customerList } = useCustomers();

  // Use custom hooks for form and accordion logic
  const { invoiceData, setInvoiceData, handleSubmit } = useInvoiceForm({
    onSubmit,
  });

  const { expandedAccordionIndex, handleAccordionClick } = useAccordionLogic(
    accordionData,
    accordionMethods,
    invoiceData
  );

  // NEW: Fetch pending invoices with debouncing
  const fetchPendingInvoices = useCallback(async (customerName: string) => {
    if (!customerName || customerName.trim() === '') {
      setPendingInvoices([]);
      return;
    }

    // Don't fetch if it's the same customer as before
    if (customerName === previousCustomerNameRef.current) {
      return;
    }

    setIsLoadingPending(true);
    try {
      // Call the real API directly
      const response = await fetch(
        `/api/customers/${encodeURIComponent(customerName)}/pending-invoices`
      );

      const result = await response.json();

      if (result.success) {
        setPendingInvoices(result.data || []);
      } else {
        console.error('❌ Failed to fetch pending invoices:', result.error);
        setPendingInvoices([]);
      }
    } catch (error) {
      console.error('❌ Error fetching pending invoices:', error);
      setPendingInvoices([]);
    } finally {
      setIsLoadingPending(false);
      previousCustomerNameRef.current = customerName;
    }
  }, []);

  // NEW: Debounced fetch function
  const debouncedFetchPendingInvoices = useCallback(
    (customerName: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchPendingInvoices(customerName);
      }, 500); // 500ms delay
    },
    [fetchPendingInvoices]
  );

  // NEW: Calculate consolidation totals
  const calculateConsolidationTotals = () => {
    const pendingRemainingTotal = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.remainingAmount || 0),
      0
    );
    const transformedProducts = transformAccordionData(accordionData);
    const newTotal = transformedProducts.reduce(
      (sum, product) => sum + (product.totalPrice || 0),
      0
    );
    const grandTotal = pendingRemainingTotal + newTotal;

    return {
      pendingRemainingTotal,
      newTotal,
      grandTotal,
    };
  };

  // Handle form submission with transformed data
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    const transformedProducts = transformAccordionData(accordionData);

    // If we have pending invoices, handle consolidation
    if (pendingInvoices.length > 0) {
      const { pendingRemainingTotal, newTotal, grandTotal } =
        calculateConsolidationTotals();

      console.log('Consolidation needed:', {
        pendingInvoices: pendingInvoices.length,
        pendingRemainingTotal,
        newTotal,
        grandTotal,
      });

      // Prepare consolidation data
      const pendingInvoiceIds = pendingInvoices.map((inv) => inv.id);
      const previousAmounts = pendingInvoices.map(
        (inv) => inv.remainingAmount || 0
      );

      console.log('🔍 Debug - Pending invoices data:', {
        pendingInvoices: pendingInvoices.map((inv) => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          remainingAmount: inv.remainingAmount,
          paymentStatus: inv.paymentStatus,
        })),
        pendingInvoiceIds: pendingInvoiceIds,
        previousAmounts: previousAmounts,
      });

      // Transform products to match backend expectations
      const transformedNewProducts = transformedProducts.map((product) => ({
        ...product,
        unitPrice: product.productPrice, // Map productPrice to unitPrice for backend
        brandName: product.brandName,
        series: product.series,
        quantity: parseInt(product.quantity) || 1,
        totalPrice: product.totalPrice,
      }));

      console.log('🔍 Debug - Product transformation:', {
        originalProducts: transformedProducts,
        transformedProducts: transformedNewProducts,
        sampleProduct: transformedNewProducts[0],
      });

      try {
        // Call consolidation API
        console.log('🔍 Debug - Sending consolidation request:', {
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerContactNumber,
          customerAddress: invoiceData.customerAddress || '',
          newProducts: transformedNewProducts,
          pendingInvoiceIds: pendingInvoiceIds,
          previousAmounts: previousAmounts,
          notes: `Consolidated invoice with ${pendingInvoices.length} previous invoices`,
        });

        const consolidationResponse = await fetch('/api/invoices/consolidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: invoiceData.customerName,
            customerPhone: invoiceData.customerContactNumber,
            customerAddress: invoiceData.customerAddress || '',
            newProducts: transformedNewProducts,
            pendingInvoiceIds: pendingInvoiceIds,
            previousAmounts: previousAmounts,
            notes: `Consolidated invoice with ${pendingInvoices.length} previous invoices`,
            receivedAmount: invoiceData.receivedAmount || 0,
            paymentMethod: invoiceData.paymentMethod || ['Cash'],
            batteriesCountAndWeight: invoiceData.batteriesCountAndWeight || '',
            batteriesRate: invoiceData.batteriesRate || 0,
            customerType: invoiceData.customerType || 'WalkIn Customer',
            clientId: invoiceData.clientId || null,
          }),
        });

        console.log(
          '🔍 Debug - Consolidation response status:',
          consolidationResponse.status
        );

        if (!consolidationResponse.ok) {
          const errorText = await consolidationResponse.text();
          console.error(
            '🔍 Debug - Consolidation failed with status:',
            consolidationResponse.status,
            errorText
          );
          toast.error(`Consolidation failed: ${errorText}`);
          return;
        }

        const consolidationResult = await consolidationResponse.json();
        console.log('🔍 Debug - Consolidation result:', consolidationResult);

        if (consolidationResult.success) {
          console.log('✅ Consolidation successful:', consolidationResult.data);

          // Show success message to user
          toast.success(
            `Successfully consolidated ${pendingInvoices.length} invoices into new invoice #${consolidationResult.data?.newInvoice?.invoiceNumber?.slice(-6)}`
          );

          // Refresh invoices and stock (same as normal invoice creation)
          console.log('🔄 Refreshing invoices after consolidation...');
          try {
            // Trigger refresh event that parent can listen to
            window.dispatchEvent(
              new CustomEvent('consolidation-refresh', {
                detail: {
                  source: 'consolidation',
                  timestamp: Date.now(),
                  invoiceData: consolidationResult.data?.newInvoice,
                },
              })
            );

            console.log('✅ Consolidation refresh event dispatched');
          } catch (refreshError) {
            console.warn('⚠️ Failed to dispatch refresh event:', refreshError);
            // Don't fail the consolidation if refresh fails
          }

          // Close modal and reset form
          onClose();
          return;
        } else {
          console.error('❌ Consolidation failed:', consolidationResult.error);
          toast.error(`Consolidation failed: ${consolidationResult.error}`);
          return;
        }
      } catch (error: any) {
        console.error('❌ Error during consolidation:', error);
        toast.error(
          `Error during consolidation: ${error?.message || 'Unknown error'}`
        );
        return;
      }
    }

    // If no consolidation needed, proceed with normal invoice creation
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

  // NEW: Fetch pending invoices when customer changes (with debouncing)
  useEffect(() => {
    debouncedFetchPendingInvoices(invoiceData.customerName);
  }, [invoiceData.customerName, debouncedFetchPendingInvoices]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetAccordionData();
      setPendingInvoices([]); // Reset pending invoices
      previousCustomerNameRef.current = ''; // Reset previous customer name
      // Reset form data handled by useInvoiceForm hook
    }
  }, [isOpen, resetAccordionData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Create New Invoice'
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

              {/* NEW: Loading indicator for pending invoices */}
              {/* {isLoadingPending && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-sm text-blue-700">Checking for pending invoices...</span>
                  </div>
                </div>
              )} */}

              {/* NEW: Pending Invoices Alert */}
              {pendingInvoices.length > 0 && (
                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <FaExclamationTriangle
                        className='h-5 w-5 text-yellow-400'
                        aria-hidden='true'
                      />
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-yellow-800'>
                        Pending Invoices Found
                      </h3>
                      <div className='mt-2 text-sm text-yellow-700'>
                        <p>
                          This customer has{' '}
                          <span className='font-medium'>
                            {pendingInvoices.length}
                          </span>{' '}
                          pending invoice(s):
                        </p>
                        <ul className='mt-1 list-inside list-disc space-y-1'>
                          {pendingInvoices.map((invoice) => (
                            <li key={invoice.id}>
                              Invoice #{invoice.invoiceNo?.slice(-6) || 'N/A'} -
                              <span className='font-medium'>
                                {' '}
                                Rs{' '}
                                {(
                                  invoice.remainingAmount || 0
                                ).toLocaleString()}
                              </span>
                              {invoice.paymentStatus === 'partial' && (
                                <span className='ml-1 text-xs text-yellow-600'>
                                  (partial)
                                </span>
                              )}
                              {invoice.paymentStatus === 'pending' && (
                                <span className='ml-1 text-xs text-red-600'>
                                  (unpaid)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className='mt-2 border-t border-yellow-200 pt-2'>
                          <p className='font-medium text-yellow-800'>
                            Total remaining: Rs{' '}
                            {pendingInvoices
                              .reduce(
                                (sum, invoice) =>
                                  sum + (invoice.remainingAmount || 0),
                                0
                              )
                              .toLocaleString()}
                          </p>
                          <p className='mt-1 text-xs text-yellow-600'>
                            This amount will be consolidated into the new
                            invoice.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <InvoiceDateSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
              />
            </div>
          </div>

          <div className='hidden lg:relative lg:block'>
            <div className='absolute bottom-0 left-0 top-0 w-px bg-gray-200'></div>
            <div className='flex h-full flex-col pl-6'>
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

          <div className='hidden lg:relative lg:block'>
            <div className='absolute bottom-0 left-0 top-0 w-px bg-gray-200'></div>
            <div className='flex h-full flex-col pl-6'>
              <InvoicePaymentSection
                invoiceData={invoiceData}
                setInvoiceData={setInvoiceData}
                previousRemainingAmount={
                  pendingInvoices.length > 0
                    ? pendingInvoices.reduce(
                        (sum, invoice) => sum + (invoice.remainingAmount || 0),
                        0
                      )
                    : 0
                }
              />
            </div>
          </div>
        </div>
      </InvoiceForm>
    </Modal>
  );
};

export default InvoiceCreateModal;
