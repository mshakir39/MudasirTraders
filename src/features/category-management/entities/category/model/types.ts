// src/features/category-management/entities/category/model/types.ts
// Category entity types and interfaces

export interface BatteryData {
  id: string;
  series: string;
  quantity: number;
  productPrice: number;
  totalPrice: number;
  warrentyCode: string;
  warrentyStartDate: string;
  warrentyDuration: string;
  warrentyEndDate: string;
  noWarranty?: boolean;
  batteryDetails?: {
    name: string;
    plate: string | number;
    ah: number;
    type?: string;
    retailPrice?: number;
    salesTax?: number;
    maxRetailPrice?: number;
  };
}

export interface CategoryWithBatteryData {
  id: string;
  brandName: string;
  series: BatteryData[];
  salesTax?: number;
}

export interface CategoryFormData {
  brandName: string;
  series: string;
  quantity: number;
  productPrice: number;
  totalPrice: number;
  warrentyCode: string;
  warrentyStartDate: string;
  warrentyDuration: string;
  warrentyEndDate: string;
  noWarranty?: boolean;
}

export interface CategoryCreateRequest {
  brandName: string;
  series: string;
  quantity: number;
  productPrice: number;
  totalPrice: number;
  warrentyCode: string;
  warrentyStartDate: string;
  warrentyDuration: string;
  warrentyEndDate: string;
  noWarranty?: boolean;
}

export interface CategoryUpdateRequest {
  id: string;
  brandName?: string;
  series?: string;
  quantity?: number;
  productPrice?: number;
  totalPrice?: number;
  warrentyCode?: string;
  warrentyStartDate?: string;
  warrentyDuration?: string;
  warrentyEndDate?: string;
  noWarranty?: boolean;
}

export interface CategoryDeleteRequest {
  id: string;
}

export interface CategoryHistoryEntry {
  id: string;
  categoryId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
  data: CategoryWithBatteryData;
  changes?: any;
}

export interface CategoryApiResponse {
  success: boolean;
  data?: CategoryWithBatteryData[];
  error?: string;
}

export interface CategoryActionResponse {
  success: boolean;
  data?: CategoryWithBatteryData;
  error?: string;
}

export interface Brand {
  id: string;
  brandName: string;
  createdAt?: string;
  updatedAt?: string;
}
