'use client';

import React, { useState, useEffect } from 'react';
import {
  FaStar,
  FaCheck,
  FaTimes,
  FaEye,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';
import { toast } from 'react-toastify';

interface CustomerReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  createdAt: string;
  approved: boolean;
  ip_address?: string;
  user_agent?: string;
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Fetch all reviews for admin management
      const response = await fetch('/api/reviews?admin=true');
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve', reviewId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve review');
      }

      toast.success('Review approved successfully');
      fetchReviews(); // Refresh the list

      // Notify sidebar to refresh pending reviews count
      window.dispatchEvent(new CustomEvent('reviewsUpdated'));
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reviewId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject review');
      }

      toast.success('Review rejected and removed');
      fetchReviews(); // Refresh the list

      // Notify sidebar to refresh pending reviews count
      window.dispatchEvent(new CustomEvent('reviewsUpdated'));
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-current text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter((review) => {
    switch (filter) {
      case 'approved':
        return review.approved === true;
      case 'pending':
        return review.approved !== true;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>
          Reviews Management
        </h1>
        <p className='text-gray-600'>
          Manage customer reviews and testimonials
        </p>
      </div>

      {/* Filter Tabs */}
      <div className='mb-6'>
        <div className='flex w-fit space-x-1 rounded-lg bg-gray-100 p-1'>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({reviews.filter((r) => r.approved !== true).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved ({reviews.filter((r) => r.approved === true).length})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className='space-y-4'>
        {filteredReviews.length === 0 ? (
          <div className='rounded-lg bg-gray-50 py-12 text-center'>
            <FaStar className='mx-auto mb-4 h-16 w-16 text-gray-300' />
            <h3 className='mb-2 text-xl font-medium text-gray-900'>
              {filter === 'pending'
                ? 'No pending reviews'
                : filter === 'approved'
                  ? 'No approved reviews'
                  : 'No reviews yet'}
            </h3>
            <p className='text-gray-600'>
              {filter === 'pending'
                ? 'All reviews have been processed.'
                : filter === 'approved'
                  ? 'No reviews have been approved yet.'
                  : 'Customer reviews will appear here.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className='rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'
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
                        <div className='flex items-center space-x-1'>
                          {renderStars(review.rating)}
                        </div>
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
              {review.approved !== true && (
                <div className='flex items-center space-x-3 border-t border-gray-100 pt-4'>
                  <button
                    onClick={() => handleApprove(review.id)}
                    disabled={actionLoading === review.id}
                    className='inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <FaCheck className='mr-2 h-4 w-4' />
                    {actionLoading === review.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    disabled={actionLoading === review.id}
                    className='inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <FaTimes className='mr-2 h-4 w-4' />
                    {actionLoading === review.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
