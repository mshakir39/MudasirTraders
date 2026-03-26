// src/features/invoice-management/ui/components/product/ProductBatteryDetails.tsx
// Product battery details component - <40 lines

'use client';

import React from 'react';
import Input from '@/components/customInput';

interface ProductBatteryDetailsProps {
  batteryDetails: string;
  onBatteryDetailsChange: (details: string) => void;
  disabled?: boolean;
}

export const ProductBatteryDetails: React.FC<ProductBatteryDetailsProps> = ({
  batteryDetails,
  onBatteryDetailsChange,
  disabled = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Battery Details
      </label>
      <Input
        type="text"
        value={batteryDetails}
        onChange={(e) => onBatteryDetailsChange(e.target.value)}
        placeholder="Enter battery details (optional)"
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};
