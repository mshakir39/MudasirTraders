// src/features/invoice-management/ui/InvoiceManagement.tsx
// Main invoice management component - <120 lines

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Invoice,
  InvoiceFilter,
  InvoiceModalState,
  InvoiceModalType,
} from '@/entities/invoice';
import { InvoiceApi } from '@/entities/invoice';
import { useAtom, useSetAtom } from 'jotai';

// Import accordion methods for EditInvoiceModal
import { useAccordionData } from '../lib/useAccordionData';
import { useCustomers } from '../lib/useCustomers';
import {
  InvoiceFilters,
  InvoiceDataGrid,
  InvoiceModals,
  InvoiceDeleteModal,
} from './components';
import { FloatingInvoiceButton } from '@/components/FloatingInvoiceButton';
import InvoiceCreateModal from './components/InvoiceCreateModal';
import {
  categoriesAtom,
  stockAtom,
  invoicesAtom,
  fetchInvoicesAtom,
  fetchStockAtom,
  setInvoicesAtom,
  setStockAtom,
  showCreateInvoiceModalAtom,
  startNewInvoiceCreationAtom
} from '@/store/sharedAtoms';

interface InvoiceManagementProps {
  initialInvoices: Invoice[];
  // Categories and stock now fetched via Jotai atoms
  onCreateInvoice?: () => void;
  className?: string;
}

