'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { InvoiceDataUtil } from '@/utils/invoiceDataUtil';
import { generateInvoiceNumber } from '@/actions/invoiceActions';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import log from '@/utils/logger';
import { addWarrantyCodes, removeWarrantyCodes } from '@/actions/warrantySync';

// Escape user-provided text for use inside a RegExp
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Better series matching function that preserves structure
function normalizeSeries(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/\s*\(\s*/g, ' (') // Add space before opening parenthesis
    .replace(/\s*\)\s*/g, ') ') // Add space after closing parenthesis
    .replace(/\s*\/\s*/g, '/') // Fix spaces around slashes
    .replace(/\s+/g, ' ') // Clean up any new multiple spaces
    .trim();
}

// Normalize series by replacing all symbols with spaces, then exact matching
function normalizeSeriesForMatching(input: string) {
  return String(input || '')
    .toLowerCase()
    .replace(/[\/\(\)\-\,\.\+]/g, ' ') // Replace symbols with spaces
    .replace(/([a-z])([0-9])/g, '$1 $2') // Add space between letters and numbers
    .replace(/([0-9])([a-z])/g, '$1 $2') // Add space between numbers and letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space before capitalized words
    .replace(/(thin)(thick)/g, '$1 $2') // Split ThinThick
    .replace(/(thinthick)/g, 'thin thick') // Handle combined form
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

// Track processing invoices to prevent duplicates
const processingInvoices = new Set<string>();

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper function
function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then((data) => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

// Performance tracking
async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;

  console.log(`⏱️ ${operation} took ${duration}ms`);

  if (duration > 1000) {
    console.warn(`⚠️ Slow operation: ${operation} (${duration}ms)`);
  }

  return result;
}

export async function POST(req: NextRequest) {
  const formData = await req.json();
  const requestId = `${formData.customerName}-${formData.customerContactNumber}-${Date.now()}`;

  if (processingInvoices.has(requestId)) {
    return NextResponse.json(
      { error: 'Invoice is already being processed. Please wait.' },
      { status: 409 }
    );
  }

  processingInvoices.add(requestId);

  try {
    // 🔍 SMART INVOICE LOGIC: Check for pending invoices first
    console.log('🔍 Smart Invoice Logic: Checking for pending invoices...');
    console.log(`   Customer: ${formData.customerName}`);
    console.log(`   Phone: ${formData.customerContactNumber}`);

    // Check if customer has pending invoices
    const pendingInvoices = (await executeOperation('invoices', 'find', {
      customerName: formData.customerName,
      customerContactNumber: formData.customerContactNumber,
      paymentStatus: { $in: ['pending', 'partial'] },
      status: 'active',
    })) as any[];

    console.log(`   Found pending invoices: ${pendingInvoices?.length || 0}`);

    if (pendingInvoices && pendingInvoices.length > 0) {
      console.log(
        '🔄 Pending invoices found - Creating consolidated invoice instead'
      );

      // Prepare consolidation data
      const pendingInvoiceIds = pendingInvoices.map((inv: any) => inv.id);
      const previousAmounts = pendingInvoices.map((inv: any) => {
        // Calculate remaining amount dynamically (include additional payments)
        const productTotal = (inv.products || []).reduce(
          (sum: number, product: any) => {
            if (product.isChargingService || product.isScrapBattery) {
              return sum;
            }
            const price =
              product.productPrice || product.totalPrice || product.price || 0;
            const qty = product.quantity || 1;
            return sum + Number(price) * Number(qty);
          },
          0
        );
        const received = Number(inv.receivedAmount) || 0;
        const batteriesRate = Number(inv.batteriesRate) || 0;
        const additionalPayments = (inv.additionalPayment || []).reduce(
          (sum: number, payment: any) => sum + Number(payment.amount || 0),
          0
        );
        return productTotal - received - batteriesRate - additionalPayments;
      });

      const consolidationData = {
        customerName: formData.customerName,
        customerPhone: formData.customerContactNumber,
        customerAddress: formData.customerAddress || '',
        newProducts: formData.productDetail || [],
        pendingInvoiceIds: pendingInvoiceIds,
        previousAmounts: previousAmounts,
        notes: formData.notes || 'Auto-consolidated invoice',
        receivedAmount: formData.receivedAmount || 0,
        paymentMethod: formData.paymentMethod || ['Cash'],
        batteriesCountAndWeight: formData.batteriesCountAndWeight || '',
        batteriesRate: formData.batteriesRate || 0,
        customerType: formData.customerType || 'WalkIn Customer',
        customerId: formData.customerId || null,
        vehicleNo: formData.vehicleNo || '',
      };

      // Forward to consolidation route
      try {
        const { createConsolidatedInvoice } =
          await import('@/actions/invoiceActions');
        const result = await createConsolidatedInvoice(
          consolidationData.customerName,
          consolidationData.customerPhone,
          consolidationData.customerAddress,
          consolidationData.newProducts,
          consolidationData.pendingInvoiceIds,
          consolidationData.previousAmounts,
          consolidationData.notes,
          consolidationData.receivedAmount,
          consolidationData.paymentMethod,
          consolidationData.batteriesCountAndWeight,
          consolidationData.batteriesRate,
          consolidationData.customerType,
          consolidationData.customerId,
          consolidationData.vehicleNo
        );

        if (result.success) {
          console.log('✅ Auto-consolidated invoice created successfully');
          return NextResponse.json({
            message: 'Auto-consolidated invoice created successfully',
            invoice: result.data?.newInvoice,
            consolidatedFrom: consolidationData.pendingInvoiceIds,
            previousAmounts: consolidationData.previousAmounts,
            isConsolidated: true,
          });
        } else {
          console.log('❌ Auto-consolidation failed:', result.error);
          return NextResponse.json(
            {
              error:
                result.error || 'Failed to create auto-consolidated invoice',
            },
            { status: 500 }
          );
        }
      } catch (error: any) {
        console.error('💥 Auto-consolidation error:', error);
        return NextResponse.json(
          { error: 'Auto-consolidation failed: ' + error.message },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ No pending invoices - Creating normal invoice');
    }

    // Debug custom date logic
    console.log('🔍 Custom Date Debug:');
    console.log('useCustomDate:', formData.useCustomDate);
    console.log('customDate:', formData.customDate);
    console.log('useCustomDate type:', typeof formData.useCustomDate);
    console.log('customDate type:', typeof formData.customDate);

    // Log warranty auto-sync feature
    if (formData.useCustomDate === true || formData.useCustomDate === 'true') {
      console.log(
        '🔄 Warranty Auto-Sync: Custom date enabled - warranty start dates will automatically sync with custom invoice date'
      );
      console.log(
        '📅 Note: All warranty start dates will be set to the custom invoice date for consistency'
      );
    }

    const lastInvoice: any = await executeOperation('invoices', 'findLast');
    let nextInvoiceNumber;
    if (lastInvoice && typeof lastInvoice === 'object') {
      const lastInvoiceNumber = lastInvoice.invoiceNo;
      const numericPart = lastInvoiceNumber.replace(/^.*?(\d+)$/, '$1'); // Extract the numeric part
      const nextNumber = parseInt(numericPart) + 1;

      // 🔒 VALIDATION: Ensure invoice number is valid
      if (isNaN(nextNumber) || nextNumber <= 0) {
        return NextResponse.json(
          {
            error: `Invalid invoice number generated: ${nextNumber}`,
            showToast: true,
          },
          { status: 400 }
        );
      }

      nextInvoiceNumber = nextNumber.toString().padStart(8, '0'); // Ensure exactly 8 digits
    } else {
      nextInvoiceNumber = '00000001'; // Start with 1 if no invoices exist
    }

    // 🔒 VALIDATION: Ensure invoice number format is correct
    if (!/^\d{8}$/.test(nextInvoiceNumber)) {
      return NextResponse.json(
        {
          error: `Invalid invoice number format: ${nextInvoiceNumber}. Expected 8 digits.`,
          showToast: true,
        },
        { status: 400 }
      );
    }

    // Validate invoice data using InvoiceDataUtil
    const invoiceValidation = InvoiceDataUtil.validateInvoice({
      customerName: formData.customerName,
      customerContactNumber: formData.customerContactNumber,
      customerAddress: formData.customerAddress,
      products: formData.productDetail,
      paymentMethod: formData.paymentMethod,
      receivedAmount: formData.receivedAmount,
      taxRate: formData.taxRate,
    });

    if (!invoiceValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid invoice data',
          details: invoiceValidation.errors,
          warnings: invoiceValidation.warnings,
        },
        { status: 400 }
      );
    }

    // Use cleaned data from validation
    const validatedInvoiceData = invoiceValidation.cleanedData!;
    console.log('✅ Invoice data validated:', {
      customerName: validatedInvoiceData.customerName,
      productCount: validatedInvoiceData.products?.length || 0,
      totalAmount: validatedInvoiceData.totalAmount,
      warnings: invoiceValidation.warnings,
    });

    // Create an invoice document using validated data
    const invoice: any = {
      invoiceNo: nextInvoiceNumber,
      customerName: validatedInvoiceData.customerName,
      customerAddress: validatedInvoiceData.customerAddress,
      customerContactNumber: validatedInvoiceData.customerContactNumber,
      customerType: formData.customerType || 'WalkIn Customer',
      customerId:
        formData.customerType === 'Regular' ? formData.customerId : null,
      vehicleNo: formData.vehicleNo || '',
      paymentMethod: validatedInvoiceData.paymentMethod,
      batteriesCountAndWeight: formData?.batteriesCountAndWeight,
      batteriesRate: 0,
      receivedAmount: validatedInvoiceData.receivedAmount,
      isPayLater: formData?.paymentMethod?.includes('Pay Later') || false,

      products: await Promise.all(
        (validatedInvoiceData.products || []).map(async (product: any) => {
          // Get current cost from stock for profit calculation
          let currentCost = 0;
          try {
            const stockItem = (await executeOperation('stock', 'findOne', {
              brandName: product.brandName,
            })) as any;

            if (stockItem && Array.isArray(stockItem.seriesStock)) {
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
          }

          // Calculate warranty end date if warranty code is provided
          let warrantyEndDate = product.warrentyEndDate;

          // Determine the actual warranty start date to use for calculations
          let actualWarrantyStartDate = product.warrentyStartDate;
          if (
            (formData.useCustomDate === true ||
              formData.useCustomDate === 'true') &&
            formData.customDate
          ) {
            actualWarrantyStartDate = new Date(formData.customDate)
              .toISOString()
              .split('T')[0];
          }

          // Calculate warranty end date if warranty code is provided
          if (
            product.warrentyCode &&
            actualWarrantyStartDate &&
            product.warrentyDuration
          ) {
            const startDate = new Date(actualWarrantyStartDate);
            // Note: Warranty validation will be done outside the map function
            const duration = parseInt(product.warrentyDuration);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + duration);
            warrantyEndDate = endDate.toISOString().split('T')[0];
          }

          // Auto-set warranty start date to custom date if enabled
          let finalWarrantyStartDate = product.warrentyStartDate;
          if (
            (formData.useCustomDate === true ||
              formData.useCustomDate === 'true') &&
            formData.customDate
          ) {
            finalWarrantyStartDate = new Date(formData.customDate)
              .toISOString()
              .split('T')[0];
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
            isChargingService: !!product.isChargingService,
            isScrapBattery: !!product.isScrapBattery,
            warrentyCode: product.warrentyCode
              ? product.warrentyCode.trim()
              : '',
            warrentyStartDate: finalWarrantyStartDate,
            warrentyEndDate: warrantyEndDate,
            warrentyDuration: product.warrentyDuration || '',
            totalPrice: product.totalPrice,
            batteryDetails: product.batteryDetails,
          };
        })
      ),

      // Use calculated amounts from validation
      subtotal: validatedInvoiceData.subtotal,
      taxAmount: validatedInvoiceData.taxAmount,
      totalAmount: validatedInvoiceData.totalAmount,
      remainingAmount: validatedInvoiceData.remainingAmount,
      paymentStatus: validatedInvoiceData.paymentStatus,
      status: 'active',

      createdDate: validatedInvoiceData.createdDate,
    };

    // Calculate total cost and profit for the invoice
    const totalCost = invoice.products.reduce((sum: number, product: any) => {
      return sum + product.costPrice * Number(product.quantity);
    }, 0);

    const totalProfit = invoice.products.reduce((sum: number, product: any) => {
      return sum + (product.profit || 0);
    }, 0);

    // Add cost fields to invoice
    invoice.totalCost = totalCost; // ← NEW: Total cost for this invoice
    invoice.totalProfit = totalProfit; // ← NEW: Total profit for this invoice

    // Debug the cost calculation
    console.log('💰 COST CALCULATION DEBUG:');
    console.log(`   Total Cost: Rs ${totalCost.toLocaleString()}`);
    console.log(`   Total Profit: Rs ${totalProfit.toLocaleString()}`);
    console.log(`   Invoice fields before save:`, Object.keys(invoice));

    // Debug the final createdDate
    console.log('📅 Final createdDate:', invoice.createdDate);
    console.log('📅 Final createdDate type:', typeof invoice.createdDate);

    // 🔒 VALIDATION: Ensure custom date is valid when provided
    if (formData.useCustomDate === true || formData.useCustomDate === 'true') {
      if (!formData.customDate) {
        return NextResponse.json(
          {
            error: 'Custom date is required when useCustomDate is enabled',
            showToast: true,
          },
          { status: 400 }
        );
      }

      const customDate = new Date(formData.customDate);
      if (isNaN(customDate.getTime())) {
        return NextResponse.json(
          {
            error: `Invalid custom date: ${formData.customDate}`,
            showToast: true,
          },
          { status: 400 }
        );
      }

      // Ensure custom date is not in the future
      const customDateNow = new Date();
      if (customDate > customDateNow) {
        return NextResponse.json(
          {
            error: `Custom date cannot be in the future: ${formData.customDate}`,
            showToast: true,
          },
          { status: 400 }
        );
      }
    }

    // Calculate remaining amount using InvoiceDataUtil
    const calculation = InvoiceDataUtil.calculateAmounts(
      invoice.products,
      invoice.receivedAmount
    );
    const totalProductAmount = calculation.totalAmount;

    // 🔒 VALIDATION: Ensure totalProductAmount is always a valid number
    if (isNaN(totalProductAmount) || totalProductAmount < 0) {
      return NextResponse.json(
        {
          error: `Invalid total product amount: ${totalProductAmount}. Must be a positive number.`,
          showToast: true,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Ensure receivedAmount is always a valid number
    let receivedAmount = 0;
    if (
      formData?.receivedAmount !== undefined &&
      formData?.receivedAmount !== null &&
      formData?.receivedAmount !== ''
    ) {
      const parsedAmount = parseFloat(formData.receivedAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return NextResponse.json(
          {
            error: `Invalid received amount: ${formData.receivedAmount}. Must be a positive number.`,
            showToast: true,
          },
          { status: 400 }
        );
      }
      receivedAmount = parsedAmount;
    }

    // Ensure receivedAmount is never null or undefined
    if (
      receivedAmount === null ||
      receivedAmount === undefined ||
      isNaN(receivedAmount)
    ) {
      receivedAmount = 0;
    }

    // 🔒 VALIDATION: Ensure batteriesRate is always a valid number
    let batteriesRate = 0;
    if (
      formData?.batteriesRate !== undefined &&
      formData?.batteriesRate !== null &&
      formData?.batteriesRate !== ''
    ) {
      const parsedRate = parseFloat(formData.batteriesRate);
      if (isNaN(parsedRate) || parsedRate < 0) {
        return NextResponse.json(
          {
            error: `Invalid battery rate: ${formData.batteriesRate}. Must be a positive number.`,
            showToast: true,
          },
          { status: 400 }
        );
      }
      batteriesRate = parsedRate;
    }

    // Ensure batteriesRate is never null or undefined
    if (
      batteriesRate === null ||
      batteriesRate === undefined ||
      isNaN(batteriesRate)
    ) {
      batteriesRate = 0;
    }

    // Calculate remaining amount
    invoice.remainingAmount =
      totalProductAmount - receivedAmount - batteriesRate;

    // Debug the calculation
    console.log('💰 Invoice Creation Debug:');
    console.log('  totalProductAmount:', totalProductAmount);
    console.log('  receivedAmount:', receivedAmount);
    console.log('  batteriesRate:', batteriesRate);
    console.log('  calculated remainingAmount:', invoice.remainingAmount);

    // 🔒 VALIDATION: Ensure remainingAmount is a valid number
    if (isNaN(invoice.remainingAmount)) {
      return NextResponse.json(
        {
          error: `Invalid remaining amount calculation. Total: ${totalProductAmount}, Received: ${receivedAmount}, Batteries: ${batteriesRate}`,
          showToast: true,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Ensure received amount doesn't exceed total amount
    if (receivedAmount > totalProductAmount) {
      return NextResponse.json(
        {
          error: `Received amount (${receivedAmount}) cannot exceed total product amount (${totalProductAmount})`,
          showToast: true,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Ensure batteries rate doesn't exceed total amount
    if (batteriesRate > totalProductAmount) {
      return NextResponse.json(
        {
          error: `Batteries rate (${batteriesRate}) cannot exceed total product amount (${totalProductAmount})`,
          showToast: true,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Ensure combined received amount and batteries rate don't exceed total
    if (receivedAmount + batteriesRate > totalProductAmount) {
      return NextResponse.json(
        {
          error: `The received amount (${receivedAmount}) plus battery rate (${batteriesRate}) cannot be more than the total product cost (${totalProductAmount})`,
          showToast: true,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Ensure warranty codes are valid when provided
    for (const product of formData.productDetail) {
      // Check if product is battery tonic (distilled water) - skip warranty validation
      const isBatteryTonic =
        product.series &&
        (product.series.toLowerCase().includes('tonic') ||
          product.series.toLowerCase().includes('ml') ||
          (product.series.toLowerCase().includes('battery') &&
            product.series.toLowerCase().includes('water')) ||
          product.series.toLowerCase().includes('distilled'));

      // Skip warranty validation for battery tonic and when warranty is disabled
      if (isBatteryTonic || product.noWarranty) {
        continue;
      }

      if (
        product.warrentyCode &&
        product.warrentyCode.trim() !== '' &&
        product.warrentyCode !== 'No Warranty'
      ) {
        const warrantyCode = product.warrentyCode.trim();
        if (warrantyCode.length < 3) {
          return NextResponse.json(
            {
              error: `Warranty code for ${product.brandName} - ${product.series} must be at least 3 characters long`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty start date is provided when warranty code is set
        if (
          !product.warrentyStartDate ||
          product.warrentyStartDate.trim() === ''
        ) {
          return NextResponse.json(
            {
              error: `Warranty start date is required for ${product.brandName} - ${product.series} when warranty code is provided`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty duration is provided when warranty code is set
        if (
          !product.warrentyDuration ||
          product.warrentyDuration.toString().trim() === ''
        ) {
          return NextResponse.json(
            {
              error: `Warranty duration is required for ${product.brandName} - ${product.series} when warranty code is provided`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty start date is a valid date
        const warrantyStartDate = new Date(product.warrentyStartDate);
        if (isNaN(warrantyStartDate.getTime())) {
          throw new Error(
            `Invalid warranty start date for ${product.brandName} - ${product.series}: ${product.warrentyStartDate}`
          );
        }

        // Ensure warranty duration is a valid number
        const warrantyDuration = parseInt(product.warrentyDuration.toString());
        if (
          isNaN(warrantyDuration) ||
          warrantyDuration <= 0 ||
          warrantyDuration > 120
        ) {
          throw new Error(
            `Invalid warranty duration for ${product.brandName} - ${product.series}: ${product.warrentyDuration}. Must be between 1 and 120 months.`
          );
        }
      }
    }

    // 🔒 Set the validated batteriesRate in the invoice object
    invoice.batteriesRate = batteriesRate;

    // 🔒 Set the validated receivedAmount in the invoice object
    invoice.receivedAmount = receivedAmount;

    // 🔒 VALIDATION: Final validation of invoice object
    if (
      !invoice.invoiceNo ||
      !invoice.customerName ||
      !invoice.products ||
      invoice.products.length === 0
    ) {
      throw new Error(
        'Invoice object is missing required fields after validation'
      );
    }

    if (
      typeof invoice.remainingAmount !== 'number' ||
      isNaN(invoice.remainingAmount)
    ) {
      throw new Error(
        `Invalid remaining amount in invoice object: ${invoice.remainingAmount}`
      );
    }

    if (
      typeof invoice.batteriesRate !== 'number' ||
      isNaN(invoice.batteriesRate)
    ) {
      throw new Error(
        `Invalid batteries rate in invoice object: ${invoice.batteriesRate}`
      );
    }

    if (
      typeof invoice.receivedAmount !== 'number' ||
      isNaN(invoice.receivedAmount)
    ) {
      throw new Error(
        `Invalid received amount in invoice object: ${invoice.receivedAmount}`
      );
    }

    // 🔒 VALIDATION: Ensure invoice number format is correct
    if (!/^\d{8}$/.test(invoice.invoiceNo)) {
      throw new Error(
        `Invalid invoice number format in invoice object: ${invoice.invoiceNo}`
      );
    }

    // 🔒 VALIDATION: Ensure customer name is not empty (accepts "-" as valid)
    if (invoice.customerName.trim() === '') {
      throw new Error('Customer name cannot be empty in invoice object');
    }

    // Phone number validation removed - any value is acceptable
    // if (
    //   !invoice.customerContactNumber ||
    //   invoice.customerContactNumber.trim() === ''
    // ) {
    //   throw new Error(
    //     'Customer contact number cannot be empty in invoice object'
    //   );
    // }

    // 🔒 VALIDATION: Ensure products array is properly structured
    for (const product of invoice.products) {
      if (
        !product.brandName ||
        !product.series ||
        !product.productPrice ||
        !product.quantity ||
        !product.totalPrice
      ) {
        throw new Error(
          `Product in invoice object is missing required fields: ${JSON.stringify(product)}`
        );
      }

      if (
        typeof product.totalPrice !== 'number' ||
        isNaN(product.totalPrice) ||
        product.totalPrice <= 0
      ) {
        throw new Error(
          `Invalid product total price in invoice object: ${product.totalPrice}`
        );
      }

      if (
        (typeof product.quantity !== 'number' &&
          typeof product.quantity !== 'string') ||
        (typeof product.quantity === 'string' &&
          (isNaN(parseInt(product.quantity)) ||
            parseInt(product.quantity) <= 0)) ||
        (typeof product.quantity === 'number' &&
          (isNaN(product.quantity) || product.quantity <= 0))
      ) {
        throw new Error(
          `Invalid product quantity in invoice object: ${product.quantity}`
        );
      }
    }

    // Debug the calculation
    console.log('💰 Amount Calculation Debug:');
    console.log('  totalProductAmount:', totalProductAmount);
    console.log('  receivedAmount (raw):', formData?.receivedAmount);
    console.log('  receivedAmount (parsed):', receivedAmount);
    console.log('  batteriesRate (raw):', formData?.batteriesRate);
    console.log('  batteriesRate (parsed):', batteriesRate);
    console.log('  remainingAmount:', invoice.remainingAmount);

    // Set payment status based on remaining amount
    if (invoice.remainingAmount === 0) {
      invoice.paymentStatus = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }

    // 🔒 VALIDATION: Ensure warranty codes are valid when provided
    for (const product of formData.productDetail) {
      // Check if product is battery tonic (distilled water) - skip warranty validation
      const isBatteryTonic =
        product.series &&
        (product.series.toLowerCase().includes('tonic') ||
          product.series.toLowerCase().includes('ml') ||
          (product.series.toLowerCase().includes('battery') &&
            product.series.toLowerCase().includes('water')) ||
          product.series.toLowerCase().includes('distilled'));

      // Skip warranty validation for battery tonic and when warranty is disabled
      if (isBatteryTonic || product.noWarranty) {
        continue;
      }

      if (
        product.warrentyCode &&
        product.warrentyCode.trim() !== '' &&
        product.warrentyCode !== 'No Warranty'
      ) {
        const warrantyCode = product.warrentyCode.trim();
        if (warrantyCode.length < 3) {
          return NextResponse.json(
            {
              error: `Warranty code for ${product.brandName} - ${product.series} must be at least 3 characters long`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty start date is provided when warranty code is set
        if (
          !product.warrentyStartDate ||
          product.warrentyStartDate.trim() === ''
        ) {
          return NextResponse.json(
            {
              error: `Warranty start date is required for ${product.brandName} - ${product.series} when warranty code is provided`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty duration is provided when warranty code is set
        if (
          !product.warrentyDuration ||
          product.warrentyDuration.toString().trim() === ''
        ) {
          return NextResponse.json(
            {
              error: `Warranty duration is required for ${product.brandName} - ${product.series} when warranty code is provided`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty start date is a valid date
        const warrantyStartDate = new Date(product.warrentyStartDate);
        if (isNaN(warrantyStartDate.getTime())) {
          return NextResponse.json(
            {
              error: `Invalid warranty start date for ${product.brandName} - ${product.series}: ${product.warrentyStartDate}`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        // Ensure warranty duration is a valid number
        const warrantyDuration = parseInt(product.warrentyDuration.toString());
        if (
          isNaN(warrantyDuration) ||
          warrantyDuration <= 0 ||
          warrantyDuration > 120
        ) {
          return NextResponse.json(
            {
              error: `Invalid warranty duration for ${product.brandName} - ${product.series}: ${product.warrentyDuration}. Must be between 1 and 120 months.`,
              showToast: true,
            },
            { status: 400 }
          );
        }
      }
    }

    // 🔒 VALIDATION: Ensure customer information is provided (any text but not empty)
    if (!formData.customerName || formData.customerName.trim() === '') {
      throw new Error(
        'Customer name is required. Please enter a name (e.g., "John Doe", "Walk-in Customer", "ABC Company", "-")'
      );
    }

    if (!formData.customerAddress || formData.customerAddress.trim() === '') {
      throw new Error(
        'Customer address is required. Please enter a location (e.g., "Downtown Area", "Main Street", "Not specified", "-")'
      );
    }

    // Phone number validation removed - any value is acceptable
    // if (
    //   !formData.customerContactNumber ||
    //   formData.customerContactNumber.trim() === ''
    // ) {
    //   throw new Error(
    //     'Customer contact number is required. Please enter a number (e.g., "03123456789", "Not provided", "Walk-in customer", "-")'
    //   );
    // }

    // 🔒 VALIDATION: Ensure products are provided
    if (
      !formData.productDetail ||
      !Array.isArray(formData.productDetail) ||
      formData.productDetail.length === 0
    ) {
      throw new Error('At least one product is required for the invoice');
    }

    // 🔒 VALIDATION: Ensure each product has required fields
    for (const product of formData.productDetail) {
      if (
        !product.brandName ||
        !product.series ||
        !product.productPrice ||
        !product.quantity
      ) {
        throw new Error(
          `Product is missing required fields: brandName, series, productPrice, or quantity`
        );
      }

      if (parseFloat(product.productPrice) <= 0) {
        throw new Error(
          `Invalid product price for ${product.brandName} - ${product.series}: ${product.productPrice}`
        );
      }

      if (parseInt(product.quantity) <= 0) {
        throw new Error(
          `Invalid quantity for ${product.brandName} - ${product.series}: ${product.quantity}`
        );
      }
    }

    // 🔒 VALIDATION: Ensure payment method is provided
    if (
      !formData.paymentMethod ||
      !Array.isArray(formData.paymentMethod) ||
      formData.paymentMethod.length === 0
    ) {
      throw new Error('Payment method is required and must be an array');
    }

    // Validate quantities before updating stock
    console.log('📦 Validating stock quantities...');
    for (const product of formData.productDetail) {
      // Skip stock validation for charging service products
      if (product.isChargingService) {
        console.log(
          `⏭️ Skipping stock validation for charging service: ${product.productName || product.series}`
        );
        continue;
      }

      const seriesName = (
        product.batteryDetails?.name ||
        product.series ||
        ''
      ).trim();
      const quantity = parseInt(product.quantity) || 0;

      if (quantity <= 0) {
        throw new Error(`Invalid quantity for ${seriesName}: ${quantity}`);
      }

      // Check current stock before updating (case/whitespace-insensitive)
      const stockQuery = {
        ...(product.brandName
          ? {
              brandName: {
                $regex: `^\\n?\\r?\\t?\\s*${escapeRegex(
                  String(product.brandName).trim()
                )}\\s*$`,
                $options: 'i',
              },
            }
          : {}),
        'seriesStock.series': {
          $regex: `^${escapeRegex(seriesName)}$`,
          $options: 'i',
        },
      } as any;

      let stockExists = await executeOperation('stock', 'findOne', stockQuery);

      // Fallback: try without brand filter in case brand text differs
      if (!stockExists) {
        const fallbackQuery = {
          'seriesStock.series': {
            $regex: `^${escapeRegex(seriesName)}$`,
            $options: 'i',
          },
        } as any;
        stockExists = await executeOperation('stock', 'findOne', fallbackQuery);
        if (stockExists) {
          try {
            const foundBrand = String((stockExists as any)?.brandName || '')
              .trim()
              .toLowerCase();
            const requestedBrand = String(product.brandName || '')
              .trim()
              .toLowerCase();
            if (requestedBrand && foundBrand && foundBrand !== requestedBrand) {
              console.warn(
                `Brand mismatch: requested='${requestedBrand}' found='${foundBrand}' for series='${seriesName}'`
              );
            }
          } catch {}
        }
      }

      if (!stockExists) {
        throw new Error(`Series '${seriesName}' not found in stock.`);
      }

      // Validate stock availability
      const stockData = stockExists as any;
      const currentStock = stockData.seriesStock?.find((item: any) => {
        const s = String(item.series || '');
        // Prioritize exact match first
        if (s === seriesName) return true;
        // Use symbol normalization for matching
        if (
          normalizeSeriesForMatching(s) ===
          normalizeSeriesForMatching(seriesName)
        )
          return true;
        // Fall back to existing normalized matching
        return (
          normalizeSeries(s) === normalizeSeries(seriesName) ||
          normalizeText(s) === normalizeText(seriesName)
        );
      });
      if (!currentStock) {
        try {
          const available = (stockData.seriesStock || []).map(
            (i: any) => i.series
          );
          console.warn(
            'Series not found; available series for matched brand:',
            available
          );
        } catch {}
        throw new Error(`Series '${seriesName}' not found in stock data.`);
      }

      const currentInStock = parseInt(currentStock.inStock) || 0;
      if (currentInStock < quantity) {
        throw new Error(
          `Insufficient stock for ${seriesName}. Available: ${currentInStock}, Requested: ${quantity}`
        );
      }

      // Preserve the exact stored series value for subsequent updates
      (product as any)._normalizedSeries = currentStock.series;
    }

    // Update stock quantities and sold counts
    console.log('📦 Updating stock quantities and sold counts...');
    for (const product of formData.productDetail) {
      // Skip stock updates for charging service products
      if (product.isChargingService) {
        console.log(
          `⏭️ Skipping stock update for charging service: ${product.productName}`
        );
        continue;
      }

      const seriesName =
        (product as any)._normalizedSeries ||
        (product.batteryDetails?.name || product.series || '').trim();
      const quantity = parseInt(product.quantity) || 0;

      console.log(`🔄 Updating stock for ${seriesName}: quantity=${quantity}`);

      // Update the stock quantity and increment sold count
      const stockUpdateResult = await executeOperation(
        'stock',
        'updateStockAndSoldCount',
        {
          series: seriesName,
          quantity: quantity,
        }
      );

      // 🔒 VALIDATION: Ensure stock update was successful
      if (!stockUpdateResult) {
        throw new Error(`Failed to update stock for ${seriesName}`);
      }

      console.log(`✅ Stock updated for ${seriesName}`);
    }

    // Insert the invoice into the database
    console.log('📄 Inserting invoice into database...');
    console.log('🔍 FINAL INVOICE CHECK:');
    console.log(`   totalCost: ${invoice.totalCost}`);
    console.log(`   totalProfit: ${invoice.totalProfit}`);
    console.log(
      `   products[0].costPrice: ${invoice.products?.[0]?.costPrice}`
    );
    console.log(`   products[0].profit: ${invoice.products?.[0]?.profit}`);

    // For walk-in customers, create/update customer record
    let customerId = null;
    if (invoice.customerType === 'WalkIn Customer') {
      // Check if customer already exists by both name AND phone (more specific)
      const existingCustomer = await executeOperation('customers', 'findOne', {
        customerName: invoice.customerName,
        phoneNumber: invoice.customerContactNumber,
        customerType: 'WalkIn Customer',
      });

      if (
        existingCustomer &&
        typeof existingCustomer === 'object' &&
        ('_id' in existingCustomer || 'id' in existingCustomer)
      ) {
        customerId =
          (existingCustomer as any)._id?.toString() ||
          (existingCustomer as any).id?.toString();
      } else {
        // Create new walk-in customer
        const customerResult = await executeOperation(
          'customers',
          'insertOne',
          {
            customerName: invoice.customerName,
            phoneNumber: invoice.customerContactNumber,
            address: invoice.customerAddress,
            email: '',
            customerType: 'WalkIn Customer',
            createdAt: new Date(),
            updatedAt: new Date(),
            totalInvoices: 0,
            totalAmount: 0,
            lastInvoiceDate: new Date(),
          }
        );
        customerId =
          customerResult &&
          typeof customerResult === 'object' &&
          'insertedId' in customerResult
            ? (customerResult as any).insertedId
            : null;
      }

      // Store customerId in invoice
      invoice.clientId = customerId;
    }

    const invoiceResult = await executeOperation(
      'invoices',
      'insertOne',
      invoice
    );

    // 🔒 VALIDATION: Ensure invoice insertion was successful
    if (!invoiceResult) {
      throw new Error('Failed to insert invoice into database');
    }

    // Add warranty codes to lookup collection
    await addWarrantyCodes(
      invoice.products,
      invoice.invoiceNo,
      invoice.customerName,
      invoice.customerContactNumber,
      'invoice',
      invoice.createdDate
    );

    // Insert a sales record into the sales collection
    console.log('💼 Inserting sales record...');

    // 🔒 VALIDATION: Ensure sales record data is valid
    const salesCalculation = InvoiceDataUtil.calculateAmounts(invoice.products);
    const salesTotalAmount = salesCalculation.totalAmount;
    if (isNaN(salesTotalAmount) || salesTotalAmount <= 0) {
      throw new Error(`Invalid sales total amount: ${salesTotalAmount}`);
    }

    const salesRecord = {
      invoiceId: invoice.invoiceNo,
      date: invoice.createdDate,
      customerName: invoice.customerName,
      products: invoice.products,
      totalAmount: salesTotalAmount,
      paymentMethod: invoice.paymentMethod,
      // Add charging service flags for analytics
      isChargingService:
        invoice.products?.some((product: any) => product.isChargingService) ||
        false,
      isScrapBattery:
        invoice.products?.some((product: any) => product.isScrapBattery) ||
        false,
      // Add cost fields from invoice
      totalCost: invoice.totalCost, // ← NEW: Total cost from invoice
      totalProfit: invoice.totalProfit, // ← NEW: Total profit from invoice
    };

    // Debug the sales record
    console.log('🔍 FINAL SALES RECORD CHECK:');
    console.log(`   salesRecord.totalCost: ${salesRecord.totalCost}`);
    console.log(`   salesRecord.totalProfit: ${salesRecord.totalProfit}`);
    console.log(
      `   salesRecord.products[0].costPrice: ${salesRecord.products[0]?.costPrice}`
    );
    console.log(
      `   salesRecord.products[0].profit: ${salesRecord.products[0]?.profit}`
    );

    // 🔒 VALIDATION: Ensure sales record has required fields
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

    // 🔒 VALIDATION: Ensure sales record insertion was successful
    if (!salesResult) {
      throw new Error('Failed to insert sales record into database');
    }

    // Log warranty information summary
    if (formData.useCustomDate === true || formData.useCustomDate === 'true') {
      console.log('📋 Warranty Summary (Custom Date Enabled):');
      invoice.products.forEach((product: any, index: number) => {
        if (product.warrentyCode && product.warrentyStartDate) {
          console.log(
            `  Product ${index + 1}: ${product.brandName} - ${product.series}`
          );
          console.log(`    Warranty Code: ${product.warrentyCode}`);
          console.log(`    Warranty Start: ${product.warrentyStartDate}`);
          console.log(`    Warranty End: ${product.warrentyEndDate}`);
          console.log(
            `    Duration: ${formData.productDetail[index]?.warrentyDuration} months`
          );
        }
      });
    }

    // 2. Validate and normalize stock data
    console.log('🔍 Validating and normalizing stock data...');

    // Skip stock validation for charging services since they don't require physical inventory
    const hasChargingServices = formData.productDetail?.some(
      (product: any) => product.isChargingService
    );

    // Note: Stock validation removed - stock updates are handled later in the process

    console.log('✅ Invoice created successfully');

    // Revalidate cache to show new invoice data
    revalidatePath('/invoice');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/customers');
    revalidatePath('/api/invoice');
    revalidatePath('/api/invoice/[id]', 'page');
    revalidatePath('/api/customers/[customerId]/invoices', 'page');

    // Revalidate stock data to reflect stock changes
    revalidatePath('/stock');
    revalidatePath('/dashboard/stock');
    revalidatePath('/api/stock');
    revalidatePath('/api/stock/[brand]', 'page');

    console.log('✅ Stock cache revalidated');

    return NextResponse.json({
      message: 'Invoice created successfully',
      customerId: customerId,
    });
  } catch (err: any) {
    console.error('❌ Error creating invoice:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    // Remove from processing set
    processingInvoices.delete(requestId);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { additionalPayment, paymentMethod, id } = await req.json();

    // 🔒 VALIDATION: Validate additional payment amount
    if (
      !additionalPayment ||
      isNaN(parseFloat(additionalPayment)) ||
      parseFloat(additionalPayment) <= 0
    ) {
      return NextResponse.json(
        {
          error: `Invalid additional payment amount: ${additionalPayment}. Must be a positive number.`,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Validate payment method
    if (
      !paymentMethod ||
      !Array.isArray(paymentMethod) ||
      paymentMethod.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Payment method is required and must be an array.',
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Validate ID
    if (!id) {
      return NextResponse.json(
        {
          error: 'Invoice ID is required.',
        },
        { status: 400 }
      );
    }

    // Debug: Log the ID format
    console.log('🔍 API Payment Debug - ID:', id);
    console.log('🔍 API Payment Debug - ID type:', typeof id);
    console.log('🔍 API Payment Debug - ID length:', id.length);

    let invoiceId;
    let invoice;

    try {
      // Try to create ObjectId first
      invoiceId = new ObjectId(id);
      invoice = await executeOperation('invoices', 'findOne', {
        _id: invoiceId,
      });
    } catch (error) {
      // If ObjectId creation fails, try searching by string ID
      console.log('⚠️ ObjectId creation failed, trying string ID search');
      invoice = await executeOperation('invoices', 'findOne', {
        id: id,
      });
    }

    if (!invoice) {
      return NextResponse.json(
        {
          error: `Invoice not found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    if (
      typeof invoice === 'object' &&
      invoice !== null &&
      'remainingAmount' in invoice
    ) {
      // For payment calculations, use the existing values from database
      const currentRemainingAmount = parseFloat(invoice.remainingAmount) || 0;
      const currentReceivedAmount = parseFloat(invoice.receivedAmount) || 0;
      const paymentAmount = parseFloat(additionalPayment) || 0;

      // Debug logging
      console.log('🔍 Payment Debug:', {
        invoiceNo: invoice.invoiceNo,
        currentRemainingAmount,
        currentReceivedAmount,
        paymentAmount,
        additionalPaymentArray: invoice.additionalPayment,
      });

      // Validate payment amount doesn't exceed remaining amount
      if (paymentAmount > currentRemainingAmount) {
        return NextResponse.json(
          {
            error: `Payment amount (${paymentAmount}) cannot exceed remaining amount (${currentRemainingAmount})`,
          },
          { status: 400 }
        );
      }

      const newPayment = {
        addedDate: new Date(),
        amount: paymentAmount,
        paymentMethod: paymentMethod,
      };

      const newRemainingAmount = currentRemainingAmount - paymentAmount;

      console.log('📝 Update Values:', {
        newRemainingAmount,
        newPayment,
      });

      const updatedInvoice: any = {
        ...invoice,
        additionalPayment: [...(invoice.additionalPayment || []), newPayment],
        // Don't change receivedAmount - it's the initial amount received at invoice creation
        remainingAmount: newRemainingAmount,
      };

      // Update payment status based on new remaining amount
      if (newRemainingAmount <= 0) {
        updatedInvoice.paymentStatus = 'paid';
        updatedInvoice.remainingAmount = 0;
      } else if (currentReceivedAmount > 0) {
        updatedInvoice.paymentStatus = 'partial';
        updatedInvoice.remainingAmount = newRemainingAmount;
      } else {
        updatedInvoice.paymentStatus = 'pending';
        updatedInvoice.remainingAmount = newRemainingAmount;
      }

      // Update the invoice in the database
      const updateResult = await executeOperation('invoices', 'updateOne', {
        ...updatedInvoice,
        ...(invoiceId ? { _id: invoiceId } : { id: id }),
      });

      // Revalidate cache to show updated invoice data
      revalidatePath('/invoice');
      revalidatePath('/dashboard/invoices');
      revalidatePath('/dashboard/customers');
      revalidatePath('/api/invoice');
      revalidatePath('/api/invoice/[id]');
      revalidatePath('/api/customers/[customerId]/invoices');

      return NextResponse.json({
        message: 'Invoice updated successfully',
        additionalPayment: updatedInvoice.additionalPayment,
        remainingAmount: updatedInvoice.remainingAmount,
        paymentStatus: updatedInvoice.paymentStatus,
        receivedAmount: updatedInvoice.receivedAmount,
      });
    } else {
      return NextResponse.json({ error: 'Invalid Invoice' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const invoiceId = new ObjectId(id);

    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    log.invoice('Starting complete invoice deletion', invoice.invoiceNo);
    log.invoice('Invoice details', {
      customerName: invoice.customerName,
      totalProducts: invoice.products?.length || 0,
      totalAmount: invoice.totalAmount,
      paymentMethod: invoice.paymentMethod,
      isConsolidated: !!(
        invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0
      ),
      consolidatedFrom: invoice.consolidatedFrom,
    });

    // 2. Remove warranty data from warrantyHistory and lookup collections
    if (invoice.products && Array.isArray(invoice.products)) {
      log.invoice('Removing warranty data...');
      for (const product of invoice.products) {
        if (product.warrentyCode) {
          try {
            await executeOperation('warrantyHistory', 'deleteMany', {
              warrentyCode: product.warrentyCode.trim(),
              originalInvoiceNo: invoice.invoiceNo,
            });
          } catch (warrantyError) {
            log.warning(
              'Failed to remove warranty data from history:',
              warrantyError
            );
          }
        }
      }
    }

    // 3. Reverse stock changes
    const isConsolidated = !!(
      invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0
    );

    if (isConsolidated) {
      log.stock(
        'CONSOLIDATED INVOICE: Restoring stock for NEW products only...'
      );
      log.stock(
        `This invoice was created by consolidating ${invoice.consolidatedFrom?.length} invoices`
      );
      log.warning(
        'Original invoices were already voided during consolidation (no stock changes)'
      );
      log.stock(
        'Only NEW products added during consolidation should have stock restored'
      );

      if (invoice.products && Array.isArray(invoice.products)) {
        log.stock(
          'Restoring stock for new products in consolidated invoice...'
        );
        for (const product of invoice.products) {
          if (product.isChargingService || product.isScrapBattery) {
            log.stock(
              `Skipping stock restoration for service: ${product.productName || product.series}`
            );
            continue;
          }

          const seriesName =
            product.batteryDetails?.name || product.series || '';
          const isLegacyScrap =
            seriesName.toLowerCase().includes('scrap') ||
            (product.brandName &&
              product.brandName.toLowerCase().includes('scrap'));

          if (isLegacyScrap) {
            log.stock(
              `Skipping stock restoration for legacy scrap: ${seriesName}`
            );
            continue;
          }

          log.stock(
            `Restoring stock for consolidated invoice product: ${product.brandName} - ${product.series}`
          );
          log.debug('Quantity to restore', product.quantity);

          try {
            const { connectToMongoDB } =
              await import('@/app/libs/connectToMongoDB');
            const db = await connectToMongoDB();

            if (!db) {
              throw new Error('Database connection failed');
            }

            const stockUpdateResult = await db.collection('stock').updateOne(
              {
                brandName: product.brandName,
                'seriesStock.series': product.series,
              },
              {
                $inc: {
                  'seriesStock.$.inStock': parseInt(product.quantity) || 1,
                  'seriesStock.$.soldCount': -(parseInt(product.quantity) || 1),
                },
              }
            );

            log.database('Stock update result', stockUpdateResult);

            if (stockUpdateResult.modifiedCount > 0) {
              log.success(
                `Stock restored for consolidated invoice product: ${product.brandName} - ${product.series}`
              );
            } else {
              log.warning(
                `Stock restore failed for consolidated invoice product: ${product.brandName} - ${product.series} (no matching stock found)`
              );
            }
          } catch (stockError) {
            log.error(
              `Error restoring stock for consolidated invoice product ${product.brandName} - ${product.series}:`,
              stockError
            );
          }
        }
      }
    } else {
      log.stock('NORMAL INVOICE: Reversing stock changes...');
      if (invoice.products && Array.isArray(invoice.products)) {
        for (const product of invoice.products) {
          if (product.isChargingService || product.isScrapBattery) {
            log.stock(
              `Skipping stock restoration for service: ${product.productName || product.series}`
            );
            continue;
          }

          const seriesName =
            product.batteryDetails?.name || product.series || '';
          const isLegacyScrap =
            seriesName.toLowerCase().includes('scrap') ||
            (product.brandName &&
              product.brandName.toLowerCase().includes('scrap'));

          if (isLegacyScrap) {
            log.stock(
              `Skipping stock restoration for legacy scrap: ${seriesName}`
            );
            continue;
          }

          const quantity = parseInt(product.quantity) || 1;
          log.stock(`Restoring stock for ${seriesName}: +${quantity} units`);
          log.debug('Product series', product.series);
          log.debug(
            'Product batteryDetails.name',
            product.batteryDetails?.name
          );

          try {
            const restoreResult = await executeOperation(
              'stock',
              'restoreStockFromInvoice',
              {
                series: seriesName,
                quantity: String(quantity),
              }
            );
            log.success(`Stock restored for ${seriesName}:`, restoreResult);
          } catch (stockError: any) {
            log.error(`Failed to restore stock for ${seriesName}:`, stockError);
            log.warning(
              'Stock restoration failed but continuing with invoice deletion'
            );
          }
        }
      }
    }

    // 4. Delete the sales record
    log.info('Deleting sales record...');
    try {
      await executeOperation('sales', 'deleteOne', {
        invoiceId: invoice.invoiceNo,
      });
      log.success('Sales record deleted');
    } catch (salesError: any) {
      log.error('Failed to delete sales record:', salesError);
      throw new Error(`Failed to delete sales record: ${salesError.message}`);
    }

    // 5. Archive the invoice data
    log.info('Archiving invoice data...');
    try {
      await executeOperation('invoiceArchive', 'insertOne', {
        ...invoice,
        archivedAt: new Date(),
        archivedBy: 'system',
        originalId: invoice._id,
      });
      log.success('Invoice data archived');
    } catch (archiveError) {
      log.warning('Failed to archive invoice data:', archiveError);
    }

    // 6. Delete the invoice
    log.info('Deleting main invoice record...');
    try {
      await executeOperation('invoices', 'deleteOne', {
        _id: invoiceId,
      });
      log.success('Main invoice record deleted');
    } catch (deleteError: any) {
      log.error('Failed to delete main invoice record:', deleteError);
      throw new Error(`Failed to delete invoice: ${deleteError.message}`);
    }

    // Remove warranty codes from lookup collection
    await removeWarrantyCodes(invoice.invoiceNo);

    log.success(`Complete invoice deletion successful: ${invoice.invoiceNo}`);

    // Revalidate cache to show updated invoice list
    revalidatePath('/invoice');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/customers');
    revalidatePath(`/api/customers/${invoice.customerId}/invoices`);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
      invoiceNo: invoice.invoiceNo,
    });
  } catch (error: any) {
    log.error('Error during invoice deletion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
