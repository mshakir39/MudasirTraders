// src/features/brand-management/entities/brand/model/types.ts
// Brand entity types and interfaces

export interface Brand {
  id: string;
  brandName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandFormData {
  brandName: string;
}

export interface BrandCreateRequest {
  brandName: string;
}

export interface BrandDeleteRequest {
  id: string;
}

export interface BrandApiResponse {
  success: boolean;
  data?: Brand[];
  error?: string;
}

export interface BrandCreateResponse {
  success: boolean;
  data?: Brand;
  error?: string;
}
