// src/entities/warranty/model/types.ts
// Warranty entity types and interfaces

export interface Warranty {
  id: string;
  warrantyCode: string;
  customerName: string;
  customerContactNumber: string;
  productName: string;
  brandName: string;
  series: string;
  purchaseDate: Date;
  warrantyStartDate: Date;
  warrantyEndDate: Date;
  warrantyPeriod: number; // in months
  status: WarrantyStatus;
  claims: WarrantyClaim[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WarrantyClaim {
  id: string;
  claimDate: Date;
  issue: string;
  resolution: string;
  status: ClaimStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type WarrantyStatus = 'active' | 'expired' | 'claimed' | 'cancelled';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export interface WarrantySearchResult {
  warranty: Warranty;
  daysRemaining: number;
  isExpired: boolean;
  canClaim: boolean;
}

export interface WarrantySearchRequest {
  warrantyCode: string;
  includeHistory?: boolean;
}

export interface WarrantyCreateRequest {
  warrantyCode: string;
  customerName: string;
  customerContactNumber: string;
  productName: string;
  brandName: string;
  series: string;
  purchaseDate: Date;
  warrantyPeriod: number;
}

export interface WarrantyClaimRequest {
  warrantyId: string;
  issue: string;
  claimDate: Date;
}
