// src/pages/ReviewsManagementPage.tsx
// Reviews management page - <50 lines (composition only)

import React from 'react';
import { ReviewManagement } from '@/features/review-management';

export default function ReviewsManagementPage() {
  return (
    <div className='p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Reviews Management</h1>
      </div>

      {/* Review Management Component */}
      <ReviewManagement />
    </div>
  );
}
