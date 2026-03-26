// src/features/review-management/ui/ReviewCard.tsx
// Individual review card component - <120 lines

import React from 'react';
import { FaCheck, FaTimes, FaStar } from 'react-icons/fa';
import { CustomerReview } from '@/entities/review/model/types';
import { StarRating } from '@/shared/ui/StarRating';

interface ReviewCardProps {
  review: CustomerReview;
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string) => void;
  actionLoading?: string | null;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onApprove,
  onReject,
  actionLoading,
  className = '',
}) => {
  const isPending = review.approved !== true;
  const isLoading = actionLoading === review.id;

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md ${className}`}
    >
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex-1'>
          <div className='mb-2 flex items-center space-x-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-500'>
              <span className='text-sm font-semibold text-white'>
                {review.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>
                {review.author_name}
              </h3>
              <div className='flex items-center space-x-2'>
                <StarRating rating={review.rating} />
                <span className='text-sm text-gray-500'>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <p className='leading-relaxed text-gray-700'>{review.text}</p>
        </div>

        <div className='ml-4 flex items-center space-x-2'>
          {review.approved === true ? (
            <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
              <FaCheck className='mr-1 h-3 w-3' />
              Approved
            </span>
          ) : (
            <span className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800'>
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className='flex items-center space-x-3 border-t border-gray-100 pt-4'>
          <button
            onClick={() => onApprove(review.id)}
            disabled={isLoading}
            className='inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FaCheck className='mr-2 h-4 w-4' />
            {isLoading ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => onReject(review.id)}
            disabled={isLoading}
            className='inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FaTimes className='mr-2 h-4 w-4' />
            {isLoading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
};
