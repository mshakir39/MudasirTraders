// src/features/invoice-management/ui/components/customer/CustomerDetailsForm.tsx
// Customer details form component - <60 lines

'use client';

import React from 'react';
import Input from '@/components/customInput';
import CustomerNameAutocomplete from '@/components/CustomerNameAutocomplete';

interface CustomerDetailsFormProps {
  customerName: string;
  customerAddress: string;
  customerContactNumber: string;
  customerId?: string;
  onChange: (field: string, value: any) => void;
  customers: any[];
}

export const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({
  customerName,
  customerAddress,
  customerContactNumber,
  customerId,
  onChange,
  customers,
}) => {
  return (
    <div className='space-y-4'>
      {/* Customer Name */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Customer Name
        </label>
        <CustomerNameAutocomplete
          value={customerName}
          onChange={(value) => onChange('customerName', value)}
          name='customerName'
          label='Customer Name'
          customerType='Regular Customer'
        />
      </div>

      {/* Customer Address */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Address
        </label>
        <Input
          value={customerAddress}
          onChange={(e) => onChange('customerAddress', e.target.value)}
          placeholder='Enter customer address'
        />
      </div>

      {/* Customer Contact */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Contact Number
        </label>
        <Input
          value={customerContactNumber}
          onChange={(e) => onChange('customerContactNumber', e.target.value)}
          placeholder='Enter contact number'
        />
      </div>

      {/* Customer ID (for regular customers) */}
      {customerId && (
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Customer ID
          </label>
          <Input value={customerId} disabled className='bg-gray-50' />
        </div>
      )}
    </div>
  );
};
