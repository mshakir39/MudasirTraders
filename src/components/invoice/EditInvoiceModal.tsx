import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import CheckboxGroup from '@/components/checkboxGroup';

const paymentOptions = [
  { id: 'Credit', value: 'Credit', label: 'Credit' },
  { id: 'Old Battery', value: 'Old Battery', label: 'Old Battery' },
  { id: 'Easy Paisa', value: 'Easy Paisa', label: 'Easy Paisa' },
  { id: 'Jazz Cash', value: 'Jazz Cash', label: 'Jazz Cash' },
  { id: 'Bank', value: 'Bank', label: 'Bank' },
];

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  isOpen,
  onClose,
  data,
  onSubmit,
  isLoading,
}) => {
  const [editInvoiceData, setEditInvoiceData] = useState<any>({
    additionalPayment: '',
    paymentMethod: [],
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setEditInvoiceData({
        additionalPayment: '',
        paymentMethod: [],
      });
    }
  }, [isOpen]);

  const handleChangeEditInvoice = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditInvoiceData((prevFormData: any) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (values: string[]) => {
    setEditInvoiceData((prevFormData: any) => ({
      ...prevFormData,
      paymentMethod: values,
    }));
  };

  const handleSubmitEditInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate payment method
    if (!editInvoiceData.paymentMethod || editInvoiceData.paymentMethod.length === 0) {
      toast.error('Please select at least one payment method');
      return;
    }

    // Validate amount
    if (!editInvoiceData.additionalPayment || parseFloat(editInvoiceData.additionalPayment) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const submitData = {
      id: data.id,
      additionalPayment: parseFloat(editInvoiceData.additionalPayment),
      paymentMethod: editInvoiceData.paymentMethod,
    };

    onSubmit(submitData);
  };

  return (
    <Modal
      dialogPanelClass='!w-[40%]'
      isOpen={isOpen}
      onClose={onClose}
      title='Add Payment to Invoice'
    >
      <form onSubmit={handleSubmitEditInvoice}>
        <div className='space-y-4'>
          <Input
            type='number'
            label='Additional Amount'
            name='additionalPayment'
            value={editInvoiceData.additionalPayment}
            onChange={handleChangeEditInvoice}
            min={0}
            step="0.01"
            required
          />
          
          <div className='flex flex-col gap-2'>
            <span className='text-sm font-medium text-gray-700'>
              Payment Method: <span className="text-red-500">*</span>
            </span>
            <div className="p-4 bg-gray-50 rounded-md">
              <CheckboxGroup
                options={paymentOptions}
                onChange={handlePaymentMethodChange}
                checkedValues={editInvoiceData.paymentMethod}
              />
            </div>
          </div>
        </div>
        
        <Button
          className='w-fit mt-4'
          variant='fill'
          text='Add Amount'
          type='submit'
          isPending={isLoading}
        />
      </form>
    </Modal>
  );
};

export default EditInvoiceModal;