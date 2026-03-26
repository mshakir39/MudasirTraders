// src/features/warranty-management/ui/WarrantyInfo.tsx
// Warranty help information - <60 lines

import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { InfoCard } from '@/shared/ui/InfoCard';

export const WarrantyInfo: React.FC = () => {
  return (
    <InfoCard title='How to Find Your Warranty Code' icon={<FaInfoCircle />}>
      <p className='mb-4 text-gray-700'>Your warranty code can be found:</p>
      <ul className='list-inside list-disc space-y-2 text-gray-700'>
        <li>On your battery purchase invoice</li>
        <li>On the warranty card provided with your battery</li>
        <li>In the warranty section of your sales receipt</li>
      </ul>
      <div className='mt-4 text-sm text-gray-600'>
        <p>
          <strong>Multiple Codes:</strong> You can enter multiple warranty codes
          separated by comma or space
        </p>
        <p>
          <strong>Examples:</strong> &quot;ABC123, DEF456&quot; or &quot;ABC123
          DEF456&quot; or &quot;1646603376 1291636542&quot;
        </p>
        <p>The warranty code format looks like: XXX-XXXXXXX</p>
        <p>
          If you cannot find your warranty code, please contact our support
          team.
        </p>
      </div>
    </InfoCard>
  );
};
