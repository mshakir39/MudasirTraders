// src/features/invoice-management/ui/components/InvoiceCreateModal.tsx
// Invoice creation modal - <150 lines (includes all original functionality)

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAtom } from 'jotai';
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
import {
  saveInvoiceCreationStateAtom,
  restoreInvoiceCreationStateAtom,
  activeInvoiceCreationIdAtom,
  invoiceCreationStatesAtom,
  showCreateInvoiceModalAtom,
  deleteInvoiceCreationStateAtom,
  InvoiceCreationState
} from '@/store/sharedAtoms';

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
  // State management atoms
  const [, saveState] = useAtom(saveInvoiceCreationStateAtom);
  const [, restoreState] = useAtom(restoreInvoiceCreationStateAtom);
  const [activeStateId, setActiveStateId] = useAtom(activeInvoiceCreationIdAtom);
  const [savedStates] = useAtom(invoiceCreationStatesAtom);
  const [, setShowCreateModal] = useAtom(showCreateInvoiceModalAtom);
  const [, deleteState] = useAtom(deleteInvoiceCreationStateAtom);

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
  const { customers: customerList, refetchCustomers } = useCustomers();

  // Use custom hooks for form and accordion logic
  const { invoiceData, setInvoiceData, handleSubmit } = useInvoiceForm({
    onSubmit: async (data: InvoiceFormData) => {
      try {
        // Call the original onSubmit function
        const result = await onSubmit(data);

        // Refresh customer list after successful invoice creation
        refetchCustomers();

        // After successful submission, cleanup and close
        // Remove the saved state since invoice was successfully created
        if (activeStateId) {
          deleteState(activeStateId);
        }

        // Clear active state and close modal
        setActiveStateId(null);
        setShowCreateModal(false);
        onClose();
      } catch (error) {
        // If submission fails, don't close the modal
        console.error('Invoice creation failed:', error);
        // The error handling is already done in the parent component
        // Just don't close the modal so user can try again
      }
    },
  });

  const { expandedAccordionIndex, handleAccordionClick } = useAccordionLogic(
    accordionData,
    accordionMethods,
    invoiceData
  );

  // Restore saved state when active state ID changes
  useEffect(() => {
    if (activeStateId) {
      const savedState = savedStates.find((s: InvoiceCreationState) => s.id === activeStateId);
      if (savedState) {
        // Restore invoice data
        setInvoiceData({
          customerName: savedState.customerName,
          customerAddress: savedState.customerAddress,
          customerContactNumber: savedState.customerContactNumber,
          customerType: savedState.customerType as 'Regular Customer' | 'WalkIn Customer',
          products: savedState.products || [],
          subtotal: savedState.subtotal || 0,
          taxAmount: savedState.taxAmount || 0,
          totalAmount: savedState.totalAmount || 0,
          receivedAmount: savedState.receivedAmount || 0,
          remainingAmount: savedState.remainingAmount || 0,
          paymentMethod: savedState.paymentMethod,
          paymentStatus: savedState.paymentStatus as 'pending' | 'paid' | 'partial',
          batteriesCountAndWeight: savedState.batteriesCountAndWeight,
          batteriesRate: savedState.batteriesRate,
          notes: savedState.notes,
          // Additional fields from InvoiceFormData
          invoiceNo: savedState.invoiceNo,
          clientId: savedState.clientId,
          useCustomDate: savedState.useCustomDate,
          customDate: savedState.customDate,
          dueDate: savedState.dueDate,
          isChargingService: savedState.isChargingService,
          chargingServices: savedState.chargingServices,
        });

        // Restore products in accordion from saved state
        if (savedState.products && savedState.products.length > 0) {
          // Convert saved products back to accordion format
          const restoredAccordionData: { [key: number]: any } = {};
          
          savedState.products.forEach((product, index) => {
            restoredAccordionData[index] = {
              brandName: product.brandName || '',
              series: product.series || '',
              productPrice: String(product.productPrice || 0),
              quantity: String(product.quantity || 1),
              warrentyStartDate: product.warrentyStartDate || '',
              warrentyEndDate: product.warrentyEndDate || '',
              warrentyCode: product.warrentyCode || '',
              warrentyDuration: product.warrentyDuration || '',
              noWarranty: product.noWarranty || false,
              seriesOption: [], // Will be populated based on brand selection
              batteryDetails: product.batteryDetails,
            };
          });
          
          setAccordionData(restoredAccordionData);
        }
      }
    }
  }, [activeStateId, savedStates, setInvoiceData, setAccordionData]);

  // NEW: Fetch pending invoices with debouncing
  const fetchPendingInvoices = useCallback(async (customerId: string) => {
    if (!customerId || customerId.trim() === '') {
      setPendingInvoices([]);
      return;
    }

    // Don't fetch if it's the same customer as before
    if (customerId === previousCustomerNameRef.current) {
      return;
    }

    setIsLoadingPending(true);
    try {
      // Call the real API directly
      const response = await fetch(
        `/api/customers/${encodeURIComponent(customerId)}/pending-invoices`
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
      previousCustomerNameRef.current = customerId;
    }
  }, []);

  // NEW: Debounced fetch function
  const debouncedFetchPendingInvoices = useCallback(
    (customerId: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchPendingInvoices(customerId);
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

  // Save current state and close modal
  const handleSaveAndClose = useCallback(() => {
    // Get current products from accordion
    const transformedProducts = transformAccordionData(accordionData);
    
    // Create state object to save
    const stateToSave: Omit<InvoiceCreationState, 'id' | 'createdAt'> = {
      customerName: invoiceData.customerName || '',
      customerAddress: invoiceData.customerAddress || '',
      customerContactNumber: invoiceData.customerContactNumber || '',
      customerType: invoiceData.customerType || 'Regular Customer',
      vehicleNo: '', // Not in InvoiceFormData anymore
      paymentMethod: invoiceData.paymentMethod || ['Cash'],
      batteriesCountAndWeight: invoiceData.batteriesCountAndWeight || '',
      batteriesRate: invoiceData.batteriesRate || 0,
      receivedAmount: invoiceData.receivedAmount || 0,
      isPayLater: false, // Not in InvoiceFormData anymore
      products: transformedProducts,
      subtotal: invoiceData.subtotal || 0,
      taxAmount: invoiceData.taxAmount || 0,
      totalAmount: invoiceData.totalAmount || 0,
      remainingAmount: invoiceData.remainingAmount || 0,
      paymentStatus: invoiceData.paymentStatus || 'pending',
      notes: invoiceData.notes,
      // Additional fields from InvoiceFormData
      invoiceNo: invoiceData.invoiceNo,
      clientId: invoiceData.clientId,
      useCustomDate: invoiceData.useCustomDate,
      customDate: invoiceData.customDate,
      dueDate: invoiceData.dueDate,
      isChargingService: invoiceData.isChargingService,
      chargingServices: invoiceData.chargingServices,
    };

    // Save state - this will either create new or update existing based on activeStateId
    saveState(stateToSave);
    
    // Clear the active state and close modal
    setActiveStateId(null);
    setShowCreateModal(false);
    
    // Also call the original onClose for any additional cleanup
    onClose();
  }, [invoiceData, accordionData, saveState, setShowCreateModal, onClose, activeStateId, setActiveStateId]);

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

          // Remove the saved state since invoice was successfully created
          if (activeStateId) {
            deleteState(activeStateId);
          }

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

          // Clear active state and close modal
          setActiveStateId(null);
          setShowCreateModal(false);
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
    // Use clientId if available (for both regular and walk-in customers), otherwise use customerName
    const searchId = invoiceData.clientId || invoiceData.customerName || '';
    debouncedFetchPendingInvoices(searchId);
  }, [invoiceData.clientId, invoiceData.customerName, debouncedFetchPendingInvoices]);

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
      onClose={handleSaveAndClose} // Save state instead of just closing
      title='Create New Invoice'
      size='large'
      dialogPanelClass='w-full max-w-6xl'
    >
      <InvoiceForm
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        isLoading={isLoading}
        onSubmit={handleFormSubmit}
        onCancel={handleSaveAndClose} // Save state instead of just closing
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
