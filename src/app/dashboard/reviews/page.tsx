'use client';

import React, { useState, useEffect } from 'react';
import { FaStar, FaCheck, FaTimes, FaEye, FaTrash, FaPlus } from 'react-icons/fa';
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
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter(review => {
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews Management</h1>
        <p className="text-gray-600">Manage customer reviews and testimonials</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({reviews.filter(r => r.approved !== true).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved ({reviews.filter(r => r.approved === true).length})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FaStar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {filter === 'pending' ? 'No pending reviews' : filter === 'approved' ? 'No approved reviews' : 'No reviews yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'All reviews have been processed.' : filter === 'approved' ? 'No reviews have been approved yet.' : 'Customer reviews will appear here.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {review.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.author_name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.text}</p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {review.approved === true ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheck className="h-3 w-3 mr-1" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {review.approved !== true && (
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(review.id)}
                    disabled={actionLoading === review.id}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaCheck className="h-4 w-4 mr-2" />
                    {actionLoading === review.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    disabled={actionLoading === review.id}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTimes className="h-4 w-4 mr-2" />
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
