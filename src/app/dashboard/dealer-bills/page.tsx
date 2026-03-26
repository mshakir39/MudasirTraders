'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEye, FaTrash, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { GET, POST } from '@/utils/api';
import { IDealerBill, IDealer } from '../../../../interfaces';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillAdded: () => void;
  dealers: IDealer[];
}

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: IDealerBill | null;
  onPaymentAdded: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  bill,
  onPaymentAdded,
}) => {
  const [formData, setFormData] = useState({
    paymentDate: '',
    paymentAmount: '',
    paymentMethod: '',
    notes: '',
  });
  const [transactionImageFile, setTransactionImageFile] = useState<File | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.paymentDate ||
      !formData.paymentAmount ||
      !formData.paymentMethod ||
      !transactionImageFile
    ) {
      toast.error(
        'Please fill all required fields and select a transaction image'
      );
      return;
    }

    const paymentAmount = parseFloat(formData.paymentAmount);
    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (bill && paymentAmount > bill.remainingAmount) {
      toast.error(
        `Payment amount cannot exceed remaining balance of Rs ${bill.remainingAmount}`
      );
      return;
    }

    try {
      setIsLoading(true);

      // First upload the transaction image
      const uploadFormData = new FormData();
      uploadFormData.append('image', transactionImageFile);
      uploadFormData.append('type', 'payment');

      const uploadResponse = await fetch('/api/dealer-bills/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Image upload failed');
      }

      // Then add the payment with the uploaded image URL
      const response = await POST('api/dealer-bills', {
        action: 'addPayment',
        billId: bill?.id,
        paymentDate: new Date(formData.paymentDate),
        paymentAmount: paymentAmount,
        paymentMethod: formData.paymentMethod,
        transactionImageUrl: uploadData.url,
        notes: formData.notes,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Payment added successfully');
        onPaymentAdded();
        onClose();
        setFormData({
          paymentDate: '',
          paymentAmount: '',
          paymentMethod: '',
          notes: '',
        });
        setTransactionImageFile(null);
      }
    } catch (error) {
      toast.error('Failed to add payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Payment - ${bill?.dealerName}`}
      dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[60%] lg:!w-[40%] max-w-md'
    >
      {bill && (
        <div className='mb-4 rounded-lg bg-blue-50 p-3'>
          <div className='text-sm text-blue-800'>
            <div>
              Remaining Balance:{' '}
              <span className='font-semibold'>
                Rs {bill.remainingAmount.toLocaleString()}
              </span>
            </div>
            <div>Total Bill: Rs {bill.totalAmount.toLocaleString()}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input
          type='date'
          label='Payment Date'
          name='paymentDate'
          value={formData.paymentDate}
          onChange={(e) =>
            setFormData({ ...formData, paymentDate: e.target.value })
          }
          required
        />

        <Input
          type='number'
          label='Payment Amount'
          name='paymentAmount'
          value={formData.paymentAmount}
          onChange={(e) =>
            setFormData({ ...formData, paymentAmount: e.target.value })
          }
          required
          min='0.01'
          step='0.01'
          max={bill?.remainingAmount}
        />

        <Input
          type='text'
          label='Payment Method'
          name='paymentMethod'
          value={formData.paymentMethod}
          onChange={(e) =>
            setFormData({ ...formData, paymentMethod: e.target.value })
          }
          required
          placeholder='e.g., Bank Transfer, Cash, etc.'
        />

        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Transaction Screenshot *
          </label>
          <input
            type='file'
            accept='image/*'
            onChange={(e) =>
              setTransactionImageFile(e.target.files?.[0] || null)
            }
            className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            required
          />
          {transactionImageFile && (
            <p className='mt-1 text-sm text-gray-600'>
              Selected: {transactionImageFile.name}
            </p>
          )}
        </div>

        <Input
          type='text'
          label='Notes (Optional)'
          name='notes'
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className='flex gap-3 pt-4'>
          <Button
            type='submit'
            variant='fill'
            text='Add Payment'
            isPending={isLoading}
            className='flex-1'
          />
          <Button
            type='button'
            variant='outline'
            text='Cancel'
            onClick={onClose}
          />
        </div>
      </form>
    </Modal>
  );
};

const AddBillModal: React.FC<AddBillModalProps> = ({
  isOpen,
  onClose,
  onBillAdded,
  dealers,
}) => {
  const [formData, setFormData] = useState({
    dealerId: '',
    billDate: '',
    totalAmount: '',
    notes: '',
  });
  const [billImageFile, setBillImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.dealerId ||
      !formData.billDate ||
      !formData.totalAmount ||
      !billImageFile
    ) {
      toast.error(
        'Please select a dealer and fill all required fields and select a bill image'
      );
      return;
    }

    try {
      setIsLoading(true);

      // First upload the image
      const uploadFormData = new FormData();
      uploadFormData.append('image', billImageFile);
      uploadFormData.append('type', 'bill');

      const uploadResponse = await fetch('/api/dealer-bills/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Image upload failed');
      }

      // Get selected dealer name
      const selectedDealer = dealers.find((d) => d.id === formData.dealerId);

      // Then create the bill with the uploaded image URL
      const response = await POST('api/dealer-bills', {
        action: 'create',
        dealerId: formData.dealerId,
        dealerName: selectedDealer?.name || '',
        billDate: new Date(formData.billDate),
        totalAmount: parseFloat(formData.totalAmount),
        billImageUrl: uploadData.url,
        notes: formData.notes,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Dealer bill created successfully');
        onBillAdded();
        onClose();
        setFormData({
          dealerId: '',
          billDate: '',
          totalAmount: '',
          notes: '',
        });
        setBillImageFile(null);
      }
    } catch (error) {
      toast.error('Failed to create dealer bill');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Add Dealer Bill'
      dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[60%] lg:!w-[40%] max-w-md'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Select Dealer *
          </label>
          <select
            value={formData.dealerId}
            onChange={(e) =>
              setFormData({ ...formData, dealerId: e.target.value })
            }
            className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            required
          >
            <option value=''>Choose a dealer...</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name}{' '}
                {dealer.businessType ? `(${dealer.businessType})` : ''}
              </option>
            ))}
          </select>
        </div>

        <Input
          type='date'
          label='Bill Date'
          name='billDate'
          value={formData.billDate}
          onChange={(e) =>
            setFormData({ ...formData, billDate: e.target.value })
          }
          required
        />

        <Input
          type='number'
          label='Total Amount'
          name='totalAmount'
          value={formData.totalAmount}
          onChange={(e) =>
            setFormData({ ...formData, totalAmount: e.target.value })
          }
          required
          min='0'
          step='0.01'
        />

        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Bill Image *
          </label>
          <input
            type='file'
            accept='image/*'
            onChange={(e) => setBillImageFile(e.target.files?.[0] || null)}
            className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            required
          />
          {billImageFile && (
            <p className='mt-1 text-sm text-gray-600'>
              Selected: {billImageFile.name}
            </p>
          )}
        </div>

        <Input
          type='text'
          label='Notes (Optional)'
          name='notes'
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className='flex gap-3 pt-4'>
          <Button
            type='submit'
            variant='fill'
            text='Create Bill'
            isPending={isLoading}
            className='flex-1'
          />
          <Button
            type='button'
            variant='outline'
            text='Cancel'
            onClick={onClose}
          />
        </div>
      </form>
    </Modal>
  );
};