export const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  initialInvoices,
  onCreateInvoice,
  className = '',
}) => {
  // Use Jotai atoms for categories, stock, and invoices (pre-loaded by GlobalDataProvider)
  const [categories] = useAtom(categoriesAtom);
  const [stock] = useAtom(stockAtom);
  const [globalInvoices] = useAtom(invoicesAtom);
  const fetchInvoices = useSetAtom(fetchInvoicesAtom);
  const fetchStock = useSetAtom(fetchStockAtom);
  const setGlobalInvoices = useSetAtom(setInvoicesAtom);
  const updateGlobalStock = useSetAtom(setStockAtom);
  const [showCreateModal] = useAtom(showCreateInvoiceModalAtom);

  // Show loading state if data is not yet available
  const isDataReady =
    categories &&
    stock &&
    globalInvoices &&
    Array.isArray(categories) &&
    Array.isArray(stock) &&
    Array.isArray(globalInvoices) &&
    categories.length >= 0 &&
    stock.length >= 0 &&
    globalInvoices.length >= 0;

  if (!isDataReady) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Loading invoice data...</p>
        </div>
      </div>
    );
  }
  // Transform initial invoices to include battery fields with defaults
  const transformedInitialInvoices = (initialInvoices || []).map(
    (invoice: any) => ({
      ...invoice,
      batteriesRate: invoice.batteriesRate || 0,
      batteriesCountAndWeight: invoice.batteriesCountAndWeight || '',
    })
  );

  // Initialize accordion data and customers for EditInvoiceModal
  const {
    accordionData,
    setAccordionData,
    resetAccordionData,
    ...accordionMethods
  } = useAccordionData(categories, stock);
  const { customers } = useCustomers();

  const [invoices, setInvoices] = useState<Invoice[]>(
    globalInvoices.length > 0 ? globalInvoices : transformedInitialInvoices
  );
  const [loading, setLoading] = useState(false);

  // Sync local invoices with global state when it changes
  useEffect(() => {
    if (globalInvoices.length > 0) {
      setInvoices(globalInvoices);
    }
  }, [globalInvoices]);
  const [modalState, setModalState] = useState<InvoiceModalState>({
    isOpen: false,
    type: 'create',
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    invoiceId: '',
    invoiceNo: '',
  });

  // Create brand options from categories
  const brandOptions = useMemo(() => {
    try {
      if (
        !categories ||
        !Array.isArray(categories) ||
        categories.length === 0
      ) {
        return [];
      }
      return categories
        .map((category) => ({
          label: category?.brandName || '',
          value: category?.brandName || '',
        }))
        .filter((option) => option.label); // Filter out empty brand names
    } catch (error) {
      return [];
    }
  }, [categories]);

  // Initialize with default filter
  const [filter, setFilter] = useState<InvoiceFilter>({
    customer: '',
    status: 'all', // Changed from 'active' to 'all'
    paymentStatus: 'all',
    dateRange: undefined, // Temporarily remove date filter
  });

  // Get customer options
  const customerOptions = useMemo(() => {
    return InvoiceApi.getCustomerOptions(invoices);
  }, [invoices]);

  // Get payment method options
  const paymentMethodOptions = useMemo(() => {
    return InvoiceApi.getPaymentMethodOptions(invoices);
  }, [invoices]);

  // Filter invoices based on current filter
  const filteredInvoices = useMemo(() => {
    const filtered = InvoiceApi.filterInvoices(invoices, filter);
    return filtered;
  }, [invoices, filter]);

  // Calculate sum of pending and partial payment amounts
  const pendingPartialTotal = useMemo(() => {
    if (filter.paymentStatus !== 'pending' && filter.paymentStatus !== 'partial') {
      return 0;
    }
    return filteredInvoices.reduce((sum, invoice) => {
      const remaining = invoice.remainingAmount || 0;
      return sum + remaining;
    }, 0);
  }, [filteredInvoices, filter.paymentStatus]);

  // Handle opening modal
  const handleOpenModal = useCallback(
    (type: InvoiceModalType, data?: Invoice) => {
      setModalState({
        isOpen: true,
        type,
        data,
      });
    },
    []
  );

  // Handle closing modal
  const handleCloseModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: 'create',
    });
  }, []);

  // Handle invoice creation
  const handleCreateInvoice = useCallback(
    async (invoiceData: Partial<Invoice>) => {
      try {
        setLoading(true);

        // Validate invoice data
        const validation = InvoiceApi.validateInvoice(invoiceData);
        if (!validation.isValid) {
          validation.errors.forEach((error) => toast.error(error));
          return;
        }

        // Show warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => toast.warning(warning));
        }

        // Generate invoice number if not provided
        const lastInvoiceNo =
          invoices.length > 0 ? invoices[0].invoiceNo : undefined;
        const invoiceNo =
          invoiceData.invoiceNo ||
          InvoiceApi.generateInvoiceNumber(lastInvoiceNo);

        // Calculate due date if not provided
        const dueDate =
          invoiceData.dueDate || InvoiceApi.calculateDueDate(new Date());

        const newInvoice: Invoice = {
          id: '', // Will be set by database
          invoiceNo,
          customerName: invoiceData.customerName!,
          customerAddress: invoiceData.customerAddress,
          customerContactNumber: invoiceData.customerContactNumber!,
          customerType: invoiceData.customerType || 'WalkIn Customer',
          products: invoiceData.products!,
          subtotal: invoiceData.subtotal!,
          taxAmount: invoiceData.taxAmount!,
          totalAmount: invoiceData.totalAmount!,
          receivedAmount: invoiceData.receivedAmount || 0,
          remainingAmount: InvoiceApi.calculateRemainingAmount({
            ...invoiceData,
            totalAmount: invoiceData.totalAmount!,
            receivedAmount: invoiceData.receivedAmount || 0,
          } as Invoice),
          paymentMethod: invoiceData.paymentMethod!,
          paymentStatus: InvoiceApi.updatePaymentStatus({
            ...invoiceData,
            totalAmount: invoiceData.totalAmount!,
            receivedAmount: invoiceData.receivedAmount || 0,
          } as Invoice),
          status: 'active',
          useCustomDate: invoiceData.useCustomDate,
          customDate: invoiceData.customDate,
          // Include battery fields from InvoiceFormData
          batteriesRate: invoiceData.batteriesRate || 0,
          batteriesCountAndWeight: invoiceData.batteriesCountAndWeight || '',
          createdDate:
            invoiceData.useCustomDate && invoiceData.customDate
              ? new Date(invoiceData.customDate)
              : new Date(),
          dueDate,
          notes: invoiceData.notes,
        };

        // Call API to create invoice using entity pattern
        const createdInvoice = await InvoiceApi.create(newInvoice);

        console.log('🔍 Debug - Created Invoice:', createdInvoice);
        console.log('🔍 Debug - Current invoices length:', invoices.length);

        // Add to local state (optimistic update)
        setInvoices((prev) => {
          const updated = [createdInvoice, ...prev];
          console.log('🔍 Debug - Updated invoices length:', updated.length);
          return updated;
        });

        // Refresh global invoice state
        console.log('🔄 Fetching invoices from server...');
        await fetchInvoices();
        console.log('✅ Fetch invoices completed');

        // Also refresh stock state in case invoice contained stock items
        await fetchStock();

        // Alternative: Force stock update as backup
        try {
          const stockResponse = await fetch('/api/stock');
          const stockResult = await stockResponse.json();
          if (stockResult.success && Array.isArray(stockResult.data)) {
            updateGlobalStock(stockResult.data);
          }
        } catch (error) {
          console.error('❌ Force stock update failed:', error);
        }

        toast.success('Invoice created successfully');
        handleCloseModal();
      } catch (error) {
        console.error('Error creating invoice:', error);
        toast.error('Failed to create invoice');
      } finally {
        setLoading(false);
      }
    },
    [invoices, handleCloseModal, fetchInvoices, fetchStock, updateGlobalStock]
  );

  // Handle invoice update
  const handleUpdateInvoice = useCallback(
    async (invoiceData: Partial<Invoice>) => {
      try {
        setLoading(true);

        // Validate invoice data
        const validation = InvoiceApi.validateInvoice(invoiceData);
        if (!validation.isValid) {
          validation.errors.forEach((error) => toast.error(error));
          return;
        }

        // TODO: Call API to update invoice
        // const result = await updateInvoice(invoiceData.id!, invoiceData);

        // For now, update local state
        setInvoices((prev) =>
          prev.map((invoice) =>
            invoice.id === invoiceData.id
              ? {
                  ...invoice,
                  ...invoiceData,
                  updatedAt: new Date(),
                }
              : invoice
          )
        );

        // Refresh global invoice state
        await fetchInvoices();

        // Also refresh stock state in case invoice contained stock items
        await fetchStock();

        toast.success('Invoice updated successfully');
        handleCloseModal();
      } catch (error) {
        console.error('Error updating invoice:', error);
        toast.error('Failed to update invoice');
      } finally {
        setLoading(false);
      }
    },
    [handleCloseModal, fetchInvoices, fetchStock]
  );

  // Handle invoice deletion
  const handleDeleteInvoice = useCallback(
    async (invoiceId: string) => {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) return;

      // Show delete confirmation modal
      setDeleteModal({
        isOpen: true,
        invoiceId: invoiceId,
        invoiceNo: invoice.invoiceNo,
      });
    },
    [invoices]
  );

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    try {
      setLoading(true);

      // Call the comprehensive delete API
      const response = await fetch('/api/invoice', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deleteModal.invoiceId }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from local state
        setInvoices((prev) =>
          prev.filter((inv) => inv.id !== deleteModal.invoiceId)
        );

        // Refresh global invoice state
        await fetchInvoices();

        // Also refresh stock state in case invoice contained stock items
        await fetchStock();

        toast.success(`Invoice ${deleteModal.invoiceNo} deleted successfully`);
        setDeleteModal({ isOpen: false, invoiceId: '', invoiceNo: '' });
      } else {
        toast.error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  }, [deleteModal.invoiceId, deleteModal.invoiceNo, fetchInvoices, fetchStock]);

  // Handle delete cancellation
  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({ isOpen: false, invoiceId: '', invoiceNo: '' });
  }, []);

  // Handle adding payment
  const handleAddPayment = useCallback(
    async (invoiceId: string, paymentAmount: number, paymentMethod: string) => {
      try {
        setLoading(true);

        // Call API to add payment
        const response = await fetch('/api/invoice', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: invoiceId,
            additionalPayment: paymentAmount.toString(),
            paymentMethod: [paymentMethod],
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to add payment');
          return;
        }

        // Update local state with the response data
        setInvoices((prev) =>
          prev.map((invoice) => {
            if (invoice.id === invoiceId) {
              const newReceivedAmount =
                result.receivedAmount ||
                (invoice.receivedAmount || 0) + paymentAmount;
              const batteryRate = invoice.batteriesRate || 0;
              const additionalPayments = (
                result.additionalPayment ||
                invoice.additionalPayment ||
                []
              ).reduce(
                (sum: number, payment: any) => sum + (payment.amount || 0),
                0
              );
              const newRemainingAmount =
                result.remainingAmount !== undefined
                  ? result.remainingAmount
                  : Math.max(
                      0,
                      (invoice.totalAmount || 0) -
                        newReceivedAmount -
                        batteryRate -
                        additionalPayments
                    );

              return {
                ...invoice,
                receivedAmount: newReceivedAmount,
                remainingAmount: newRemainingAmount,
                paymentStatus:
                  result.paymentStatus ||
                  (newRemainingAmount <= 0
                    ? 'paid'
                    : newReceivedAmount > 0
                      ? 'partial'
                      : 'pending'),
                updatedAt: new Date(),
                // Update additionalPayment array if returned from API
                additionalPayment:
                  result.additionalPayment || invoice.additionalPayment,
              };
            }
            return invoice;
          })
        );

        // Refresh global invoice state
        await fetchInvoices();

        // Also refresh stock state in case invoice contained stock items
        await fetchStock();

        toast.success('Payment added successfully');
        handleCloseModal(); // Close modal after successful payment
      } catch (error) {
        console.error('Error adding payment:', error);
        toast.error('Failed to add payment');
      } finally {
        setLoading(false);
      }
    },
    [handleCloseModal, fetchInvoices, fetchStock]
  );

  // Listen for consolidation refresh events
  useEffect(() => {
    const handleConsolidationRefresh = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(
        '🔄 Received consolidation refresh event:',
        customEvent.detail
      );

      try {
        // Refresh invoices and stock (same as normal invoice creation)
        await fetchInvoices();
        console.log('✅ Invoices refreshed after consolidation');

        console.log('🔄 Refreshing stock after consolidation...');
        await fetchStock();
        console.log('✅ Stock refreshed after consolidation');
      } catch (error) {
        console.warn('⚠️ Failed to refresh after consolidation:', error);
      }
    };

    // Add event listener
    window.addEventListener(
      'consolidation-refresh',
      handleConsolidationRefresh
    );

    // Cleanup event listener
    return () => {
      window.removeEventListener(
        'consolidation-refresh',
        handleConsolidationRefresh
      );
    };
  }, [fetchInvoices, fetchStock]);

  // Refresh invoices data

  if (loading && invoices.length === 0) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <InvoiceFilters
        filter={filter}
        onFilterChange={setFilter}
        customerOptions={customerOptions}
        paymentMethodOptions={paymentMethodOptions}
      />

      <InvoiceDataGrid
        invoices={filteredInvoices}
        onCreateInvoice={() => handleOpenModal('create')}
        onPreview={(invoice) => handleOpenModal('preview', invoice)}
        onEditInvoice={(invoice) => handleOpenModal('edit', invoice)}
        onAddPayment={(invoice) => handleOpenModal('payment', invoice)}
        onDeleteInvoice={handleDeleteInvoice}
        pendingPartialTotal={pendingPartialTotal}
        onPreviewReplacement={(replacementInvoiceId) => {
          // Find the replacement invoice by ID and open preview modal
          const replacementInvoice = invoices.find(
            (inv) => inv.id === replacementInvoiceId
          );
          if (replacementInvoice) {
            handleOpenModal('preview', replacementInvoice);
          } else {
            toast.error('Replacement invoice not found');
          }
        }}
      />

      <InvoiceModals
        modalState={modalState}
        onClose={handleCloseModal}
        onCreateInvoice={handleCreateInvoice}
        onUpdateInvoice={handleUpdateInvoice}
        onAddPayment={handleAddPayment}
        categories={categories}
        customers={customers}
        stock={stock}
        isLoading={loading}
        accordionData={accordionData}
      />

      {/* New state-aware create modal */}
      <InvoiceCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          // This will trigger the save and close functionality in the modal itself
          // The modal's handleSaveAndClose will handle saving state and closing
        }}
        onSubmit={handleCreateInvoice}
        isLoading={loading}
        categories={categories}
        customers={customers}
        stock={stock}
      />

      <FloatingInvoiceButton />

      <InvoiceDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        invoiceNo={deleteModal.invoiceNo}
        isLoading={loading}
      />
    </div>
  );
};
