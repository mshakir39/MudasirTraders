// src/features/review-management/ui/ReviewList.tsx
// Review list component - <100 lines

import React from 'react';
import { FaStar } from 'react-icons/fa';
import { CustomerReview } from '@/entities/review/model/types';
import { ReviewCard } from './ReviewCard';

interface ReviewListProps {
  reviews: CustomerReview[];
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string) => void;
  actionLoading?: string | null;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  onApprove,
  onReject,
  actionLoading,
  emptyMessage = 'No reviews yet',
  emptyDescription = 'Customer reviews will appear here.',
  className = '',
}) => {
  if (reviews.length === 0) {
    return (
      <div className={`rounded-lg bg-gray-50 py-12 text-center ${className}`}>
        <FaStar className='mx-auto mb-4 h-16 w-16 text-gray-300' />
        <h3 className='mb-2 text-xl font-medium text-gray-900'>
          {emptyMessage}
        </h3>
        <p className='text-gray-600'>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onApprove={onApprove}
          onReject={onReject}
          actionLoading={actionLoading}
        />
      ))}
    </div>
  );
};
