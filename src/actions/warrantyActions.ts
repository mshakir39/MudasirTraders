'use server';

import { executeOperation } from '@/app/libs/executeOperation';

interface WarrantySearchResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface WarrantyData {
  productName: string;
  brandName: string;
  series: string;
  warrentyStartDate: string;
  warrentyDuration: number;
  warrentyCode: string;
  customerName: string;
  customerContactNumber: string;
  invoiceNumber: string;
  saleDate: string;
  isDeleted?: boolean; // Added for deleted warranty history
  deletedAt?: string; // Added for deleted warranty history
}

export async function searchWarranty(
  warrantyCode: string
): Promise<WarrantySearchResult> {
  try {
    console.log('🔍 Searching for warranty code:', warrantyCode);

    // First try to find in invoices collection
    console.log('📄 Checking invoices collection...');
    const invoiceResult = await executeOperation('invoices', 'find', {
      'products.warrentyCode': warrantyCode,
    });

    console.log('📄 Invoice search result:', invoiceResult);

    if (
      invoiceResult &&
      Array.isArray(invoiceResult) &&
      invoiceResult.length > 0
    ) {
      const invoice = invoiceResult[0];
      const product = invoice.products.find(
        (p: any) => p.warrentyCode === warrantyCode
      );

      if (product) {
        console.log('✅ Found warranty in invoices:', { invoice, product });
        const warrantyData: WarrantyData = {
          productName: `${product.brandName} - ${product.series}`,
          brandName: product.brandName,
          series: product.series,
          warrentyStartDate: product.warrentyStartDate,
          warrentyDuration: product.warrentyDuration || 6, // Default to 6 months if not specified
          warrentyCode: product.warrentyCode,
          customerName: invoice.customerName,
          customerContactNumber: invoice.customerContactNumber,
          invoiceNumber: invoice.invoiceNo,
          saleDate: invoice.createdDate,
        };

        return { success: true, data: warrantyData };
      }
    }

    // If not found in invoices, try sales collection
    console.log('💼 Checking sales collection...');
    const salesResult = await executeOperation('sales', 'find', {
      'products.warrentyCode': warrantyCode,
    });

    console.log('💼 Sales search result:', salesResult);

    if (salesResult && Array.isArray(salesResult) && salesResult.length > 0) {
      const sale = salesResult[0];
      const product = sale.products.find(
        (p: any) => p.warrentyCode === warrantyCode
      );

      if (product) {
        console.log('✅ Found warranty in sales:', { sale, product });
        const warrantyData: WarrantyData = {
          productName: `${product.brandName} - ${product.series}`,
          brandName: product.brandName,
          series: product.series,
          warrentyStartDate: product.warrentyStartDate,
          warrentyDuration: product.warrentyDuration || 6, // Default to 6 months if not specified
          warrentyCode: product.warrentyCode,
          customerName: sale.customerName,
          customerContactNumber: sale.customerContactNumber,
          invoiceNumber: sale.invoiceId,
          saleDate: sale.date,
        };

        return { success: true, data: warrantyData };
      }
    }

    // If not found in active collections, check warranty history (deleted invoices)
    console.log('📚 Checking warranty history (deleted invoices)...');
    const warrantyHistoryResult = await executeOperation(
      'warrantyHistory',
      'find',
      {
        warrentyCode: warrantyCode,
      }
    );

    console.log('📚 Warranty history search result:', warrantyHistoryResult);

    if (
      warrantyHistoryResult &&
      Array.isArray(warrantyHistoryResult) &&
      warrantyHistoryResult.length > 0
    ) {
      const warrantyRecord = warrantyHistoryResult[0];
      console.log(
        '✅ Found warranty in history (deleted invoice):',
        warrantyRecord
      );

      const warrantyData: WarrantyData = {
        productName: `${warrantyRecord.productDetails.brandName} - ${warrantyRecord.productDetails.series}`,
        brandName: warrantyRecord.productDetails.brandName,
        series: warrantyRecord.productDetails.series,
        warrentyStartDate: warrantyRecord.productDetails.warrentyStartDate,
        warrentyDuration: warrantyRecord.productDetails.warrentyDuration || 6,
        warrentyCode: warrantyRecord.warrentyCode,
        customerName: warrantyRecord.customerName,
        customerContactNumber: warrantyRecord.customerContactNumber,
        invoiceNumber: warrantyRecord.originalInvoiceNo,
        saleDate: warrantyRecord.originalInvoice.createdDate,
        isDeleted: true, // Flag to indicate this is from a deleted invoice
        deletedAt: warrantyRecord.deletedAt,
      };

      return { success: true, data: warrantyData };
    }

    console.log('❌ No warranty found in any collection');
    return { success: false, error: 'No warranty found with this code' };
  } catch (error: any) {
    console.error('❌ Error searching warranty:', error);
    return { success: false, error: error.message };
  }
}
