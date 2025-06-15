import React, { useEffect, useState } from 'react';
import Modal from '@/components/modal';
import InvoiceGrid from '@/components/invoice/InvoiceGrid';
import ProductDetailModal from '@/components/invoice/ProductDetailModal';
import EditInvoiceModal from '@/components/invoice/EditInvoiceModal';
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal';
import { toast } from 'react-toastify';
import { PATCH } from '@/utils/api';

interface CustomerInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

const CustomerInvoicesModal: React.FC<CustomerInvoicesModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalType, setSubModalType] = useState<string>('');
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchCustomerInvoices();
    }
  }, [isOpen, customer]);

  const fetchCustomerInvoices = async () => {
    setIsLoading(true);
    console.log('🔍 Fetching invoices for customer:', customer);
    
    try {
      const url = `/api/customers/${customer.id}/invoices`;
      console.log('📡 API URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const invoices = await response.json();
        console.log('✅ Received invoices:', invoices);
        setCustomerInvoices(invoices);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', response.status, errorData);
        setCustomerInvoices([]);
      }
    } catch (error) {
      console.error('💥 Fetch Error:', error);
      setCustomerInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      console.error('Error updating invoice:', error);
      setIsLoading(false);
    }
  };

  const handleCloseSubModal = () => {
    setIsSubModalOpen(false);
    setSubModalType('');
    setModalData(null);
  };

  // Calculate summary statistics
  const totalInvoices = customerInvoices.length;
  const totalAmount = customerInvoices.reduce((sum, invoice) => {
    const invoiceTotal = invoice.products?.reduce((productSum: number, product: any) => 
      productSum + (product.totalPrice || 0), 0
    ) || 0;
    return sum + invoiceTotal;
  }, 0);
  const totalRemaining = customerInvoices.reduce((sum, invoice) => 
    sum + (invoice.remainingAmount || 0), 0
  );
  const paidInvoices = customerInvoices.filter(invoice => 
    (invoice.remainingAmount || 0) === 0
  ).length;

  return (
    <div>
      {/* Main Modal - Prevent backdrop close when sub-modal is open */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Invoices - ${customer.name}`}
        dialogPanelClass="!w-[95%] !max-w-7xl"
        preventBackdropClose={isSubModalOpen} // Prevent closing when sub-modal is open
      >
        <div className="mt-4">
          {/* Customer Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Total Invoices:</span>
                <div className="text-lg font-bold text-blue-600">{totalInvoices}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Amount:</span>
                <div className="text-lg font-bold text-green-600">Rs {totalAmount.toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Remaining:</span>
                <div className={`text-lg font-bold ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs {totalRemaining.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Paid Invoices:</span>
                <div className="text-lg font-bold text-green-600">{paidInvoices}/{totalInvoices}</div>
              </div>
            </div>
          </div>

          {/* Invoice Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading customer invoices...</div>
            </div>
          ) : (
            <InvoiceGrid
              invoices={customerInvoices}
              onCreateInvoice={() => {}}
              showCreateButton={false}
              onViewProducts={(data) => {
                setModalData(data);
                setSubModalType('productDetail');
                setIsSubModalOpen(true);
              }}
              onPreview={(data) => {
                setModalData(data);
                setSubModalType('preview');
                setIsSubModalOpen(true);
              }}
              onEditInvoice={(data) => {
                setModalData(data);
                setSubModalType('editInvoice');
                setIsSubModalOpen(true);
              }}
            />
          )}

          {!isLoading && customerInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
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