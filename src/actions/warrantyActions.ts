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
}

export async function searchWarranty(warrantyCode: string): Promise<WarrantySearchResult> {
  try {
    console.log('🔍 Searching for warranty code:', warrantyCode);

    // First try to find in invoices collection
    console.log('📄 Checking invoices collection...');
    const invoiceResult = await executeOperation(
      'invoices',
      'find',
      {
        'products.warrentyCode': warrantyCode
      }
    );

    console.log('📄 Invoice search result:', invoiceResult);

    if (invoiceResult && Array.isArray(invoiceResult) && invoiceResult.length > 0) {
      const invoice = invoiceResult[0];
      const product = invoice.products.find((p: any) => p.warrentyCode === warrantyCode);

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
          saleDate: invoice.createdDate
        };

        return { success: true, data: warrantyData };
      }
    }

    // If not found in invoices, try sales collection
    console.log('💼 Checking sales collection...');
    const salesResult = await executeOperation(
      'sales',
      'find',
      {
        'products.warrentyCode': warrantyCode
      }
    );

    console.log('💼 Sales search result:', salesResult);

    if (!salesResult || !Array.isArray(salesResult) || salesResult.length === 0) {
      console.log('❌ No warranty found in either collection');
      return { success: false, error: 'No warranty found with this code' };
    }

    const sale = salesResult[0];
    const product = sale.products.find((p: any) => p.warrentyCode === warrantyCode);

    if (!product) {
      console.log('❌ Product not found in sale:', sale);
      return { success: false, error: 'No warranty found with this code' };
    }

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
      saleDate: sale.date
    };

    return { success: true, data: warrantyData };
  } catch (error: any) {
    console.error('❌ Error searching warranty:', error);
    return { success: false, error: error.message };
  }
} 