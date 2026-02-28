'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { IDealer } from '../../interfaces';
import { IDealerBill } from '../../interfaces';

// Helper function to delete image from Cloudinary
async function deleteCloudinaryImage(imageUrl: string) {
  try {
    if (!imageUrl) return;

    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');

    // Find the index of 'upload' in the URL
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
      console.error('Invalid Cloudinary URL format');
      return;
    }

    // Extract everything after the version number (skip upload + version)
    const pathParts = urlParts.slice(uploadIndex + 2);
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension

    // Get Cloudinary credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log('Cloudinary credentials not found, cannot delete image');
      return;
    }

    // Generate signature for deletion
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = require('crypto')
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex');

    // Delete from Cloudinary
    const deleteFormData = new FormData();
    deleteFormData.append('public_id', publicId);
    deleteFormData.append('api_key', apiKey);
    deleteFormData.append('timestamp', timestamp);
    deleteFormData.append('signature', signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: deleteFormData,
      }
    );

    const cloudinaryResult = await cloudinaryResponse.json();
    if (cloudinaryResult.result === 'ok') {
      console.log('Deleted from Cloudinary:', publicId);
    } else {
      console.error('Failed to delete from Cloudinary:', cloudinaryResult);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
}

interface CreateDealerData {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: string;
  notes?: string;
}

interface UpdateDealerData extends Partial<CreateDealerData> {
  isActive?: boolean;
}

export async function createDealer(data: CreateDealerData) {
  try {
    const dealerData = {
      ...data,
      isActive: true,
      totalBills: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await executeOperation('dealers', 'insertOne', dealerData);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDealers() {
  try {
    const dealers = await executeOperation('dealers', 'findAll');
    return { success: true, data: dealers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDealerById(id: string) {
  try {
    const dealer = await executeOperation('dealers', 'findOne', { id });
    return { success: true, data: dealer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDealer(id: string, data: UpdateDealerData) {
  try {
    const result = await executeOperation('dealers', 'updateOne', {
      documentId: id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDealer(id: string) {
  try {
    // Find all bills for this dealer
    const bills = await executeOperation('dealerBills', 'find', {
      dealerId: id,
    });
    if (bills && Array.isArray(bills) && bills.length > 0) {
      // Delete images and bills
      for (const bill of bills as IDealerBill[]) {
        // Delete bill image
        if (bill.billImageUrl) {
          await deleteCloudinaryImage(bill.billImageUrl);
        }

        // Delete payment images
        if (bill.payments && Array.isArray(bill.payments)) {
          for (const payment of bill.payments) {
            if (payment.transactionImageUrl) {
              await deleteCloudinaryImage(payment.transactionImageUrl);
            }
          }
        }

        // Delete the bill document
        await executeOperation('dealerBills', 'delete', {
          documentId: bill.id,
        });
      }
    }

    // Delete the dealer
    const result = await executeOperation('dealers', 'delete', {
      documentId: id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleDealerStatus(id: string, isActive: boolean) {
  try {
    const result = await executeOperation('dealers', 'updateOne', {
      documentId: id,
      isActive,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
