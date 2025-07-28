import React from 'react';
import Input from '@/components/customInput';
import Dropdown from '@/components/dropdown';

interface CustomerSectionProps {
  invoiceData: any;
  setInvoiceData: (data: any) => void;
  customers: any[];
  onChange: (e: any) => void;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({
  invoiceData,
  setInvoiceData,
  customers,
  onChange,
}) => {
  return (
    <>
      <div className='flex gap-4 mt-2'>
        <label className="flex items-center gap-2">
          <input
            type='radio'
            name='customerType'
            value='WalkIn Customer'
            checked={invoiceData?.customerType === 'WalkIn Customer'}
            onChange={onChange}
          />
          Walk-In Customer
        </label>
        <label className="flex items-center gap-2">
          <input
            type='radio'
            name='customerType'
            value='Regular'
            checked={invoiceData?.customerType === 'Regular'}
            onChange={onChange}
          />
          Regular Customer
        </label>
      </div>

      {invoiceData?.customerType === 'Regular' && (
        <div>
          <Dropdown
            key={invoiceData.customerType}
            className='mt-2'
            options={customers.map(customer => ({
              label: customer.name,
              value: customer.id.toString()
            }))}
            defaultValue={invoiceData.customerId?.toString() || ''}
            onSelect={(option) => {
              const selectedCustomer = customers.find(c => c.id.toString() === option.value);
              if (selectedCustomer) {
                console.log("selectedCustomer",selectedCustomer)
                setInvoiceData((prev: any) => ({
                  ...prev,
                  customerName: selectedCustomer.name,
                  customerAddress: selectedCustomer.address,
                  customerContactNumber: selectedCustomer.contactInfo,
                  clientName: selectedCustomer.name,
                  customerId: selectedCustomer.id // Ensure it's a number
                }));
              }
            }}
            placeholder='Select Regular Customer'
          />
        </div>
      )}

      <Input
        type='text'
        label='Customer Name'
        name='customerName'
        value={invoiceData?.customerName || ''}
        required
        minLength={2}
        maxLength={100}
        onChange={onChange}
        readOnly={invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId}
        placeholder={invoiceData?.customerType === 'Regular' && !invoiceData?.customerId ? 'Select a customer above' : ''}
      />

      <Input
        type='text'
        label='Customer Address'
        name='customerAddress'
        value={invoiceData?.customerAddress || ''}
        required
        minLength={5}
        maxLength={200}
        onChange={onChange}
        readOnly={invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId}
        placeholder={invoiceData?.customerType === 'Regular' && !invoiceData?.customerId ? 'Select a customer above' : ''}
      />

      <Input
        type='tel'
        label='Contact Number'
        name='customerContactNumber'
        value={invoiceData?.customerContactNumber || ''}
        pattern='[0-9+\-\s]+'
        maxLength={20}
        onChange={onChange}
        readOnly={invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId}
        placeholder={invoiceData?.customerType === 'Regular' && !invoiceData?.customerId ? 'Select a customer above' : ''}
      />
    </>
  );
};

export default CustomerSection;