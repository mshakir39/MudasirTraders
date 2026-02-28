import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IDealer } from '@/interfaces';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import { POST } from '@/utils/api';

interface AddDealerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealerAdded: () => void;
  editingDealer?: IDealer | null;
}

const AddDealerModal: React.FC<AddDealerModalProps> = ({
  isOpen,
  onClose,
  onDealerAdded,
  editingDealer,
}) => {
  const [formData, setFormData] = useState({
    dealerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    businessType: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingDealer) {
      setFormData({
        dealerName: editingDealer.dealerName || '',
        contactPerson: editingDealer.contactPerson || '',
        phone: editingDealer.phone || '',
        email: editingDealer.email || '',
        address: editingDealer.address || '',
        businessType: editingDealer.businessType || '',
        notes: editingDealer.notes || '',
      });
    } else {
      setFormData({
        dealerName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        businessType: '',
        notes: '',
      });
    }
  }, [editingDealer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dealerName.trim()) {
      toast.error('Dealer name is required');
      return;
    }

    try {
      setIsLoading(true);
      const action = editingDealer ? 'update' : 'create';
      const payload = editingDealer
        ? { action, id: editingDealer.id, ...formData }
        : { action, ...formData };

      const response = await POST('api/dealers', payload);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(
          `Dealer ${editingDealer ? 'updated' : 'created'} successfully`
        );
        onDealerAdded();
        onClose();
      }
    } catch (error) {
      toast.error(`Failed to ${editingDealer ? 'update' : 'create'} dealer`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDealer ? 'Edit Dealer' : 'Add New Dealer'}
      dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[70%] lg:!w-[50%] max-w-2xl'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Input
            type='text'
            label='Dealer Name *'
            name='dealerName'
            value={formData.dealerName}
            onChange={(e) =>
              setFormData({ ...formData, dealerName: e.target.value })
            }
            required
          />

          <Input
            type='text'
            label='Contact Person'
            name='contactPerson'
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
          />

          <Input
            type='tel'
            label='Phone'
            name='phone'
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <Input
            type='email'
            label='Email'
            name='email'
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            type='text'
            label='Business Type'
            name='businessType'
            value={formData.businessType}
            onChange={(e) =>
              setFormData({ ...formData, businessType: e.target.value })
            }
            placeholder='e.g., Battery Supplier, Wholesale Dealer'
          />

          <Input
            type='text'
            label='Address'
            name='address'
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        <Input
          type='textarea'
          label='Notes'
          name='notes'
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className='flex gap-3 pt-4'>
          <Button
            type='submit'
            variant='fill'
            text={editingDealer ? 'Update Dealer' : 'Create Dealer'}
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

export default AddDealerModal;
