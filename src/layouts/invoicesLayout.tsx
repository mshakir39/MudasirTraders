'use client';
import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { POST, PATCH } from '@/utils/api';
import { revalidatePathCustom } from '../../actions/revalidatePathCustom';
import { ICategory } from '../../interfaces';
import arrayStringToArrayObject from '@/utils/arrayStringToArrayObject';

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

  console.log('📦 InvoiceLayout - Stock data received:', stock);
  console.log('📦 InvoiceLayout - Categories received:', categories);

  // Custom hooks
  const { invoiceData, setInvoiceData, handleChange, resetInvoiceData } = useInvoiceForm();
  const { accordionData, setAccordionData, resetAccordionData, ...accordionMethods } = useAccordionData(categories, stock);
  const { customers } = useCustomers();

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
      const response: any = await PATCH('api/invoice', data);
      if (response?.message) {
        toast.success(response?.message);
        await revalidatePathCustom('/invoice');
      }
      if (response?.error) {
        toast.error(response?.error);
      }
      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
      setIsLoading(false);
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
    } catch (error) {
      console.error('Error creating invoice:', error);
      setIsLoading(false);
      toast.error('An error occurred while creating the invoice');
    }
  };

  return (
    
    <div className='flex flex-col md:p-6 p-0 py-6'>
      <div className='flex w-full justify-between py-2'>
        <span className='text-2xl font-bold'>Invoices</span>
      </div>
      
      <InvoiceGrid
        invoices={invoices}
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
        />
      )}

      {modalType === 'preview' && (
        <InvoicePreviewModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={modalData}
        />
      )}
    </div>
  );
};

export default InvoicesLayout;