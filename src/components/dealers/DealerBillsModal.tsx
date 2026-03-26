import React, { useState, useEffect } from 'react';
import {
  FaPlus,
  FaFileInvoice,
  FaMoneyBillWave,
  FaCreditCard,
  FaUniversity,
  FaMobileAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import Image from 'next/image';
import { GET, POST } from '@/utils/api';

interface DealerBillsModalProps {
  dealerId: string;
  showAddForm?: boolean;
  onShowAddFormChange?: (show: boolean) => void;
  showCurrentOnly?: boolean;
  onShowCurrentOnlyChange?: (show: boolean) => void;
  router?: any; // Add router prop
  onClose?: () => void; // Add onClose prop
}

const DealerBillsModal: React.FC<DealerBillsModalProps> = ({
  dealerId,
  showAddForm = false,
  onShowAddFormChange,
  showCurrentOnly = true, // Default to show only current bills
  onShowCurrentOnlyChange,
  router,
  onClose,
}) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBillImage, setSelectedBillImage] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    invoiceNo: '',
    billDate: '',
    totalAmount: '',
    notes: '',
  });
  const [billImageFile, setBillImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await GET('api/dealer-bills');
        if (response.error) {
          toast.error(response.error);
        } else {
          const dealerBills =
            response.bills?.filter((bill: any) => bill.dealerId === dealerId) ||
            [];
          setBills(dealerBills);
        }
      } catch (error) {
        toast.error('Failed to fetch bills');
      } finally {
        setLoading(false);
      }
    };

    if (dealerId) {
      fetchBills();
    }
  }, [dealerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billDate || !formData.totalAmount || !billImageFile) {
      toast.error('Please fill all required fields and select a bill image');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload image first
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

      // Create bill
      // Note: We're not setting parentBillId anymore - new bills should be independent
      const billPayload = {
        action: 'create',
        dealerId: dealerId,
        dealerName: '', // Will be set by backend
        invoiceNo: formData.invoiceNo,
        billDate: new Date(formData.billDate),
        totalAmount: parseFloat(formData.totalAmount),
        billImageUrl: uploadData.url,
        notes: formData.notes,
        // parentBillId: latestOriginalBill?.id || undefined,
        // replacementReason: latestOriginalBill ? 'new_invoice' : undefined,
      };

      const response = await POST('api/dealer-bills', billPayload);

      if (response.error) {
        // Rollback: Delete uploaded image from Cloudinary
        try {
          const deleteResponse = await fetch('/api/dealer-bills/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId: uploadData.publicId }),
          });
          if (deleteResponse.ok) {
            // Image deleted from Cloudinary
          }
        } catch (rollbackError) {
          // Rollback failed: Could not delete image
        }

        toast.error(response.error);
      } else {
        toast.success('Bill added successfully');
        setFormData({
          invoiceNo: '',
          billDate: '',
          totalAmount: '',
          notes: '',
        });
        setBillImageFile(null);
        onShowAddFormChange?.(false);
        onClose?.(); // Close modal immediately

        // Refresh bills list
        const billsResponse = await GET('api/dealer-bills');
        if (!billsResponse.error) {
          const dealerBills =
            billsResponse.bills?.filter(
              (bill: any) => bill.dealerId === dealerId
            ) || [];
          setBills(dealerBills);
        }
      }
    } catch (error) {
      toast.error('Failed to add bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-pulse text-gray-500'>Loading bills...</div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <Input
            type='text'
            label='Invoice Number'
            name='invoiceNo'
            value={formData.invoiceNo}
            onChange={(e) =>
              setFormData({ ...formData, invoiceNo: e.target.value })
            }
            placeholder='Enter invoice number'
          />
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
            label='Total Amount (Rs)'
            name='totalAmount'
            value={formData.totalAmount}
            onChange={(e) =>
              setFormData({ ...formData, totalAmount: e.target.value })
            }
            placeholder='Enter amount'
            required
          />
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Bill Image *
          </label>
          <input
            type='file'
            accept='image/*'
            onChange={(e) => setBillImageFile(e.target.files?.[0] || null)}
            className='block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
            required
          />
          {billImageFile && (
            <p className='mt-2 text-sm text-gray-600'>
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
          placeholder='Add any notes about this bill'
        />

        <div className='flex gap-3 pt-4'>
          <Button
            type='submit'
            variant='fill'
            text={isSubmitting ? 'Adding...' : 'Add Bill'}
            disabled={isSubmitting}
          />
          <Button
            type='button'
            variant='outline'
            text='Cancel'
            onClick={() => {
              onShowAddFormChange?.(false);
              setFormData({
                invoiceNo: '',
                billDate: '',
                totalAmount: '',
                notes: '',
              });
              setBillImageFile(null);
            }}
          />
        </div>
      </form>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Add Bill Button */}
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>Bills List</h3>
        <div className='flex items-center gap-2'>
          <Button
            variant={showCurrentOnly ? 'fill' : 'outline'}
            text={
              showCurrentOnly ? 'Show All Bills' : 'Show Current Bills Only'
            }
            onClick={() => onShowCurrentOnlyChange?.(!showCurrentOnly)}
            className='text-sm'
          />
          <span className='text-sm text-gray-500'>
            {showCurrentOnly
              ? 'Showing current bills only'
              : 'Showing all bills'}
          </span>
        </div>
        <Button
          variant='fill'
          text='Add New Bill'
          icon={<FaPlus />}
          onClick={() => onShowAddFormChange?.(true)}
        />
      </div>

      {bills.length === 0 ? (
        <div className='py-8 text-center'>
          <FaMoneyBillWave className='mx-auto mb-4 h-12 w-12 text-gray-400' />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            No bills yet
          </h3>
          <p className='mb-4 text-gray-500'>
            Click &ldquo;Add New Bill&rdquo; to create the first bill for this
            dealer
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {bills
            .filter((bill) => !showCurrentOnly || bill.isCurrent)
            .map((bill) => (
              <div
                key={bill.id}
                className='rounded-lg border border-gray-200 bg-gray-50 p-4'
              >
                <div className='mb-2 flex items-start justify-between'>
                  <div className='flex-1'>
                    <h4 className='font-semibold text-gray-900'>
                      Bill #{bill.id?.slice(-8)}
                      {bill.isReplacement && (
                        <span className='ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                          Replacement
                        </span>
                      )}
                    </h4>
                    {bill.invoiceNo && (
                      <p className='text-sm text-gray-600'>
                        Invoice: {bill.invoiceNo}
                      </p>
                    )}
                    {bill.parentBillId && (
                      <p className='text-sm text-purple-600'>
                        Replaces Bill #{bill.parentBillId.slice(-8)}
                        {bill.replacementReason &&
                          ` (${bill.replacementReason})`}
                      </p>
                    )}
                    <p className='text-sm text-gray-500'>
                      {new Date(bill.billDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-bold text-gray-900'>
                      Rs {bill.totalAmount.toLocaleString('en-PK')}
                    </div>
                    <div
                      className={`rounded-full px-2 py-1 text-xs ${
                        bill.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : bill.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : bill.status === 'unpaid'
                              ? 'bg-red-100 text-red-800'
                              : bill.status === 'disputed'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {bill.isCurrent ? 'Current' : bill.status}
                    </div>
                  </div>
                </div>

                <div className='mb-2 flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>
                    Remaining: Rs {bill.remainingAmount.toLocaleString('en-PK')}
                  </span>
                  <span className='text-gray-600'>
                    {bill.payments?.length || 0} payments
                  </span>
                </div>

                {/* Bill Image */}
                {bill.billImageUrl && (
                  <div className='mb-2'>
                    <div className='mb-1 flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Bill Image
                      </span>
                      <button
                        onClick={() => setSelectedBillImage(bill.billImageUrl)}
                        className='text-xs font-medium text-blue-600 hover:text-blue-800'
                      >
                        View Full Size
                      </button>
                    </div>
                    <div
                      className='group relative cursor-pointer'
                      onClick={() => setSelectedBillImage(bill.billImageUrl)}
                    >
                      <Image
                        src={bill.billImageUrl}
                        alt='Bill'
                        width={400}
                        height={128}
                        className='h-32 w-full rounded border border-gray-300 object-cover'
                      />
                      <div className='absolute inset-0 flex items-center justify-center rounded bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-10'>
                        <FaFileInvoice className='text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
                      </div>
                    </div>
                  </div>
                )}

                {bill.notes && (
                  <p className='mt-2 text-sm text-gray-600'>{bill.notes}</p>
                )}

                {/* Payment History */}
                {bill.payments && bill.payments.length > 0 && (
                  <div className='mt-3 border-t border-gray-200 pt-3'>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Payment History
                        {bill.isReplacement && ' (Shared)'}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {bill.payments.length} payment(s)
                      </span>
                    </div>
                    <div className='space-y-2'>
                      {bill.payments
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.paymentDate).getTime() -
                            new Date(a.paymentDate).getTime()
                        )
                        .map((payment: any, index: number) => (
                          <div
                            key={payment.id || index}
                            className='rounded border border-gray-100 bg-white p-2'
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-sm font-semibold text-green-600'>
                                    Rs{' '}
                                    {payment.paymentAmount.toLocaleString(
                                      'en-PK'
                                    )}
                                  </span>
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs ${
                                      payment.paymentMethod === 'cash'
                                        ? 'bg-green-100 text-green-700'
                                        : payment.paymentMethod === 'bank'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {payment.paymentMethod}
                                  </span>
                                </div>
                                <div className='text-xs text-gray-500'>
                                  {new Date(payment.paymentDate).toLocaleString(
                                    'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                </div>
                                {payment.receivedBy && (
                                  <div className='mt-1 text-xs text-gray-600'>
                                    Received by:{' '}
                                    <span className='font-medium'>
                                      {payment.receivedBy}
                                    </span>
                                  </div>
                                )}
                                {payment.notes && (
                                  <div className='mt-1 text-xs text-gray-600'>
                                    {payment.notes}
                                  </div>
                                )}
                              </div>
                              {payment.transactionImageUrl && (
                                <button
                                  onClick={() =>
                                    setSelectedBillImage(
                                      payment.transactionImageUrl
                                    )
                                  }
                                  className='text-xs text-blue-600 hover:text-blue-800'
                                >
                                  View Receipt
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* All Payments Section */}
      {bills.length > 1 &&
        bills
          .filter((bill) => !showCurrentOnly || bill.isCurrent)
          .some((bill: any) => bill.payments?.length > 0) && (
          <div className='mt-8'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900'>
              All Payments {showCurrentOnly && '(Current Bills Only)'}
            </h3>
            <div className='space-y-3'>
              {bills
                .filter((bill) => !showCurrentOnly || bill.isCurrent)
                .flatMap(
                  (bill: any) =>
                    bill.payments?.map((payment: any) => ({
                      ...payment,
                      billId: bill.id,
                      billInvoice: bill.invoiceNo,
                    })) || []
                )
                .sort(
                  (a: any, b: any) =>
                    new Date(b.paymentDate).getTime() -
                    new Date(a.paymentDate).getTime()
                )
                .map((payment: any, index: number) => (
                  <div
                    key={`${payment.billId}-${payment.id || index}`}
                    className='rounded-lg border border-gray-200 bg-white p-4'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-lg font-semibold text-green-600'>
                            Rs {payment.paymentAmount.toLocaleString('en-PK')}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              payment.paymentMethod === 'cash'
                                ? 'bg-green-100 text-green-700'
                                : payment.paymentMethod === 'bank'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {payment.paymentMethod}
                          </span>
                          <span className='text-sm text-gray-500'>
                            Bill #{payment.billId?.slice(-8)}{' '}
                            {payment.billInvoice && `(${payment.billInvoice})`}
                          </span>
                        </div>
                        <div className='text-sm text-gray-500'>
                          {new Date(payment.paymentDate).toLocaleString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </div>
                        {payment.receivedBy && (
                          <div className='mt-1 text-sm text-gray-600'>
                            Received by:{' '}
                            <span className='font-medium'>
                              {payment.receivedBy}
                            </span>
                          </div>
                        )}
                        {payment.notes && (
                          <div className='mt-1 text-sm text-gray-600'>
                            {payment.notes}
                          </div>
                        )}
                      </div>
                      {payment.transactionImageUrl && (
                        <button
                          onClick={() =>
                            setSelectedBillImage(payment.transactionImageUrl)
                          }
                          className='text-sm text-blue-600 hover:text-blue-800'
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Full Size Image Modal */}
      {selectedBillImage && (
        <Modal
          isOpen={!!selectedBillImage}
          onClose={() => setSelectedBillImage(null)}
          title='Bill Image'
          dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[80%] lg:!w-[70%] max-w-6xl'
        >
          <div className='flex flex-col items-center'>
            <Image
              src={selectedBillImage}
              alt='Bill Full Size'
              width={800}
              height={600}
              className='max-h-[70vh] max-w-full rounded border border-gray-300 object-contain'
            />
            <div className='mt-4 flex gap-3'>
              <Button
                variant='outline'
                text='Close'
                onClick={() => setSelectedBillImage(null)}
              />
              <Button
                variant='fill'
                text='Open in New Tab'
                onClick={() => window.open(selectedBillImage, '_blank')}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DealerBillsModal;
