// src/components/warranty/WarrantyDetailsWrapper.tsx
// Wrapper to handle different warranty result structures

import React from 'react';
import WarrantyDetails from './WarrantyDetails';

interface WarrantyDetailsWrapperProps {
  warranty: any;
}

const WarrantyDetailsWrapper: React.FC<WarrantyDetailsWrapperProps> = ({ warranty }) => {
  // Handle new structure: { warranty: {...}, daysRemaining: 0, isExpired: false, canClaim: false }
  if (warranty.warranty) {
    // Convert new structure to old structure
    const convertedWarranty = {
      productName: warranty.warranty.productName || '',
      brandName: warranty.warranty.brandName || '',
      series: warranty.warranty.series || '',
      warrentyStartDate: warranty.warranty.warrantyStartDate || '',
      warrentyDuration: warranty.warranty.warrantyPeriod || 6,
      warrentyCode: warranty.warranty.warrantyCode || '',
      customerName: warranty.warranty.customerName || '',
      customerContactNumber: warranty.warranty.customerContactNumber || '',
      invoiceNumber: warranty.warranty.invoiceNumber || '',
      saleDate: warranty.warranty.purchaseDate || new Date().toISOString(),
    };
    
    return <WarrantyDetails warranty={convertedWarranty} />;
  }
  
  // Handle old structure: direct warranty data
  return <WarrantyDetails warranty={warranty} />;
};

export default WarrantyDetailsWrapper;
