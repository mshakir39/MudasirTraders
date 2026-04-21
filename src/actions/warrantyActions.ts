'use server';

import { executeOperation } from '@/app/libs/executeOperation';

interface WarrantyData {
  productName: string;
  brandName: string;
  series: string;
  warrentyStartDate: string;
  warrentyEndDate?: string;
  warrentyDuration: number | string; // Allow both to match DB schema
  warrentyCode: string;
  customerName: string;
  customerContactNumber: string;
  invoiceNumber: string;
  saleDate: string;
  isDeleted?: boolean; // Added for deleted warranty history
  deletedAt?: string; // Added for deleted warranty history
  // React 19: Add search metadata
  searchTimestamp?: string;
  searchDuration?: number;
}

interface WarrantySearchResult {
  success: boolean;
  data?: any;
  error?: string;
  // React 19: Add search performance tracking
  searchDuration?: number;
}

export async function searchWarranty(
  warrantyCode: string
): Promise<WarrantySearchResult> {
  try {
    const trimmedWarrantyCode = warrantyCode.trim().toUpperCase();

    if (!trimmedWarrantyCode) {
      return { success: false, error: 'Warranty code is required' };
    }

    const searchStartTime = Date.now();

    // FAST PATH: Use warranty lookup collection with indexed search
    const lookupResult = await executeOperation('warrantyLookup', 'findOne', {
      warrentyCode: trimmedWarrantyCode,
    });

    if (
      lookupResult &&
      typeof lookupResult === 'object' &&
      'warrentyCode' in lookupResult
    ) {
      // Calculate warranty end date
      const startDate = new Date(lookupResult.warrentyStartDate);
      const endDate = new Date(startDate);
      if (!isNaN(startDate.getTime())) {
        const duration = parseInt(String(lookupResult.warrentyDuration || 0));
        endDate.setMonth(endDate.getMonth() + duration);
      }

      const warrantyData: WarrantyData = {
        productName: `${lookupResult.brandName} - ${lookupResult.series}`,
        brandName: lookupResult.brandName,
        series: lookupResult.series,
        warrentyStartDate: lookupResult.warrentyStartDate,
        warrentyEndDate: endDate.toISOString(),
        warrentyDuration: lookupResult.warrentyDuration || '',
        warrentyCode: lookupResult.warrentyCode,
        customerName: lookupResult.customerName,
        customerContactNumber: lookupResult.customerContactNumber,
        invoiceNumber: lookupResult.invoiceNo,
        saleDate: lookupResult.createdAt,
        searchTimestamp: new Date().toISOString(),
        searchDuration: Date.now() - searchStartTime,
      };

      return {
        success: true,
        data: warrantyData,
        searchDuration: Date.now() - searchStartTime,
      };
    }

    // FALLBACK: If not found in lookup, check warranty history (deleted invoices)
    const allWarrantyHistory = await executeOperation(
      'warrantyHistory',
      'find',
      {}
    );

    if (allWarrantyHistory && Array.isArray(allWarrantyHistory)) {
      for (const warrantyRecord of allWarrantyHistory) {
        if (
          warrantyRecord.warrentyCode &&
          warrantyRecord.warrentyCode.toUpperCase() === trimmedWarrantyCode
        ) {
          if (!warrantyRecord.productDetails) continue;

          const startDate = new Date(
            warrantyRecord.productDetails.warrentyStartDate
          );
          const endDate = new Date(startDate);
          if (!isNaN(startDate.getTime())) {
            const duration = parseInt(
              String(warrantyRecord.productDetails.warrentyDuration || 0)
            );
            endDate.setMonth(endDate.getMonth() + duration);
          }

          const warrantyData: WarrantyData = {
            productName: `${warrantyRecord.productDetails.brandName} - ${warrantyRecord.productDetails.series}`,
            brandName: warrantyRecord.productDetails.brandName,
            series: warrantyRecord.productDetails.series,
            warrentyStartDate: warrantyRecord.productDetails.warrentyStartDate,
            warrentyEndDate: endDate.toISOString(),
            warrentyDuration:
              warrantyRecord.productDetails.warrentyDuration || '',
            warrentyCode: warrantyRecord.warrentyCode,
            customerName: warrantyRecord.customerName,
            customerContactNumber: warrantyRecord.customerContactNumber,
            invoiceNumber: warrantyRecord.originalInvoiceNo,
            saleDate: warrantyRecord.deletedAt || new Date().toISOString(),
            isDeleted: true,
            deletedAt: warrantyRecord.deletedAt,
            searchTimestamp: new Date().toISOString(),
            searchDuration: Date.now() - searchStartTime,
          };

          return {
            success: true,
            data: warrantyData,
            searchDuration: Date.now() - searchStartTime,
          };
        }
      }
    }

    return {
      success: false,
      error: 'Warranty code not found',
      searchDuration: Date.now() - searchStartTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
