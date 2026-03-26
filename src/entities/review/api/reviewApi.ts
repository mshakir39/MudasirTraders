// src/entities/review/api/reviewApi.ts
// Review API operations - wraps existing API endpoints

import {
  CustomerReview,
  ReviewAction,
  ReviewApiResponse,
  ReviewStats,
} from '../model/types';

export class ReviewApi {
  // Fetch all reviews for admin management
  static async fetchReviews(admin: boolean = true): Promise<CustomerReview[]> {
    try {
      const response = await fetch(`/api/reviews?admin=${admin}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data: ReviewApiResponse = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  // Approve a review
  static async approveReview(reviewId: string): Promise<void> {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve', reviewId } as ReviewAction),
      });

      if (!response.ok) {
        throw new Error('Failed to approve review');
      }
    } catch (error) {
      console.error('Error approving review:', error);
      throw error;
    }
  }

  // Reject a review
  static async rejectReview(reviewId: string): Promise<void> {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reviewId } as ReviewAction),
      });

      if (!response.ok) {
        throw new Error('Failed to reject review');
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      throw error;
    }
  }

  // Get review statistics
  static getReviewStats(reviews: CustomerReview[]): ReviewStats {
    const total = reviews.length;
    const approved = reviews.filter(
      (review) => review.approved === true
    ).length;
    const pending = reviews.filter((review) => review.approved !== true).length;

    return { total, approved, pending };
  }

  // Filter reviews by status
  static filterReviews(
    reviews: CustomerReview[],
    filter: 'all' | 'approved' | 'pending'
  ): CustomerReview[] {
    switch (filter) {
      case 'approved':
        return reviews.filter((review) => review.approved === true);
      case 'pending':
        return reviews.filter((review) => review.approved !== true);
      default:
        return reviews;
    }
  }
}
