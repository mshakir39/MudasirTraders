// src/features/invoice-management/ui/components/customer/CustomerTypeSelector.tsx
// Customer type selector component - <40 lines

'use client';

import React from 'react';
import Dropdown from '@/components/dropdown';

interface CustomerTypeSelectorProps {
  customerType: string;
  onChange: (value: string) => void;
}

export const CustomerTypeSelector: React.FC<CustomerTypeSelectorProps> = ({
  customerType,
  onChange,
}) => {
  const customerTypes = [
    { label: 'Walk In Customer', value: 'WalkIn Customer' },
    { label: 'Regular Customer', value: 'Regular' },
  ];

  const selectedOption = customerTypes.find(option => option.value === customerType);

  return (
    <div>
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        Customer Type
      </label>
      <Dropdown
        options={customerTypes}
        value={selectedOption || null}
        onSelect={(option) => onChange(option.value)}
        placeholder='Select Customer Type'
      />
    </div>
  );
};
