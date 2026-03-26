// src/features/review-management/ui/ReviewManagement.tsx
// Main review management component - <120 lines

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CustomerReview, ReviewFilter } from '@/entities/review/model/types';
import { ReviewApi } from '@/entities/review/api/reviewApi';
import { FilterTabs } from '@/shared/ui/FilterTabs';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ReviewList } from './ReviewList';

interface ReviewManagementProps {
  className?: string;
}

export const ReviewManagement: React.FC<ReviewManagementProps> = ({
  className = '',
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter['type']>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await ReviewApi.fetchReviews(true);
      setReviews(data);
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
      await ReviewApi.approveReview(reviewId);
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
      await ReviewApi.rejectReview(reviewId);
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

  if (loading) {
    return <LoadingSpinner size='lg' className='h-64' />;
  }

  const stats = ReviewApi.getReviewStats(reviews);
  const filteredReviews = ReviewApi.filterReviews(reviews, filter);

  const filterTabs = [
    { key: 'all', label: 'All Reviews', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
  ];

  const getEmptyMessages = () => {
    switch (filter) {
      case 'pending':
        return {
          message: 'No pending reviews',
          description: 'All reviews have been processed.',
        };
      case 'approved':
        return {
          message: 'No approved reviews',
          description: 'No reviews have been approved yet.',
        };
      default:
        return {
          message: 'No reviews yet',
          description: 'Customer reviews will appear here.',
        };
    }
  };

  const { message, description } = getEmptyMessages();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Tabs */}
      <FilterTabs
        tabs={filterTabs}
        activeFilter={filter}
        onFilterChange={(newFilter) =>
          setFilter(newFilter as ReviewFilter['type'])
        }
      />

      {/* Reviews List */}
      <ReviewList
        reviews={filteredReviews}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
        emptyMessage={message}
        emptyDescription={description}
      />
    </div>
  );
};
