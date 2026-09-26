'use server';

import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';
import { normalizeSeriesForMatching } from '@/utils/seriesNormalization';

export interface ClaimRecord {
  _id?: string;
  claimNumber: string;
  claimDate: string; // ISO string
  customerName: string;
  customerPhone: string;
  originalInvoiceNumber?: string;
  
  // Defective Unit details
  faultyBrand: string;
  faultySeries: string;
  faultySerial: string;
  issueDescription: string;

  // Replacement Unit details
  replacementBrand: string;
  replacementSeries: string;
  replacementSerial: string;

  // Lifecycle
  supplierStatus: 'PENDING_DISPATCH' | 'SENT_TO_COMPANY' | 'RECEIVED_FROM_COMPANY' | 'REJECTED';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  receivedAt?: Date;
}

// 1. Create a claim, reduce replacement battery stock by 1
export async function createBatteryClaim(claimData: {
  customerName: string;
  customerPhone: string;
  originalInvoiceNumber?: string;
  faultyBrand: string;
  faultySeries: string;
  faultySerial: string;
  issueDescription: string;
  replacementBrand: string;
  replacementSeries: string;
  replacementSerial: string;
  notes?: string;
}) {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const stockCollection = db.collection('stock');
    const claimsCollection = db.collection('claims');
    const historyCollection = db.collection('stockHistory');

    // 1. Check & Deduct replacement battery stock
    const brandDoc = await stockCollection.findOne({ brandName: claimData.replacementBrand });
    if (!brandDoc || !brandDoc.seriesStock) {
      throw new Error(`Brand '${claimData.replacementBrand}' not found in stock`);
    }

    const seriesItemIndex = brandDoc.seriesStock.findIndex(
      (item: any) =>
        item.series === claimData.replacementSeries ||
        normalizeSeriesForMatching(item.series) === normalizeSeriesForMatching(claimData.replacementSeries)
    );

    if (seriesItemIndex === -1) {
      throw new Error(`Series '${claimData.replacementSeries}' not found in stock`);
    }

    const targetSeries = brandDoc.seriesStock[seriesItemIndex];
    const currentStock = parseInt(targetSeries.inStock) || 0;

    if (currentStock < 1) {
      throw new Error(`Insufficient stock for '${claimData.replacementSeries}'. Current stock is 0.`);
    }

    const newStock = currentStock - 1;

    // Deduct stock in DB
    await stockCollection.updateOne(
      { _id: brandDoc._id, [`seriesStock.${seriesItemIndex}.series`]: targetSeries.series },
      {
        $set: {
          [`seriesStock.${seriesItemIndex}.inStock`]: newStock,
          [`seriesStock.${seriesItemIndex}.updatedDate`]: new Date(),
        },
      }
    );

    // Generate unique Claim Number
    const count = await claimsCollection.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const claimNumber = `CLM-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Record Claim
    const newClaim: any = {
      claimNumber,
      claimDate: new Date().toISOString(),
      customerName: claimData.customerName.trim(),
      customerPhone: claimData.customerPhone.trim(),
      originalInvoiceNumber: claimData.originalInvoiceNumber?.trim() || '',
      faultyBrand: claimData.faultyBrand.trim(),
      faultySeries: claimData.faultySeries.trim(),
      faultySerial: claimData.faultySerial.trim().toUpperCase(),
      issueDescription: claimData.issueDescription.trim(),
      replacementBrand: claimData.replacementBrand.trim(),
      replacementSeries: claimData.replacementSeries.trim(),
      replacementSerial: claimData.replacementSerial.trim().toUpperCase(),
      supplierStatus: 'PENDING_DISPATCH',
      notes: claimData.notes?.trim() || '',
      createdAt: new Date(),
    };

    const insertResult = await claimsCollection.insertOne(newClaim);

    // Record Stock History entry
    await historyCollection.insertOne({
      brandName: claimData.replacementBrand,
      series: targetSeries.series,
      oldQuantity: currentStock,
      newQuantity: newStock,
      quantityDifference: -1,
      oldCost: targetSeries.productCost || 0,
      newCost: targetSeries.productCost || 0,
      costDifference: 0,
      action: 'warranty_claim_given',
      claimNumber,
      historyDate: new Date(),
    });

    return {
      success: true,
      claimId: insertResult.insertedId.toString(),
      claimNumber,
      message: 'Claim created and stock deducted successfully',
    };
  } catch (error: any) {
    console.error('Error creating battery claim:', error);
    return { success: false, error: error.message };
  }
}

// 2. Fetch Claims with optional filtering
export async function getBatteryClaims(filter?: { status?: string; search?: string }) {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const claimsCollection = db.collection('claims');
    const query: any = {};

    if (filter?.status && filter.status !== 'ALL') {
      query.supplierStatus = filter.status;
    }

    if (filter?.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { claimNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
        { faultySerial: regex },
        { replacementSerial: regex },
        { originalInvoiceNumber: regex },
      ];
    }

    const claims = await claimsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = claims.map((c) => ({
      ...c,
      _id: c._id.toString(),
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error('Error fetching battery claims:', error);
    return { success: false, error: error.message };
  }
}

// 3. Update claim status (e.g. Sent to company, or Mark received from company with +1 stock)
export async function updateClaimStatus(
  claimId: string,
  newStatus: 'SENT_TO_COMPANY' | 'RECEIVED_FROM_COMPANY' | 'REJECTED' | 'PENDING_DISPATCH',
  notes?: string
) {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const claimsCollection = db.collection('claims');
    const stockCollection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    const claim = await claimsCollection.findOne({ _id: new ObjectId(claimId) });
    if (!claim) {
      throw new Error('Claim record not found');
    }

    const updates: any = {
      supplierStatus: newStatus,
      updatedAt: new Date(),
    };

    if (notes !== undefined) {
      updates.notes = notes;
    }

    // If marking as RECEIVED_FROM_COMPANY and it wasn't already received, add +1 back to stock!
    if (newStatus === 'RECEIVED_FROM_COMPANY' && claim.supplierStatus !== 'RECEIVED_FROM_COMPANY') {
      updates.receivedAt = new Date();

      const brandDoc = await stockCollection.findOne({ brandName: claim.faultyBrand });
      if (brandDoc && brandDoc.seriesStock) {
        const seriesItemIndex = brandDoc.seriesStock.findIndex(
          (item: any) =>
            item.series === claim.faultySeries ||
            normalizeSeriesForMatching(item.series) === normalizeSeriesForMatching(claim.faultySeries)
        );

        if (seriesItemIndex !== -1) {
          const targetSeries = brandDoc.seriesStock[seriesItemIndex];
          const currentStock = parseInt(targetSeries.inStock) || 0;
          const newStock = currentStock + 1;

          await stockCollection.updateOne(
            { _id: brandDoc._id, [`seriesStock.${seriesItemIndex}.series`]: targetSeries.series },
            {
              $set: {
                [`seriesStock.${seriesItemIndex}.inStock`]: newStock,
                [`seriesStock.${seriesItemIndex}.updatedDate`]: new Date(),
              },
            }
          );

          await historyCollection.insertOne({
            brandName: claim.faultyBrand,
            series: targetSeries.series,
            oldQuantity: currentStock,
            newQuantity: newStock,
            quantityDifference: 1,
            oldCost: targetSeries.productCost || 0,
            newCost: targetSeries.productCost || 0,
            costDifference: 0,
            action: 'warranty_claim_received_replenish',
            claimNumber: claim.claimNumber,
            historyDate: new Date(),
          });
        }
      }
    }

    await claimsCollection.updateOne(
      { _id: new ObjectId(claimId) },
      { $set: updates }
    );

    return { success: true, message: `Claim status updated to ${newStatus}` };
  } catch (error: any) {
    console.error('Error updating claim status:', error);
    return { success: false, error: error.message };
  }
}

// 4. Delete a claim with option to restore replacement battery stock
export async function deleteBatteryClaim(claimId: string, restoreStock: boolean = true) {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const claimsCollection = db.collection('claims');
    const stockCollection = db.collection('stock');
    const historyCollection = db.collection('stockHistory');

    const claim = await claimsCollection.findOne({ _id: new ObjectId(claimId) });
    if (!claim) {
      throw new Error('Claim record not found');
    }

    // If restoreStock is requested and claim hasn't already replenished via RECEIVED_FROM_COMPANY
    if (restoreStock && claim.supplierStatus !== 'RECEIVED_FROM_COMPANY') {
      const brandDoc = await stockCollection.findOne({ brandName: claim.replacementBrand });
      if (brandDoc && brandDoc.seriesStock) {
        const seriesItemIndex = brandDoc.seriesStock.findIndex(
          (item: any) =>
            item.series === claim.replacementSeries ||
            normalizeSeriesForMatching(item.series) === normalizeSeriesForMatching(claim.replacementSeries)
        );

        if (seriesItemIndex !== -1) {
          const targetSeries = brandDoc.seriesStock[seriesItemIndex];
          const currentStock = parseInt(targetSeries.inStock) || 0;
          const newStock = currentStock + 1;

          await stockCollection.updateOne(
            { _id: brandDoc._id, [`seriesStock.${seriesItemIndex}.series`]: targetSeries.series },
            {
              $set: {
                [`seriesStock.${seriesItemIndex}.inStock`]: newStock,
                [`seriesStock.${seriesItemIndex}.updatedDate`]: new Date(),
              },
            }
          );

          await historyCollection.insertOne({
            brandName: claim.replacementBrand,
            series: targetSeries.series,
            oldQuantity: currentStock,
            newQuantity: newStock,
            quantityDifference: 1,
            oldCost: targetSeries.productCost || 0,
            newCost: targetSeries.productCost || 0,
            costDifference: 0,
            action: 'warranty_claim_deleted_restore_stock',
            claimNumber: claim.claimNumber,
            historyDate: new Date(),
          });
        }
      }
    }

    await claimsCollection.deleteOne({ _id: new ObjectId(claimId) });

    return {
      success: true,
      message: `Claim ${claim.claimNumber} deleted successfully${restoreStock ? ' and stock restored (+1)' : ''}.`,
    };
  } catch (error: any) {
    console.error('Error deleting battery claim:', error);
    return { success: false, error: error.message };
  }
}
