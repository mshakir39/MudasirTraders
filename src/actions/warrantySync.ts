'use server';

import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

interface WarrantyLookupRecord {
  warrentyCode: string;
  invoiceNo: string;
  customerName: string;
  customerContactNumber: string;
  brandName: string;
  series: string;
  warrentyStartDate: string;
  warrentyDuration: string | number;
  warrentyEndDate?: string;
  createdAt: string;
  source: 'invoice' | 'sale';
}

export async function addWarrantyCodes(
  products: any[],
  invoiceNo: string,
  customerName: string,
  customerContactNumber: string,
  source: 'invoice' | 'sale' = 'invoice',
  createdAt?: string
) {
  try {
    const db = await connectToMongoDB();
    if (!db) return;

    const warrantyLookup = db.collection('warrantyLookup');

    for (const product of products) {
      if (product.warrentyCode) {
        // Split warranty codes if multiple
        const codes = product.warrentyCode
          .split(/[\s,]+/)
          .filter((code: string) => code.length > 0);

        for (const code of codes) {
          await warrantyLookup.insertOne({
            warrentyCode: code.toUpperCase(),
            invoiceNo,
            customerName,
            customerContactNumber,
            brandName: product.brandName,
            series: product.series,
            warrentyStartDate: product.warrentyStartDate,
            warrentyDuration: product.warrentyDuration,
            warrentyEndDate: product.warrentyEndDate,
            createdAt: createdAt || new Date().toISOString(),
            source,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error adding warranty codes to lookup:', error);
  }
}

export async function removeWarrantyCodes(invoiceNo: string) {
  try {
    const db = await connectToMongoDB();
    if (!db) return;

    const warrantyLookup = db.collection('warrantyLookup');
    const result = await warrantyLookup.deleteMany({ invoiceNo });
    console.log(`🗑️ Removed ${result.deletedCount} warranty codes for invoice ${invoiceNo}`);
  } catch (error) {
    console.error('Error removing warranty codes from lookup:', error);
  }
}

export async function updateWarrantyCodes(
  products: any[],
  invoiceNo: string,
  customerName: string,
  customerContactNumber: string,
  source: 'invoice' | 'sale' = 'invoice',
  createdAt?: string
) {
  try {
    // Remove old codes first
    await removeWarrantyCodes(invoiceNo);
    
    // Add new codes
    await addWarrantyCodes(products, invoiceNo, customerName, customerContactNumber, source, createdAt);
  } catch (error) {
    console.error('Error updating warranty codes in lookup:', error);
  }
}
