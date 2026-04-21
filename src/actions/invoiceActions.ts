'use server';
import { calculateInvoiceAmounts } from '@/utils/invoiceCalculations';
import { executeOperation } from '@/app/libs/executeOperation';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { InvoiceDataUtil } from '@/utils/invoiceDataUtil';
import { InvoiceProduct } from '@/entities/invoice/model/types';

interface InvoiceItem {
  brandName: string;
  series: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productPrice?: number;
  warrentyCode?: string;
  warrentyStartDate?: string;
  warrentyDuration?: string;
  warrentyEndDate?: string;
  isChargingService?: boolean;
  isScrapBattery?: boolean;
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'partial';
  invoiceDate: Date;
  dueDate?: Date;
  notes?: string;
}

const INVOICE_PATHS = [
  '/dashboard/invoices',
  '/invoice',
  '/dashboard/customers',
  '/api/invoice',
  '/api/invoice/[id]',
  '/api/customers/[customerId]/invoices',
];

function revalidateInvoicePaths() {
  INVOICE_PATHS.forEach((path) => {
    // Add type parameter for dynamic paths
    if (path.includes('[') && path.includes(']')) {
      revalidatePath(path, 'page');
    } else {
      revalidatePath(path);
    }
  });

  // Also revalidate stock paths since stock changes during invoice operations
  const STOCK_PATHS = [
    '/stock',
    '/dashboard/stock',
    '/api/stock',
    '/api/stock/[brand]',
  ];

  STOCK_PATHS.forEach((path) => {
    // Add type parameter for dynamic paths
    if (path.includes('[') && path.includes(']')) {
      revalidatePath(path, 'page');
    } else {
      revalidatePath(path);
    }
  });
  console.log('✅ Stock paths revalidated');
}

