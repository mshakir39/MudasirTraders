'use server';
import { executeOperation } from '../app/libs/executeOperation';
import { IDealerBill, IBillPayment } from '../../interfaces';
const { ObjectId } = require('mongodb');

interface CreateDealerBillData {
  dealerId?: string;
  dealerName: string;
  invoiceNo?: string;
  billDate: Date;
  totalAmount: number;
  billImageUrl: string;
  notes?: string;
  parentBillId?: string;
  replacementReason?: string;
}

interface AddPaymentData {
  billId: string;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: string;
  transactionImageUrl: string;
  notes?: string;
  receivedBy?: string; // person who received cash payment
}

export async function createDealerBill(data: CreateDealerBillData) {
  try {
    let remainingAmount = data.totalAmount;
    let isReplacement = false;

    // Check if there are any existing bills for this dealer
    const existingBillsResult = await executeOperation('dealerBills', 'find', {
      dealerId: data.dealerId,
    });
    const existingBills = Array.isArray(existingBillsResult)
      ? existingBillsResult
      : [];
    console.log('Found existing bills for dealer:', existingBills.length);
    console.log(
      'Existing bills:',
      existingBills.map((b) => ({
        id: b._id?.toString(),
        isCurrent: b.isCurrent,
      }))
    );

    // If there are existing bills, set all of them as non-current
    if (existingBills.length > 0) {
      console.log('Processing existing bills:', existingBills);
      for (const bill of existingBills) {
        const billId = bill._id?.toString() || bill.id?.toString();
        if (billId) {
          console.log(`Updating bill ${billId} to non-current`);
          console.log('Bill object:', bill);
          const updateResult = await executeOperation(
            'dealerBills',
            'updateOne',
            {
              documentId: billId,
              isCurrent: false,
              updatedAt: new Date(),
            }
          );
          console.log(`Update result:`, updateResult);
        } else {
          console.log('Bill without valid ID found:', bill);
        }
      }
    }

    // If this is a replacement bill, get the parent bill's remaining amount
    if (data.parentBillId) {
      const parentBill = await executeOperation('dealerBills', 'findOne', {
        _id: new ObjectId(data.parentBillId),
      });
      if (
        parentBill &&
        typeof parentBill === 'object' &&
        'remainingAmount' in parentBill
      ) {
        remainingAmount = (parentBill as IDealerBill).remainingAmount || 0;
      }
      isReplacement = true;
    } else {
      // For new bills (not replacements), remaining amount should equal total amount
      remainingAmount = data.totalAmount;
    }

    const billData = {
      dealerId: data.dealerId,
      dealerName: data.dealerName,
      invoiceNo: data.invoiceNo || '',
      billDate: data.billDate,
      totalAmount: data.totalAmount,
      netAmount: data.totalAmount,
      remainingAmount: remainingAmount,
      billImageUrl: data.billImageUrl,
      status: 'unpaid' as const,
      isCurrent: true, // New bills are current by default
      payments: [],
      notes: data.notes || '',
      parentBillId: data.parentBillId || null,
      replacementReason: data.replacementReason || null,
      isReplacement: isReplacement,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await executeOperation('dealerBills', 'insertOne', billData);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('createDealerBill error:', error);
    return { success: false, error: error.message };
  }
}

export async function getDealerBills() {
  try {
    const bills = await executeOperation('dealerBills', 'findAll');
    return { success: true, data: bills };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDealerBillById(id: string) {
  try {
    const bill = await executeOperation('dealerBills', 'findOne', { id });
    return { success: true, data: bill };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addPaymentToBill(data: AddPaymentData) {
  try {
    // First get the current bill - query by _id as ObjectId
    const { ObjectId } = require('mongodb');
    const billResult = await executeOperation('dealerBills', 'findOne', {
      _id: new ObjectId(data.billId),
    });

    if (!billResult || typeof billResult !== 'object') {
      return { success: false, error: 'Bill not found' };
    }

    const bill = billResult as IDealerBill;

    const payment = {
      id: Date.now().toString(), // Simple ID generation
      paymentDate:
        typeof data.paymentDate === 'string'
          ? new Date(data.paymentDate)
          : data.paymentDate,
      paymentAmount: data.paymentAmount,
      paymentMethod: data.paymentMethod,
      transactionImageUrl: data.transactionImageUrl,
      notes: data.notes || '',
      receivedBy: data.receivedBy || '', // person who received cash
      createdAt: new Date(),
    };

    // Add payment to bill's payments array
    const updatedPayments = [...(bill.payments || []), payment];
    const newRemainingAmount =
      bill.totalAmount -
      updatedPayments.reduce((sum, p) => sum + p.paymentAmount, 0);

    // Determine status
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (newRemainingAmount === 0) {
      status = 'paid';
    } else if (newRemainingAmount < bill.totalAmount) {
      status = 'partial';
    }

    const result = await executeOperation('dealerBills', 'updateOne', {
      documentId: data.billId,
      payments: updatedPayments,
      remainingAmount: newRemainingAmount,
      status: status,
      updatedAt: new Date(),
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDealerBill(id: string) {
  try {
    const result = await executeOperation('dealerBills', 'delete', {
      documentId: id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
