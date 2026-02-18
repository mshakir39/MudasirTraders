'use client';
import React, { useState, useMemo, useOptimistic, useActionState } from 'react';
import { toast } from 'react-toastify';
import { POST, PATCH } from '@/utils/api';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { ICategory } from '../../interfaces';

// Component imports
import InvoiceGrid from '@/components/invoice/InvoiceGrid';
import CreateInvoiceModal from '@/components/invoice/CreateInvoiceModal';
import ProductDetailModal from '@/components/invoice/ProductDetailModal';
import EditInvoiceModal from '@/components/invoice/EditInvoiceModal';
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal';

// Hooks and utilities
import { useInvoiceForm } from '@/components/invoice/useInvoiceForm';
import { useAccordionData } from '@/components/invoice/useAccordionData';
import { useCustomers } from '@/components/invoice/useCustomers';

interface InvoiceLayoutProps {
  categories: ICategory[];
  invoices: any;
  stock: any[];
}

const InvoicesLayout: React.FC<InvoiceLayoutProps> = ({
  categories,
  invoices,
  stock,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('');
  const [modalData, setModalData] = useState<any>([]);
  const [editInvoiceData, setEditInvoiceData] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Custom hooks
  const { invoiceData, setInvoiceData, handleChange, resetInvoiceData } =
    useInvoiceForm();
  const {
    accordionData,
    setAccordionData,
    resetAccordionData,
    ...accordionMethods
  } = useAccordionData(categories, stock);
  const { customers } = useCustomers();

  // React 19: Optimistic updates for invoice operations
  const [optimisticInvoices, addOptimisticInvoice] = useOptimistic(
    invoices,
    (state: any[], newInvoice: any) => {
      if (newInvoice.action === 'create') {
        return [newInvoice.data, ...state];
      }
      if (newInvoice.action === 'update') {
        return state.map((invoice: any) =>
          invoice.invoiceNo === newInvoice.invoiceNo
            ? { ...invoice, ...newInvoice.data }
            : invoice
        );
      }
      if (newInvoice.action === 'delete') {
        return state.filter(
          (invoice: any) => invoice.invoiceNo !== newInvoice.invoiceNo
        );
      }
      return state;
    }
  );

  // React 19: useActionState for invoice creation
  const [createInvoiceState, createInvoiceAction, isCreatePending] =
    useActionState(async (prevState: any, formData: FormData) => {
      try {
        // Add optimistic update
        const newInvoice = {
          invoiceNo: `INV-${Date.now()}`,
          createdAt: new Date(),
          status: 'pending',
          ...Object.fromEntries(formData.entries()),
        };
        addOptimisticInvoice({ action: 'create', data: newInvoice });

        // Call existing create invoice logic
        const response: any = await POST(
          'api/invoice',
          Object.fromEntries(formData.entries())
        );

        if (response?.message) {
          toast.success(response?.message);
          await revalidatePathCustom('/invoice');
          return { success: true, data: response.data };
        }
        if (response?.error) {
          toast.error(response?.error);
          return { error: response?.error };
        }

        return { success: true };
      } catch (error) {
        toast.error('Failed to create invoice');
        return { error: 'Failed to create invoice' };
      }
    }, null);

  const brandOptions = categories.map((category) => ({
    label: category.brandName || '',
    value: category.brandName || '',
  }));
  const handleCreateInvoice = () => {
    if (!isModalOpen) {
      setIsModalOpen(true);
      setModalType('add');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType('');
    resetInvoiceData();
    resetAccordionData();
    setEditInvoiceData({});
    setIsLoading(false);
  };

  const handleEditInvoice = async (data: any) => {
    try {
      setIsLoading(true);

      // React 19: Add optimistic update
      if (data.invoiceNo) {
        addOptimisticInvoice({
          action: 'update',
          invoiceNo: data.invoiceNo,
          data: data,
        });
      }

      // Check if this is a full invoice edit or just adding payment
      if (data.productDetail && data.productDetail.length > 0) {
        // Full invoice edit - use edit endpoint
        const response: any = await PATCH('api/invoice/edit', data);
        if (response?.message) {
          toast.success(response?.message);
          await revalidatePathCustom('/invoice');
        }
        if (response?.error) {
          toast.error(response?.error);
        }
      } else if (data.additionalPayment !== undefined) {
        // Just adding payment - use original payment endpoint
        const response: any = await PATCH('api/invoice', data);
        if (response?.message) {
          toast.success(response?.message);
          await revalidatePathCustom('/invoice');
        }
        if (response?.error) {
          toast.error(response?.error);
        }
      } else {
        // Unknown operation
        toast.error('Invalid operation data');
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to update invoice. Please try again.');
    }
  };

  const handleCreateInvoiceSubmit = async (formData: any) => {
    try {
      setIsLoading(true);
      const response: any = await POST('api/invoice', formData);
      if (response?.message) {
        toast.success(response?.message);
        await revalidatePathCustom('/invoice');
      }
      if (response?.error) {
        toast.error(response?.error);
      }
      setIsLoading(false);
      setIsModalOpen(false);
      resetInvoiceData();
      resetAccordionData();
    } catch (error: any) {
      setIsLoading(false);
      console.log("errorerror",error);
      toast.error(error?.message || 'An error occurred while creating the invoice');
    }
  };

  return (
    <div className='flex flex-col p-0 py-6 md:p-6'>
      <div className='flex w-full justify-between py-2'>
        <span className='text-2xl font-bold'>Invoices</span>
      </div>

      <InvoiceGrid
        invoices={optimisticInvoices}
        onCreateInvoice={handleCreateInvoice}
        onViewProducts={(data) => {
          setModalData(data);
          setModalType('productDetail');
          setIsModalOpen(true);
        }}
        onPreview={(data) => {
          setModalData(data);
          setModalType('preview');
          setIsModalOpen(true);
        }}
        onEditInvoice={(data) => {
          setModalData(data);
          setModalType('editInvoice');
          setIsModalOpen(true);
        }}
        onAddPayment={(data) => {
          setModalData({ ...data, isPaymentOnly: true });
          setModalType('addPayment');
          setIsModalOpen(true);
        }}
      />

      {modalType === 'add' && (
        <CreateInvoiceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          invoiceData={invoiceData}
          setInvoiceData={setInvoiceData}
          accordionData={accordionData}
          categories={categories}
          customers={customers}
          brandOptions={brandOptions}
          isLoading={isLoading}
          accordionMethods={accordionMethods}
          onSubmit={handleCreateInvoiceSubmit}
          onChange={handleChange}
          stock={stock}
        />
      )}

      {modalType === 'productDetail' && (
        <ProductDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={modalData}
        />
      )}

      {modalType === 'editInvoice' && (
        <EditInvoiceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={modalData}
          onSubmit={handleEditInvoice}
          isLoading={isLoading}
          categories={categories}
          customers={customers}
          brandOptions={brandOptions}
          stock={stock}
          accordionMethods={accordionMethods}
        />
      )}

      {modalType === 'preview' && (
        <InvoicePreviewModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={modalData}
        />
      )}

      {modalType === 'addPayment' && (
        <EditInvoiceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={modalData}
          onSubmit={handleEditInvoice}
          isLoading={isLoading}
          categories={categories}
          customers={customers}
          brandOptions={brandOptions}
          stock={stock}
          accordionMethods={accordionMethods}
        />
      )}
    </div>
  );
};

export default InvoicesLayout;
