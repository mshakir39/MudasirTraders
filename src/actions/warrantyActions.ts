'use server';

import { executeOperation } from '@/app/libs/executeOperation';

interface WarrantyData {
  productName: string;
  brandName: string;
  series: string;
  warrentyStartDate: string;
  warrentyEndDate?: string;
  warrentyDuration: number | string;  // Allow both to match DB schema
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

    // React 19: Add search analytics (optional)
    const searchStartTime = Date.now();

    // Helper function to check if a warranty code exists in a space or comma-separated string
    const hasWarrantyCode = (
      warrantyString: string,
      searchCode: string
    ): boolean => {
      if (!warrantyString || !searchCode) return false;

      // Convert warranty string to uppercase for case-insensitive comparison
      const normalizedWarrantyString = warrantyString.trim().toUpperCase();

      // First, try exact match (in case the search code is the complete warranty string)
      if (normalizedWarrantyString === searchCode.trim()) {
        return true;
      }

      // Split the warranty string by spaces OR commas and check if the search code exists
      const codes = normalizedWarrantyString
        .split(/[\s,]+/)
        .filter((code) => code.length > 0);

      // Check if the search code exists as a complete code in the array
      const found = codes.includes(searchCode);

      // If not found, try to match by combining adjacent codes
      if (!found) {
        for (let i = 0; i < codes.length - 1; i++) {
          const combinedCode = `${codes[i]} ${codes[i + 1]}`;
          if (combinedCode === searchCode) {
            return true;
          }
        }
      }

      return found;
    };

    // Get all invoices and check each product's warranty code
    const allInvoices = await executeOperation('invoices', 'find', {});

    if (!allInvoices || !Array.isArray(allInvoices)) {
      // No invoices found
    } else {
      for (const invoice of allInvoices) {
        if (invoice.products && Array.isArray(invoice.products)) {
          for (const product of invoice.products) {
            if (product.warrentyCode) {
            }
          }
        }
      }
      for (const invoice of allInvoices) {
        if (!invoice.products || !Array.isArray(invoice.products)) continue;

        for (const product of invoice.products) {
          if (
            product.warrentyCode &&
            hasWarrantyCode(product.warrentyCode, trimmedWarrantyCode)
          ) {
            // Found warranty code in invoice

            // React 19: Enhanced warranty data with additional fields
            // Calculate warranty end date
            const startDate = new Date(product.warrentyStartDate);
            const endDate = new Date(startDate);
            if (!isNaN(startDate.getTime())) {
              const duration = parseInt(String(product.warrentyDuration || 0));
              endDate.setMonth(endDate.getMonth() + duration);
            }

            const warrantyData: WarrantyData = {
              productName: `${product.brandName} - ${product.series}`,
              brandName: product.brandName,
              series: product.series,
              warrentyStartDate: product.warrentyStartDate,
              warrentyEndDate: endDate.toISOString(),
              warrentyDuration: product.warrentyDuration || '',
              warrentyCode: product.warrentyCode,
              customerName: invoice.customerName,
              customerContactNumber: invoice.customerContactNumber,
              invoiceNumber: invoice.invoiceNo,
              saleDate:
                invoice.createdAt ||
                invoice.createdDate ||
                new Date().toISOString(),
              // React 19: Add search metadata
              searchTimestamp: new Date().toISOString(),
              searchDuration: Date.now() - searchStartTime,
            };

            return { success: true, data: warrantyData };
          }
        }
      }
    }

    // If not found in invoices, try sales collection
    const allSales = await executeOperation('sales', 'find', {});

    if (!allSales || !Array.isArray(allSales)) {
      // No sales found
    } else {
      for (const sale of allSales) {
        if (!sale.products || !Array.isArray(sale.products)) continue;

        for (const product of sale.products) {
          if (
            product.warrentyCode &&
            hasWarrantyCode(product.warrentyCode, trimmedWarrantyCode)
          ) {
            // Found warranty code in sale

            // Calculate warranty end date
            const startDate = new Date(product.warrentyStartDate);
            const endDate = new Date(startDate);
            if (!isNaN(startDate.getTime())) {
              const duration = parseInt(String(product.warrentyDuration || 0));
              endDate.setMonth(endDate.getMonth() + duration);
            }

            const warrantyData: WarrantyData = {
              productName: `${product.brandName} - ${product.series}`,
              brandName: product.brandName,
              series: product.series,
              warrentyStartDate: product.warrentyStartDate,
              warrentyEndDate: endDate.toISOString(),
              warrentyDuration: product.warrentyDuration || '',
              warrentyCode: product.warrentyCode,
              customerName: sale.customerName,
              customerContactNumber: sale.customerContactNumber,
              invoiceNumber: sale.invoiceId,
              saleDate: sale.date,
              // React 19: Add search metadata
              searchTimestamp: new Date().toISOString(),
              searchDuration: Date.now() - searchStartTime,
            };

            return { success: true, data: warrantyData };
          }
        }
      }
    }

    // If not found in active collections, check warranty history (deleted invoices)
    const allWarrantyHistory = await executeOperation(
      'warrantyHistory',
      'find',
      {}
    );

    if (!allWarrantyHistory || !Array.isArray(allWarrantyHistory)) {
      // No warranty history found
    } else {
      for (const warrantyRecord of allWarrantyHistory) {
        if (
          warrantyRecord.warrentyCode &&
          hasWarrantyCode(warrantyRecord.warrentyCode, trimmedWarrantyCode)
        ) {
          // Found warranty code in warranty history

          if (!warrantyRecord.productDetails) {
            continue;
          }

          // Calculate warranty end date
          const startDate = new Date(warrantyRecord.productDetails.warrentyStartDate);
          const endDate = new Date(startDate);
          if (!isNaN(startDate.getTime())) {
            const duration = parseInt(String(warrantyRecord.productDetails.warrentyDuration || 0));
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
            isDeleted: true, // Flag to indicate this is from a deleted invoice
            deletedAt: warrantyRecord.deletedAt,
            // React 19: Add search metadata
            searchTimestamp: new Date().toISOString(),
            searchDuration: Date.now() - searchStartTime,
          };

          return { success: true, data: warrantyData };
        }
      }
    }

    // Enhanced logging with search performance
    const totalSearchDuration = Date.now() - searchStartTime;

    return {
      success: false,
      error: 'Warranty code not found',
      searchDuration: totalSearchDuration,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
