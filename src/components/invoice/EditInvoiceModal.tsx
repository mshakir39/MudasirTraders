import React, { useState } from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';

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
  const [editInvoiceData, setEditInvoiceData] = useState<any>({});

  const handleChangeEditInvoice = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditInvoiceData((prevFormData: any) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmitEditInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const submitData = {
      id: data.id,
      additionalPayment: editInvoiceData.additionalPayment,
    };

    onSubmit(submitData);
  };

  return (
    <Modal
      dialogPanelClass='!w-[30%]'
      isOpen={isOpen}
      onClose={onClose}
      title='Add Payment to Invoice'
    >
      <form onSubmit={handleSubmitEditInvoice}>
        <Input
          parentClass='my-4'
          type='text'
          label='Additional Amount'
          name='additionalPayment'
          onChange={handleChangeEditInvoice}
        />
        <Button
          className='w-fit'
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