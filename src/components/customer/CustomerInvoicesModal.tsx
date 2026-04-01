import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/modal';
import { InvoicePreviewModal } from '@/features/invoice-management/ui/components';
import { CustomerInvoiceDataGrid } from '@/features/customer-management';
import ProductDetailModal from '@/components/archive/ProductDetailModal';
import EditInvoiceModal from '@/components/archive/EditInvoiceModal';
import { toast } from 'react-toastify';
import { PATCH } from '@/utils/api';
import { useAccordionData } from '@/features/invoice-management/lib/useAccordionData';

interface CustomerInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  categories?: any[];
  stock?: any[];
}

const CustomerInvoicesModal: React.FC<CustomerInvoicesModalProps> = ({
  isOpen,
  onClose,
  customer,
  categories = [],
  stock = [],
}) => {
  const { ...accordionMethods } = useAccordionData(categories, stock);

  const brandOptions = categories.map((category) => ({
    label: category.brandName || '',
    value: category.brandName || '',
  }));
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalType, setSubModalType] = useState<string>('');
  const [modalData, setModalData] = useState<any>(null);

  const fetchCustomerInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `/api/customers/${customer.id}/invoices`;
      const response = await fetch(url);
      if (response.ok) {
        const invoices = await response.json();
        setCustomerInvoices(invoices);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setCustomerInvoices([]);
      }
    } catch (error) {
      setCustomerInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomerInvoices();
    }
  }, [isOpen, fetchCustomerInvoices]);

  const handleEditInvoice = async (data: any) => {
    try {
      setIsLoading(true);
      const response: any = await PATCH('api/invoice', data);
      if (response?.message) {
        toast.success(response?.message);
        await fetchCustomerInvoices();
      }
      if (response?.error) {
        toast.error(response?.error);
      }
      setIsLoading(false);
      setIsSubModalOpen(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoice/${invoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Invoice deleted successfully');
        await fetchCustomerInvoices();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete invoice');
      }
    } catch (error) {
      toast.error('Failed to delete invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSubModal = () => {
    setIsSubModalOpen(false);
    setSubModalType('');
    setModalData(null);
  };
  // Filter out voided invoices for calculations
  const activeInvoices = customerInvoices.filter(invoice => invoice.status !== 'voided');
  
  // Calculate summary statistics using only active invoices
  const totalInvoices = activeInvoices.length;
  const totalAmount = activeInvoices.reduce((sum, invoice) => {
    // Calculate total from products (same logic as data table)
    const productTotal =
      invoice.products?.reduce((sum: number, product: any) => {
        // Try different possible price fields - prioritize productPrice
        const productPrice =
          product.productPrice || product.totalPrice || product.price || 0;
        const quantity = product.quantity || 1;
        return sum + Number(productPrice) * Number(quantity);
      }, 0) || 0;
    return sum + productTotal;
  }, 0);
  const totalRemaining = activeInvoices.reduce(
    (sum, invoice) => sum + (invoice.remainingAmount || 0),
    0
  );
  const paidInvoices = activeInvoices.filter(
    (invoice) => (invoice.remainingAmount || 0) === 0
  ).length;
  
  // Count voided invoices separately
  const voidedInvoices = customerInvoices.filter(invoice => invoice.status === 'voided').length;

  return (
    <div>
      {/* Main Modal - Prevent backdrop close when sub-modal is open */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Invoices - ${customer.customerName}`}
        dialogPanelClass='!w-[95%] !max-w-7xl'
        preventBackdropClose={isSubModalOpen} // Prevent closing when sub-modal is open
      >
        <div className='mt-4 max-h-[80vh] overflow-y-auto'>
          {/* Customer Summary */}
          <div className='mb-4 rounded-lg bg-gray-50 px-4 py-3 sticky top-0 z-10'>
            <div className='flex flex-wrap items-center justify-between gap-4 text-base'>
              <div className='flex flex-wrap items-center gap-4 flex-1'>
                <div className='flex-1 text-center'>
                  <span className='font-medium text-gray-600'>Active:</span>
                  <span className='ml-1 font-bold text-blue-600'>{totalInvoices}</span>
                </div>
                <div className='flex-1 text-center'>
                  <span className='font-medium text-gray-600'>Amount:</span>
                  <span className='ml-1 font-bold text-green-600'>Rs {Number(totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className='flex-1 text-center'>
                  <span className='font-medium text-gray-600'>Remaining:</span>
                  <span className={`ml-1 font-bold ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>Rs {totalRemaining.toLocaleString()}</span>
                </div>
                <div className='flex-1 text-center'>
                  <span className='font-medium text-gray-600'>Paid:</span>
                  <span className='ml-1 font-bold text-green-600'>{paidInvoices}/{totalInvoices}</span>
                </div>
                <div className='flex-1 text-center'>
                  <span className='font-medium text-gray-600'>Voided:</span>
                  <span className='ml-1 font-bold text-red-600'>{voidedInvoices}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Grid */}
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-gray-500'>Loading customer invoices...</div>
            </div>
          ) : (
            <CustomerInvoiceDataGrid
              invoices={customerInvoices}
              onPreview={(data: any) => {
                setModalData(data);
                setSubModalType('preview');
                setIsSubModalOpen(true);
              }}
              onEditInvoice={(data: any) => {
                setModalData(data);
                setSubModalType('edit');
                setIsSubModalOpen(true);
              }}
              onAddPayment={(data: any) => {
                setModalData(data);
                setSubModalType('payment');
                setIsSubModalOpen(true);
              }}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

          {!isLoading && customerInvoices.length === 0 && (
            <div className='py-8 text-center text-gray-500'>
              No invoices found for this customer.
            </div>
          )}
        </div>
      </Modal>

      {/* Sub-Modals */}
      {subModalType === 'productDetail' && (
        <ProductDetailModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
        />
      )}

      {subModalType === 'editInvoice' && (
        <EditInvoiceModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
          onSubmit={handleEditInvoice}
          isLoading={isLoading}
          categories={categories}
          customers={[]}
          brandOptions={brandOptions}
          stock={stock}
          accordionMethods={accordionMethods}
        />
      )}

      {subModalType === 'addPayment' && (
        <EditInvoiceModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
          onSubmit={handleEditInvoice}
          isLoading={isLoading}
          categories={categories}
          customers={[]}
          brandOptions={brandOptions}
          stock={stock}
          accordionMethods={accordionMethods}
        />
      )}

      {subModalType === 'preview' && (
        <InvoicePreviewModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
        />
      )}
    </div>
  );
};

export default CustomerInvoicesModal;
