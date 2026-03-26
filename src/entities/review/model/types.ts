// src/entities/review/model/types.ts
// Review entity types and interfaces

export interface CustomerReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  createdAt: string;
  approved: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface ReviewFilter {
  type: 'all' | 'approved' | 'pending';
}

export interface ReviewAction {
  action: 'approve' | 'reject';
  reviewId: string;
}

export interface ReviewApiResponse {
  reviews: CustomerReview[];
  success: boolean;
  error?: string;
}

export interface ReviewStats {
  total: number;
  approved: number;
  pending: number;
}
