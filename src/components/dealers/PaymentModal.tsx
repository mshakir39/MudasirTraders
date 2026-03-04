import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave,
  FaUniversity,
  FaMobileAlt,
  FaFileInvoice,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import { POST } from '@/utils/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
  dealerId: string;
  bills: any[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentAdded,
  dealerId,
  bills,
}) => {
  const [formData, setFormData] = useState({
    billId: '',
    amount: '',
    paymentDate: '', // Empty string initially, will be set in useEffect
    paymentType: 'cash', // cash, bank, easypaisa, jazzcash
    notes: '',
    receivedBy: '', // person who received the cash
  });
  const [transactionScreenshot, setTransactionScreenshot] =
    useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentTypes = [
    { value: 'cash', label: 'Cash', icon: FaMoneyBillWave },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: FaUniversity },
    { value: 'online', label: 'Online', icon: FaMobileAlt },
    { value: 'cheque', label: 'Cheque', icon: FaFileInvoice },
    { value: 'other', label: 'Other', icon: FaMoneyBillWave },
  ];

  const selectedBill = bills.find((bill) => bill.id === formData.billId);

  // Cleanup image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (isOpen && bills.length > 0) {
      // First try to find a current bill (isCurrent = true)
      const currentBill = bills.find((bill: any) => bill.isCurrent);
      // If no current bill, get the latest bill by date
      const latestBill =
        currentBill ||
        bills.sort(
          (a: any, b: any) =>
            new Date(b.billDate).getTime() - new Date(a.billDate).getTime()
        )[0];
      setFormData({
        billId: latestBill?.id || bills[0].id,
        amount: '',
        paymentDate: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
        paymentType: 'cash',
        notes: '',
        receivedBy: '',
      });
      setTransactionScreenshot(null);
      setImagePreview(null);
    }
  }, [isOpen, bills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.billId || !formData.amount) {
      toast.error('Please select a bill and enter payment amount');
      return;
    }

    // Validate payment date is not in future
    const selectedDate = new Date(formData.paymentDate);
    const now = new Date();
    
    // Simple date comparison without timezone complications
    if (selectedDate.getTime() > now.getTime()) {
      toast.error('Payment date and time cannot be in future');
      return;
    }

    if (formData.paymentType === 'cash' && !formData.receivedBy.trim()) {
      toast.error('Please enter who received the cash payment');
      return;
    }

    if (formData.paymentType !== 'cash' && !transactionScreenshot) {
      toast.error('Please upload transaction screenshot for non-cash payments');
      return;
    }

    try {
      setIsSubmitting(true);

      let transactionScreenshotUrl = '';

      // Upload screenshot if not cash
      if (formData.paymentType !== 'cash' && transactionScreenshot) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', transactionScreenshot);
        uploadFormData.append('type', 'payment');

        const uploadResponse = await fetch('/api/dealer-bills/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Screenshot upload failed');
        }
        transactionScreenshotUrl = uploadData.url;
      }

      // Create payment
      const payload = {
        action: 'addPayment',
        billId: formData.billId,
        paymentDate: formData.paymentDate, // Use YYYY-MM-DDTHH:MM datetime string
        paymentAmount: parseFloat(formData.amount),
        paymentMethod: formData.paymentType,
        transactionImageUrl: transactionScreenshotUrl,
        notes: formData.notes,
        receivedBy: formData.receivedBy, // person who received the cash
      };

      const response = await POST('api/dealer-bills', payload);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Payment added successfully');
        onPaymentAdded();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
  };


  

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Add Payment'
      dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[70%] lg:!w-[50%] max-w-2xl'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Bill Selection */}
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Selected Bill
          </label>
          <input
            type='text'
            value={
              selectedBill
                ? `Bill #${selectedBill.id?.slice(-8)} - Rs ${selectedBill.isReplacement ? selectedBill.totalAmount : selectedBill.remainingAmount} remaining`
                : 'No bill selected'
            }
            disabled
            className='w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600'
            readOnly
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Payment Date & Time *
          </label>
          <input
            type='datetime-local'
            name='paymentDate'
            value={formData.paymentDate || new Date().toISOString().slice(0, 16)}
            onChange={(e) =>
              setFormData({ ...formData, paymentDate: e.target.value })
            }
            min='2020-01-01T00:00'
            className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
            required
          />
        </div>

        {/* Payment Amount */}
        <Input
          type='number'
          label='Payment Amount (Rs) *'
          name='amount'
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder='Enter amount'
          max={
            selectedBill?.isReplacement
              ? selectedBill.totalAmount
              : selectedBill?.remainingAmount || ''
          }
          required
        />

        {/* Payment Type */}
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Payment Type *
          </label>
          <div className='grid grid-cols-2 gap-2'>
            {paymentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type='button'
                  onClick={() =>
                    setFormData({ ...formData, paymentType: type.value })
                  }
                  className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    formData.paymentType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={
                      formData.paymentType === type.value
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }
                  />
                  <span
                    className={`font-medium ${
                      formData.paymentType === type.value
                        ? 'text-blue-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Received By (for cash payments) */}
        {formData.paymentType === 'cash' && (
          <Input
            type='text'
            label='Received By *'
            name='receivedBy'
            value={formData.receivedBy}
            onChange={(e) =>
              setFormData({ ...formData, receivedBy: e.target.value })
            }
            placeholder='Enter name of person who received the cash'
            required
          />
        )}

        {/* Transaction Screenshot (for non-cash) */}
        {formData.paymentType !== 'cash' && (
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Transaction Screenshot *
            </label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setTransactionScreenshot(file);
                
                // Create preview URL
                if (file) {
                  const preview = URL.createObjectURL(file);
                  setImagePreview(preview);
                } else {
                  setImagePreview(null);
                }
              }}
              className='block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
              required
            />
            {transactionScreenshot && (
              <div className='mt-3'>
                <p className='mb-2 text-sm text-gray-600'>
                  Selected: {transactionScreenshot.name}
                </p>
                {imagePreview && (
                  <div className='relative inline-block'>
                    <img
                      src={imagePreview}
                      alt='Transaction screenshot preview'
                      className='max-h-32 w-auto rounded-lg border border-gray-300 shadow-sm'
                    />
                    <button
                      type='button'
                      onClick={() => {
                        setTransactionScreenshot(null);
                        setImagePreview(null);
                      }}
                      className='absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600'
                      title='Remove image'
                    >
                      <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <Input
          type='text'
          label='Notes (Optional)'
          name='notes'
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder='Add any notes about this payment'
        />

        <div className='flex gap-3 pt-4'>
          <Button
            type='submit'
            variant='fill'
            text={isSubmitting ? 'Adding...' : 'Add Payment'}
            disabled={isSubmitting}
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

export default PaymentModal;
