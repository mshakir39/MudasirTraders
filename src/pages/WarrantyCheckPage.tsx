'use client';

import React, { useState } from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { WarrantySearch, WarrantyInfo } from '@/features/warranty-management';
import WarrantyDetailsWrapper from '@/components/warranty/WarrantyDetailsWrapper';
// import WarrantyErrorBoundary from '@/components/warranty/WarrantyErrorBoundary'; // Temporarily disabled due to SWC error

export default function WarrantyCheckPage() {
  const [warrantyData, setWarrantyData] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSearchResult = (result: any) => {
    if (result && (result.success || result.warranty)) {
      setWarrantyData(result);
    } else {
      setWarrantyData(null);
    }
    setIsPending(false);
  };

  return (
    // <WarrantyErrorBoundary>
    <div className='container mx-auto p-0 py-6 md:p-6'>
      <div className='mx-auto max-w-4xl'>
        {/* Header Section */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex items-center justify-center'>
            <FaShieldAlt className='mr-3 text-4xl' style={{ color: '#4287f5' }} />
            <h1 className='text-2xl font-bold text-secondary-900'>Battery Warranty Check</h1>
          </div>
          <p className='text-secondary-600'>
            Enter your warranty code to check the status of your battery warranty
          </p>
        </div>

        {/* Search Section */}
        <div className='mb-8 rounded-lg bg-white p-6 shadow-sm border border-secondary-200'>
          <WarrantySearch onSearchResult={handleSearchResult} />
        </div>

        {/* Information Section (shown when no search result) */}
        {!warrantyData && !isPending && <WarrantyInfo />}

        {/* Warranty Details */}
        {warrantyData && (warrantyData.success || warrantyData.warranty) && (
          <WarrantyDetailsWrapper warranty={warrantyData.data || warrantyData} />
        )}
      </div>
    </div>
    // </WarrantyErrorBoundary>
  );
}