const DealerBillsPage: React.FC = () => {
  const [bills, setBills] = useState<IDealerBill[]>([]);
  const [dealers, setDealers] = useState<IDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<IDealerBill | null>(null);

  // Get dealer ID from URL parameters
  const urlParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const dealerFilterId = urlParams.get('dealer');

  const fetchBills = useCallback(async () => {
    try {
      const response = await GET('api/dealer-bills');
      if (response.error) {
        toast.error(response.error);
      } else {
        let allBills = response.bills || [];

        // Filter by dealer if dealer ID is in URL
        if (dealerFilterId) {
          allBills = allBills.filter(
            (bill: IDealerBill) => bill.dealerId === dealerFilterId
          );
        }

        setBills(allBills);
      }
    } catch (error) {
      toast.error('Failed to fetch dealer bills');
    } finally {
      setLoading(false);
    }
  }, [dealerFilterId]);

  const fetchDealers = useCallback(async () => {
    try {
      const response = await GET('api/dealers');
      if (response.dealers) {
        setDealers(
          response.dealers.filter((dealer: IDealer) => dealer.isActive)
        );
      }
    } catch (error) {
      console.error('Failed to fetch dealers');
    }
  }, []);

  useEffect(() => {
    fetchBills();
    fetchDealers();
  }, [fetchBills, fetchDealers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const response = await fetch(`/api/dealer-bills?id=${billId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Bill deleted successfully');
        fetchBills();
      }
    } catch (error) {
      toast.error('Failed to delete bill');
    }
  };

  // Get dealer name for title when filtered
  const getDealerName = () => {
    if (!dealerFilterId) return '';
    const dealer = dealers.find((d) => d.id === dealerFilterId);
    return dealer ? ` - ${dealer.name}` : '';
  };

  if (loading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='animate-pulse text-gray-500'>
          Loading dealer bills...
        </div>
      </div>
    );
  }

  return (
    <div className='p-0 py-6 md:p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>
          Dealer Bills{getDealerName()}
        </h1>
        <Button
          variant='fill'
          text='Add New Bill'
          icon={<FaPlus />}
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>

      {bills.length === 0 ? (
        <div className='py-12 text-center'>
          <FaMoneyBillWave className='mx-auto mb-4 h-12 w-12 text-gray-400' />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            {dealerFilterId
              ? 'No bills for this dealer yet'
              : 'No dealer bills yet'}
          </h3>
          <p className='mb-4 text-gray-500'>
            {dealerFilterId
              ? 'Start by adding your first bill for this dealer'
              : 'Start by adding your first dealer bill'}
          </p>
          <Button
            variant='fill'
            text={
              dealerFilterId ? 'Add First Bill for Dealer' : 'Add First Bill'
            }
            onClick={() => setIsAddModalOpen(true)}
          />
        </div>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {bills.map((bill) => (
            <div key={bill.id} className='rounded-lg bg-white p-6 shadow-md'>
              <div className='mb-4 flex items-start justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {bill.dealerName}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    {new Date(bill.billDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(bill.status)}`}
                >
                  {bill.status.toUpperCase()}
                </span>
              </div>

              <div className='mb-4 space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Total:</span>
                  <span className='font-semibold'>
                    Rs {bill.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Remaining:</span>
                  <span
                    className={`font-semibold ${bill.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    Rs {bill.remainingAmount.toLocaleString()}
                  </span>
                </div>
                {bill.payments && bill.payments.length > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Payments:</span>
                    <span className='text-sm font-medium text-blue-600'>
                      {bill.payments.length} payment
                      {bill.payments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  text='View'
                  icon={<FaEye />}
                  onClick={() => {
                    /* TODO: Open bill details modal */
                  }}
                  className='px-3 py-2 text-xs'
                />
                <Button
                  variant='outline'
                  text='Add Payment'
                  icon={<FaMoneyBillWave />}
                  onClick={() => {
                    setSelectedBill(bill);
                    setIsPaymentModalOpen(true);
                  }}
                  className='px-3 py-2 text-xs'
                />
                <Button
                  variant='outline'
                  text='Delete'
                  icon={<FaTrash />}
                  onClick={() => bill.id && handleDeleteBill(bill.id)}
                  className='px-3 py-2 text-xs !text-red-600 hover:!bg-red-50'
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBillAdded={fetchBills}
        dealers={dealers}
      />

      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        onPaymentAdded={fetchBills}
      />
    </div>
  );
};

export default DealerBillsPage;