export async function createInvoice(data: InvoiceData) {
  try {
    const result = await executeOperation('invoices', 'insertOne', {
      ...data,
      createdAt: new Date(),
    });
    revalidateInvoicePaths();
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoice(id: string, data: Partial<InvoiceData>) {
  try {
    const result = await executeOperation('invoices', 'updateOne', {
      documentId: id,
      ...data,
      updatedAt: new Date(),
    });
    revalidateInvoicePaths();
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const result = await executeOperation('invoices', 'delete', {
      documentId: id,
    });
    revalidateInvoicePaths();
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ✅ Now uses server-side pagination — MongoDB does sort/skip/limit
export async function getInvoicesPaginated(page = 1, limit = 50) {
  try {
    const result = (await executeOperation('invoices', 'findPaginated', {
      filter: {},
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit,
    })) as { docs: any[]; total: number };

    const data = result.docs.map((invoice: any) => ({
      ...invoice,
      batteriesRate: invoice.batteriesRate || 0,
      batteriesCountAndWeight: invoice.batteriesCountAndWeight || '',
    }));

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page * limit < result.total,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ✅ Also updated — uses findPaginated with no limit for full list
export async function getInvoices() {
  try {
    const result = (await executeOperation('invoices', 'findPaginated', {
      filter: {},
      sort: { createdDate: -1 },
      skip: 0,
    })) as { docs: any[]; total: number };

    const data = result.docs.map((invoice: any) => ({
      ...invoice,
      batteriesRate: invoice.batteriesRate || 0,
      batteriesCountAndWeight: invoice.batteriesCountAndWeight || '',
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoices = await executeOperation('invoices', 'find', { _id: id });
    let invoice = Array.isArray(invoices) ? invoices[0] : invoices;

    // Fallback to invoiceNo
    if (!invoice) {
      const byNo = await executeOperation('invoices', 'find', {
        invoiceNo: id,
      });
      invoice = Array.isArray(byNo) ? byNo[0] : byNo;
    }

    return { success: true, data: invoice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByCustomer(customerName: string) {
  try {
    const invoices = await executeOperation('invoices', 'find', {
      customerName,
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByDateRange(startDate: Date, endDate: Date) {
  try {
    const invoices = await executeOperation('invoices', 'find', {
      invoiceDate: { $gte: startDate, $lte: endDate },
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoicePaymentStatus(
  id: string,
  paymentStatus: 'pending' | 'paid' | 'partial'
) {
  try {
    const result = await executeOperation('invoices', 'updateOne', {
      documentId: id,
      paymentStatus,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// NEW: Get customer pending and partial invoices for consolidation
export async function getCustomerPendingInvoices(customerId: string) {
  try {
    // Import ObjectId for MongoDB queries
    const { ObjectId } = require('mongodb');

    // Check if customerId is a valid ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(customerId);

    let customerName = null;

    if (isValidObjectId) {
      // First try to find customer by ID to get customerName
      const customer = await executeOperation('customers', 'findOne', {
        _id: new ObjectId(customerId),
      });
      customerName =
        customer && typeof customer === 'object' && 'customerName' in customer
          ? (customer as any).customerName
          : null;
    } else {
      // Not a valid ObjectId, treat it as customerName directly (walk-in customer)
      customerName = customerId;
    }

    // Query invoices - check by clientId first, then fall back to customerName
    let invoices;
    if (isValidObjectId) {
      // First try to find by clientId
      invoices = await executeOperation('invoices', 'find', {
        clientId: customerId,
        paymentStatus: { $in: ['pending', 'partial'] }, // Include both pending and partial invoices
        status: { $ne: 'voided' },
      });

      // If no results and we have customerName, fall back to customerName
      if (
        (!invoices || !Array.isArray(invoices) || invoices.length === 0) &&
        customerName
      ) {
        invoices = await executeOperation('invoices', 'find', {
          customerName: customerName,
          paymentStatus: { $in: ['pending', 'partial'] },
          status: { $ne: 'voided' },
        });
      }
    } else {
      // Walk-in customer: search by customerName only
      invoices = await executeOperation('invoices', 'find', {
        customerName: customerName,
        paymentStatus: { $in: ['pending', 'partial'] },
        status: { $ne: 'voided' },
      });
    }

    // Process invoices to calculate correct totals and remaining amounts
    const processedInvoices = Array.isArray(invoices)
      ? invoices
          .map((invoice: any) => {
            // Use InvoiceDataUtil to calculate totals
            const calculation = InvoiceDataUtil.calculateAmounts(
              invoice.products || [],
              invoice.receivedAmount
            );

            const calculatedTotal = calculation.totalAmount;
            const calculatedRemaining = calculation.remainingAmount;

            // Only include if remaining amount is not zero (exclude fully paid invoices)
            if (calculatedRemaining > 0) {
              return {
                ...invoice,
                calculatedTotal,
                calculatedRemaining,
              };
            }
            return null;
          })
          .filter((invoice): invoice is any => invoice !== null)
      : [];

    // Filter out partial invoices with 0 total amount (ignore them) using utility
    const filteredInvoices = processedInvoices.filter((invoice: any) =>
      InvoiceDataUtil.shouldIncludeInPending(invoice)
    );

    // Sort by date (most recent first)
    const sortedInvoices = filteredInvoices.sort(
      (a, b) =>
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );

    return { success: true, data: sortedInvoices };
  } catch (error: any) {
    console.error('❌ Error in getCustomerPendingInvoices:', error);
    return { success: false, error: error.message };
  }
}

// NEW: Create consolidated invoice (void old + create new)
export async function createConsolidatedInvoice(
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  newProducts: InvoiceItem[],
  pendingInvoiceIds: string[],
  previousAmounts: number[],
  notes?: string,
  receivedAmount: number = 0, // Support payment during consolidation
  paymentMethod: string[] = ['Cash'], // Support payment method selection
  batteriesCountAndWeight?: string, // Add battery count and weight
  batteriesRate?: number, // Add battery rate
  customerType?: string, // Add customer type
  customerId?: string | null, // Add customer ID
  vehicleNo?: string // Add vehicle number
) {
  try {
    console.log('🔍 Debug - createConsolidatedInvoice called with:', {
      pendingInvoiceIds,
      previousAmounts,
      newProductsCount: newProducts.length,
      receivedAmount,
      batteriesRate,
    });

    // 1. Get pending invoices to be voided
    // Convert string IDs to ObjectId for MongoDB query
    const objectIds = pendingInvoiceIds.map((id) => new ObjectId(id));

    console.log('🔍 Debug - Converted IDs:', {
      originalIds: pendingInvoiceIds,
      objectIds: objectIds.map((id) => id.toString()),
    });

    const pendingInvoices = await executeOperation('invoices', 'find', {
      _id: { $in: objectIds },
    });

    console.log('🔍 Debug - Database query result:', {
      query: { _id: { $in: pendingInvoiceIds } },
      foundInvoices: pendingInvoices,
      isArray: Array.isArray(pendingInvoices),
      length: Array.isArray(pendingInvoices) ? pendingInvoices.length : 'N/A',
    });

    if (!Array.isArray(pendingInvoices) || pendingInvoices.length === 0) {
      return { success: false, error: 'No pending invoices found' };
    }

    // 2. Only use NEW products for the consolidated invoice (old invoice products are voided)
    const existingProducts = pendingInvoices.flatMap(
      (invoice: any) => invoice.products || []
    );

    // Store both invoice IDs and invoice numbers for better display
    const consolidatedInvoiceIds = pendingInvoices.map((inv) => inv.id);
    const consolidatedInvoiceNumbers = pendingInvoices.map(
      (inv) => inv.invoiceNo
    );

    // 3. Calculate totals using utility function
    const calculationResult = calculateInvoiceAmounts({
      pendingInvoices: pendingInvoices.map((inv) => ({
        remainingAmount: inv.remainingAmount || 0,
        totalAmount: inv.totalAmount || 0,
        receivedAmount: inv.receivedAmount || 0,
      })),
      newProducts: newProducts,
      batteriesRate: batteriesRate,
      receivedAmount: receivedAmount,
    });

    const totalAmount = calculationResult.totalAmount;

    console.log('🔍 Debug - Amount calculations using utility:', {
      calculationResult,
      pendingInvoices: pendingInvoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        totalAmount: inv.totalAmount,
        receivedAmount: inv.receivedAmount,
        remainingAmount: inv.remainingAmount,
      })),
      originalBatteriesCountAndWeight:
        pendingInvoices[0].batteriesCountAndWeight,
    });

    // 4. Generate new invoice number
    const newInvoiceNumber = await generateInvoiceNumber();
    console.log('🔍 Debug - Generated invoice number:', newInvoiceNumber);

    // 5. Create consolidated invoice - JUST LIKE NEW INVOICE with tracking
    const originalInvoice = pendingInvoices[0]; // Use first invoice for customer info only

    // Add cost calculation for new products (same logic as normal invoice)
    const productsWithCost = await Promise.all(
      newProducts.map(async (product: InvoiceItem) => {
        // Get current cost from stock for profit calculation
        let currentCost = 0;
        try {
          const stockItem = (await executeOperation('stock', 'findOne', {
            brandName: product.brandName,
          })) as any;

          if (stockItem && stockItem.seriesStock) {
            const seriesData = stockItem.seriesStock.find(
              (s: any) => s.series === product.series
            );
            currentCost = Number(seriesData?.productCost) || 0;
          }
        } catch (error) {
          console.warn(
            `Could not fetch cost for ${product.brandName} ${product.series}:`,
            error
          );
          currentCost = Number(product.productPrice) || 0; // Fallback to product price
        }

        const productProfit =
          Number(product.totalPrice) - currentCost * Number(product.quantity);

        return {
          brandName: product.brandName,
          series: product.series,
          productPrice: product.productPrice,
          costPrice: currentCost, // ← NEW: Cost at time of sale
          profit: productProfit, // ← NEW: Profit per product
          quantity: product.quantity,
          isChargingService: !!(product as any).isChargingService,
          isScrapBattery: !!(product as any).isScrapBattery,
          warrentyCode: product.warrentyCode ? product.warrentyCode.trim() : '',
          warrentyStartDate: product.warrentyStartDate || '',
          warrentyEndDate: product.warrentyEndDate || '',
          warrentyDuration: product.warrentyDuration || '',
          totalPrice: product.totalPrice,
          batteryDetails: (product as any).batteryDetails,
        };
      })
    );

    // Calculate total cost and profit for the invoice
    const totalCost = productsWithCost.reduce((sum: number, product: any) => {
      return sum + product.costPrice * Number(product.quantity);
    }, 0);

    const totalProfit = productsWithCost.reduce((sum: number, product: any) => {
      return sum + product.profit;
    }, 0);

    console.log('🔍 Debug - Cost calculation for consolidated invoice:', {
      totalCost,
      totalProfit,
      productCount: productsWithCost.length,
    });

    const newInvoice = {
      invoiceNo: newInvoiceNumber,
      // Customer info from original
      customerName: originalInvoice.customerName,
      customerAddress: originalInvoice.customerAddress,
      customerContactNumber: originalInvoice.customerContactNumber,

      // Use current form data (fresh invoice data) - don't combine with old data
      customerType: customerType || 'WalkIn Customer',
      customerId: customerId || null,
      vehicleNo: vehicleNo || '',

      // Use current payment method from form
      paymentMethod:
        paymentMethod && paymentMethod.length > 0 ? paymentMethod : ['Cash'],

      // Use current battery data from form - don't combine with old
      batteriesCountAndWeight: batteriesCountAndWeight || '',
      batteriesRate: batteriesRate || 0,

      // Use current received amount from form - don't add old amounts
      receivedAmount: receivedAmount || 0,

      // Fresh invoice status
      isPayLater: false,

      // New products with cost fields
      products: productsWithCost,

      // Calculate total: remaining amounts + new products
      subtotal: totalAmount,
      taxAmount: 0,
      totalAmount: totalAmount,

      // NEW: Add cost fields to consolidated invoice
      totalCost: totalCost, // ← NEW: Total cost for this invoice
      totalProfit: totalProfit, // ← NEW: Total profit for this invoice

      // Calculate remaining amount and payment status using utility result
      remainingAmount: calculationResult.remainingAmount,
      paymentStatus: calculationResult.paymentStatus,

      // Standard invoice fields
      createdDate: new Date(),
      addedDate: new Date(),
      status: 'active',
      createdAt: new Date(),

      // Just track what was consolidated
      consolidatedFrom: consolidatedInvoiceIds,
      consolidatedInvoiceNumbers: consolidatedInvoiceNumbers,
      previousAmounts: previousAmounts,
      notes: `Consolidated from invoices: ${consolidatedInvoiceNumbers.join(', ')}${notes ? '. ' + notes : ''}`,
    };

    console.log('🔍 Debug - New invoice object before insert:', {
      invoiceNo: newInvoice.invoiceNo,
      customerName: newInvoice.customerName,
      remainingAmount: newInvoice.remainingAmount,
      consolidatedFrom: newInvoice.consolidatedFrom,
      previousAmounts: newInvoice.previousAmounts,
      notes: newInvoice.notes,
    });

    // 6. Insert new invoice
    const insertResult = await executeOperation(
      'invoices',
      'insertOne',
      newInvoice
    );

    if (
      !insertResult ||
      typeof insertResult !== 'object' ||
      !('insertedId' in insertResult)
    ) {
      return { success: false, error: 'Failed to create new invoice' };
    }

    const newInvoiceId = (insertResult as any).insertedId;
    const newInvoiceIdString = newInvoiceId.toString(); // Convert ObjectId to string

    console.log('🔍 Debug - New invoice with ID:', {
      newInvoiceIdString,
      consolidatedFrom: newInvoice.consolidatedFrom,
      previousAmounts: newInvoice.previousAmounts,
    });

    // 7. Void all pending invoices and revert their stock (only if not already reverted)
    for (const invoiceId of pendingInvoiceIds) {
      // First, get the invoice details to revert stock
      const invoiceToVoid = (await executeOperation('invoices', 'findOne', {
        _id: invoiceId,
      })) as any;

      if (invoiceToVoid && invoiceToVoid.products) {
        console.log(
          `🔄 Reverting stock for voided invoice ${invoiceToVoid.invoiceNo}...`
        );

        // Check if this invoice was already consolidated (has replacedBy link)
        if (invoiceToVoid.replacedBy) {
          console.log(
            `⚠️  Invoice ${invoiceToVoid.invoiceNo} was already consolidated into ${invoiceToVoid.replacedBy}`
          );
          console.log(
            `⏭️ Skipping stock reversal - already reverted in previous consolidation`
          );
        } else {
          console.log(
            `✅ Invoice ${invoiceToVoid.invoiceNo} is original - reverting stock`
          );

          // Revert stock for each product in the voided invoice
          for (const product of invoiceToVoid.products) {
            if (product.isChargingService) {
              console.log(
                `⏭️ Skipping stock revert for charging service: ${product.brandName} ${product.series}`
              );
              continue;
            }

            const quantityAsNumber = parseInt(String(product.quantity)) || 0;
            console.log(
              `🔄 Adding back stock: ${product.brandName} - ${product.series} (+${quantityAsNumber})`
            );

            // Add stock back and decrement sold count
            const stockRevertResult = await executeOperation(
              'stock',
              'addStockAndDecrementSoldCount',
              {
                brandName: product.brandName,
                series: product.series,
                quantity: quantityAsNumber,
              }
            );

            if (!stockRevertResult) {
              console.error(
                `❌ Failed to revert stock for ${product.brandName} - ${product.series}`
              );
            } else {
              console.log(
                `✅ Stock reverted for ${product.brandName} - ${product.series}`
              );
            }
          }
        }
      }

      // Now void the invoice
      await executeOperation('invoices', 'updateOne', {
        documentId: invoiceId,
        status: 'voided',
        voidedAt: new Date(),
        voidReason: 'Consolidated into new invoice',
        replacedBy: newInvoiceIdString, // Link to the new consolidated invoice
      });

      console.log(`✅ Voided invoice ${invoiceId}`);
    }

    // 8. Update stock for new products only (existing products already deducted)
    console.log('🔍 Debug - About to update stock for new products:', {
      newProductsCount: newProducts.length,
      newProducts: newProducts.map((p) => ({
        brandName: p.brandName,
        series: p.series,
        quantity: p.quantity,
        totalPrice: p.totalPrice,
      })),
    });
    await updateStockForProducts(newProducts, 'deduct');

    // 9. Create sales record for consolidated invoice
    console.log('💼 Creating sales record for consolidated invoice...');

    // Calculate sales total amount for new products only (same as normal invoice)
    const newProductsAsInvoiceProducts: InvoiceProduct[] = newProducts.map(
      (item) => ({
        brandName: item.brandName,
        series: item.series,
        quantity: item.quantity,
        productPrice: item.productPrice || item.unitPrice,
        totalPrice: item.totalPrice,
        warrentyCode: item.warrentyCode || 'No Warranty',
        warrentyStartDate: item.warrentyStartDate || '',
        warrentyDuration: item.warrentyDuration || '',
        warrentyEndDate: item.warrentyEndDate || '',
        isChargingService: item.isChargingService || false,
        isScrapBattery: item.isScrapBattery || false,
      })
    );

    // Calculate sales total amount for new products only (NOT full consolidated amount)
    const newProductsRevenue = productsWithCost.reduce(
      (sum: number, product: any) => {
        return sum + (Number(product.totalPrice || product.productPrice) || 0);
      },
      0
    );
    const salesTotalAmount = newProductsRevenue; // ← FIXED: Only new products, not full amount

    // Validate sales total amount (same as normal invoice)
    if (isNaN(salesTotalAmount) || salesTotalAmount <= 0) {
      throw new Error(
        `Invalid sales total amount for consolidated invoice: ${salesTotalAmount}`
      );
    }

    const salesRecord = {
      invoiceId: newInvoice.invoiceNo,
      date: newInvoice.createdDate,
      customerName: newInvoice.customerName,
      products: productsWithCost, // Use products with cost fields
      totalAmount: salesTotalAmount, // Full consolidated amount
      paymentMethod: newInvoice.paymentMethod,
      // Add charging service flags for analytics (same as normal invoice)
      isChargingService:
        newProducts?.some((product: any) => product.isChargingService) || false,
      isScrapBattery:
        newProducts?.some((product: any) => product.isScrapBattery) || false,
      // Add cost fields from invoice (same as normal invoice)
      totalCost: newInvoice.totalCost, // ← NEW: Total cost from invoice
      totalProfit: newInvoice.totalProfit, // ← NEW: Total profit from invoice
    };

    // 🔒 VALIDATION: Ensure sales record has required fields (same as normal invoice)
    if (
      !salesRecord.invoiceId ||
      !salesRecord.customerName ||
      !salesRecord.products ||
      salesRecord.products.length === 0
    ) {
      throw new Error('Sales record is missing required fields');
    }

    const salesResult = await executeOperation(
      'sales',
      'insertOne',
      salesRecord
    );

    // 🔒 VALIDATION: Ensure sales record insertion was successful (same as normal invoice)
    if (!salesResult) {
      throw new Error('Failed to insert sales record into database');
    }

    console.log(
      '✅ Sales record created successfully for consolidated invoice:',
      {
        invoiceId: salesRecord.invoiceId,
        totalAmount: salesRecord.totalAmount,
        productsCount: salesRecord.products.length,
      }
    );

    // 10. Revalidate paths
    const finalNewInvoice = { ...newInvoice, id: newInvoiceIdString };

    console.log('🔍 Debug - Final invoice being returned:', {
      invoiceId: finalNewInvoice.id,
      invoiceNo: finalNewInvoice.invoiceNo,
      consolidatedFrom: finalNewInvoice.consolidatedFrom,
      previousAmounts: finalNewInvoice.previousAmounts,
    });

    revalidateInvoicePaths();

    return {
      success: true,
      data: {
        newInvoice: finalNewInvoice, // Use string ID
        voidedInvoices: pendingInvoices.map((invoice) => ({
          ...invoice,
          id: invoice.id, // Already serialized by executeOperation
          replacedBy: newInvoiceIdString, // Ensure this is also a string
        })),
        consolidatedCount: pendingInvoices.length,
      },
    };
  } catch (error: any) {
    console.error('Error creating consolidated invoice:', error);
    return { success: false, error: error.message };
  }
}

// NEW: Get invoice transfer chain (audit trail)
export async function getInvoiceTransferChain(invoiceId: string) {
  try {
    const chain = [];
    let currentId = invoiceId;

    // Build chain forward (follow replacedBy links)
    while (currentId) {
      const invoice = await executeOperation('invoices', 'findOne', {
        _id: currentId,
      });

      if (!invoice || typeof invoice !== 'object') break;

      const invoiceObj = invoice as any;
      chain.push(invoiceObj);

      // Follow replacedBy link
      if (invoiceObj.replacedBy) {
        currentId = invoiceObj.replacedBy;
      } else {
        break;
      }
    }

    // Also check backwards (follow consolidatedFrom links)
    const consolidatedInvoices = await executeOperation('invoices', 'find', {
      consolidatedFrom: invoiceId,
    });

    if (
      Array.isArray(consolidatedInvoices) &&
      consolidatedInvoices.length > 0
    ) {
      chain.unshift(...consolidatedInvoices);
    }

    // Sort by date
    const sortedChain = Array.isArray(chain)
      ? chain.sort(
          (a: any, b: any) =>
            new Date(a.createdDate).getTime() -
            new Date(b.createdDate).getTime()
        )
      : [];

    return { success: true, data: sortedChain };
  } catch (error: any) {
    console.error('Error getting invoice transfer chain:', error);
    return { success: false, error: error.message };
  }
}

// Helper: Generate invoice number (you may already have this)
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Use our existing MongoDB connection utility
    const { connectToMongoDB } = await import('@/app/libs/connectToMongoDB');
    const db = await connectToMongoDB();

    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const lastInvoice = await db
      .collection('invoices')
      .find({})
      .sort({ invoiceNo: -1 })
      .limit(1)
      .toArray();

    console.log('🔍 Debug - Last invoice from database:', lastInvoice);

    let lastNumber = 0;

    if (Array.isArray(lastInvoice) && lastInvoice.length > 0) {
      const lastInvoiceData = lastInvoice[0] as any;
      console.log('🔍 Debug - Last invoice object:', {
        invoiceNo: lastInvoiceData.invoiceNo,
        invoiceNumber: lastInvoiceData.invoiceNumber,
      });

      // Try both field names - invoiceNo or invoiceNumber
      const invoiceNumberField =
        lastInvoiceData.invoiceNo || lastInvoiceData.invoiceNumber;
      console.log('🔍 Debug - Using invoice number field:', invoiceNumberField);

      if (invoiceNumberField) {
        lastNumber =
          parseInt(String(invoiceNumberField).replace(/\D/g, '')) || 0;
      }
    }

    console.log('🔍 Debug - Last number parsed:', lastNumber);

    const newNumber = String(lastNumber + 1).padStart(8, '0');
    console.log('🔍 Debug - New invoice number:', newNumber);

    return newNumber;
  } catch (error) {
    console.error('🔍 Debug - Error in generateInvoiceNumber:', error);
    // Fallback to timestamp-based number
    const fallbackNumber = String(Date.now()).slice(-8);
    console.log('🔍 Debug - Using fallback number:', fallbackNumber);
    return fallbackNumber;
  }
}

// Helper: Update stock for products (you may already have this)
async function updateStockForProducts(
  products: InvoiceItem[],
  operation: 'deduct' | 'add'
) {
  try {
    for (const product of products) {
      console.log('🔍 Debug - Updating stock:', {
        brandName: product.brandName,
        series: product.series,
        quantity: product.quantity,
        operation,
      });

      if (operation === 'deduct') {
        // Convert quantity to number for stock update
        const quantityAsNumber = parseInt(String(product.quantity)) || 0;
        console.log('🔍 Debug - Converting quantity:', {
          originalQuantity: product.quantity,
          convertedQuantity: quantityAsNumber,
        });

        // Use the existing updateStockQuantity operation
        const stockUpdate = await executeOperation(
          'stock',
          'updateStockQuantity',
          {
            brandName: product.brandName,
            series: product.series,
            quantity: quantityAsNumber,
          }
        );
        console.log('✅ Stock deducted successfully:', stockUpdate);
      } else {
        // For adding stock back, we'd need to implement updateStockAdd operation
        // For now, just log that we're skipping add operation
        console.log('⏸️ Stock add operation not implemented for consolidation');
      }
    }
  } catch (error: any) {
    console.error('❌ Error updating stock:', error.message);
    // Don't throw error to avoid breaking consolidation
    // Stock issues can be fixed manually
  }
}
