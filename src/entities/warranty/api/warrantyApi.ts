// src/entities/warranty/api/warrantyApi.ts
// Wrap existing warranty API - NO new functionality

import { WarrantySearchResult } from '../model/types';

// Wrap existing searchWarranty action
export class WarrantyApi {
  static async searchWarranty(warrantyCode: string): Promise<any> {
    try {
      // Call the API endpoint instead of importing server action
      const response = await fetch(`/api/warranty/search?warrantyCode=${encodeURIComponent(warrantyCode)}`);
      const result = await response.json();
      
      // Return original data structure for WarrantyDetails component
      return result;
    } catch (error) {
      console.error('Error searching warranty:', error);
      throw error;
    }
  }
}
