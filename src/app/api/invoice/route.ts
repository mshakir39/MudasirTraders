'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { getAllSum } from '@/utils/getTotalSum';
import { validateAndNormalizeStock } from '@/utils/stockUtils';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

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
    .replace(/\s+/g, ' ')     // Normalize multiple spaces to single space
    .replace(/\s*\(\s*/g, ' (') // Add space before opening parenthesis
    .replace(/\s*\)\s*/g, ') ') // Add space after closing parenthesis
    .replace(/\s*\/\s*/g, '/') // Fix spaces around slashes
    .replace(/\s+/g, ' ')     // Clean up any new multiple spaces
    .trim();
}

// Build a regex that requires all tokens (split by space, '/', ',', '(', ')', '-') to appear in any order
function buildTokenRegex(input: string) {
  const tokens = String(input || '')
    .split(/[\s/,()\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return '.*';
  const lookaheads = tokens.map((t) => `(?=.*${escapeRegex(t)})`).join('');
  return `^${lookaheads}.*$`;
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

    // Create an invoice document
    const invoice: any = {
      invoiceNo: nextInvoiceNumber,
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerContactNumber: formData.customerContactNumber,
      customerType: formData.customerType || 'WalkIn Customer', // Add customer type
      customerId:
        formData.customerType === 'Regular' ? formData.customerId : null, // Add customerId for regular customers
      vehicleNo: formData.vehicleNo || '',
      paymentMethod: formData.paymentMethod,
      batteriesCountAndWeight: formData?.batteriesCountAndWeight,
      batteriesRate: 0, // Will be validated and set below
      receivedAmount: 0, // Will be validated and set below
      isPayLater: formData?.paymentMethod?.includes('Pay Later') || false,

      products: formData.productDetail.map((product: any) => {
        // 🔒 VALIDATION: Ensure product has required fields
        if (
          !product.brandName ||
          !product.series ||
          !product.productPrice ||
          !product.quantity
        ) {
          return NextResponse.json(
            {
              error: `Product is missing required fields: ${JSON.stringify(product)}`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        const productPrice = parseFloat(product.productPrice);
        const quantity = parseInt(product.quantity);

        if (isNaN(productPrice) || productPrice <= 0) {
          return NextResponse.json(
            {
              error: `Invalid product price for ${product.brandName} - ${product.series}: ${product.productPrice}`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        if (isNaN(quantity) || quantity <= 0) {
          return NextResponse.json(
            {
              error: `Invalid quantity for ${product.brandName} - ${product.series}: ${quantity}`,
              showToast: true,
            },
            { status: 400 }
          );
        }

        const totalPrice = productPrice * quantity;

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

        if (
          product.warrentyCode &&
          actualWarrantyStartDate &&
          product.warrentyDuration
        ) {
          const startDate = new Date(actualWarrantyStartDate);
          if (isNaN(startDate.getTime())) {
            return NextResponse.json(
              {
                error: `Warranty start date for ${product.brandName} - ${product.series} cannot be in the future: ${actualWarrantyStartDate}`,
                showToast: true,
              },
              { status: 400 }
            );
          }
          const endDate = new Date(startDate);
          endDate.setMonth(
            endDate.getMonth() + parseInt(product.warrentyDuration.toString())
          );
          warrantyEndDate = endDate.toISOString().split('T')[0];

          // 🔒 VALIDATION: Ensure warranty end date is valid
          const calculatedEndDate = new Date(warrantyEndDate);
          if (isNaN(calculatedEndDate.getTime())) {
            return NextResponse.json(
              {
                error: `Invalid warranty end date calculated for ${product.brandName} - ${product.series}: ${warrantyEndDate}`,
                showToast: true,
              },
              { status: 400 }
            );
          }

          // Note: Allow warranty end date to be in the past to support backdated invoices
        }

        // Auto-set warranty start date to custom date if enabled
        let finalWarrantyStartDate = product.warrentyStartDate;
        if (
          (formData.useCustomDate === true ||
            formData.useCustomDate === 'true') &&
          formData.customDate
        ) {
          // Use custom date for warranty start date
          finalWarrantyStartDate = new Date(formData.customDate)
            .toISOString()
            .split('T')[0];
          console.log(
            `📅 Auto-setting warranty start date for ${product.brandName} - ${product.series} to custom date: ${finalWarrantyStartDate}`
          );
          console.log(
            `📅 Original warranty start date was: ${product.warrentyStartDate}`
          );
        }

        return {
          brandName: product.brandName,
          series: product.series,
          productPrice: product.productPrice,
          quantity: product.quantity,
          isChargingService: !!product.isChargingService,
          isScrapBattery: !!product.isScrapBattery,
          warrentyCode: product.warrentyCode ? product.warrentyCode.trim() : '',
          warrentyStartDate: finalWarrantyStartDate,
          warrentyEndDate: warrantyEndDate,
          totalPrice: totalPrice,
          batteryDetails: product.batteryDetails,
        };
      }),
      createdDate:
        (formData.useCustomDate === true ||
          formData.useCustomDate === 'true') &&
        formData.customDate
          ? new Date(formData.customDate)
          : new Date(),
    };

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

    // Calculate remaining amount
    const totalProductAmount = getAllSum(invoice.products, 'totalPrice') || 0;

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

      // Skip warranty validation for battery tonic
      if (isBatteryTonic) {
        continue;
      }

      if (product.warrentyCode && product.warrentyCode.trim() !== '') {
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

    // 🔒 VALIDATION: Ensure customer contact is not empty (accepts "-" as valid)
    if (invoice.customerContactNumber.trim() === '') {
      throw new Error(
        'Customer contact number cannot be empty in invoice object'
      );
    }

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
        typeof product.quantity !== 'string' ||
        parseInt(product.quantity) <= 0
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

    if (
      !formData.customerContactNumber ||
      formData.customerContactNumber.trim() === ''
    ) {
      throw new Error(
        'Customer contact number is required. Please enter a number (e.g., "03123456789", "Not provided", "Walk-in customer", "-")'
      );
    }

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
          $regex: buildTokenRegex(seriesName),
          $options: 'i',
        },
      } as any;

      let stockExists = await executeOperation('stock', 'findOne', stockQuery);

      // Fallback: try without brand filter in case brand text differs
      if (!stockExists) {
        const fallbackQuery = {
          'seriesStock.series': {
            $regex: buildTokenRegex(seriesName),
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
      const tokenPattern = new RegExp(buildTokenRegex(seriesName), 'i');
      const currentStock = stockData.seriesStock?.find((item: any) => {
        const s = String(item.series || '');
        return (
          normalizeSeries(s) === normalizeSeries(seriesName) || 
          normalizeText(s) === normalizeText(seriesName) || 
          tokenPattern.test(s)
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
    const invoiceResult = await executeOperation(
      'invoices',
      'insertOne',
      invoice
    );

    // 🔒 VALIDATION: Ensure invoice insertion was successful
    if (!invoiceResult) {
      throw new Error('Failed to insert invoice into database');
    }

    // Insert a sales record into the sales collection
    console.log('💼 Inserting sales record...');

    // 🔒 VALIDATION: Ensure sales record data is valid
    const salesTotalAmount = getAllSum(invoice.products, 'totalPrice');
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
    };

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
    return NextResponse.json({ message: 'Invoice created successfully' });
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

    const invoiceId = new ObjectId(id);
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (
      typeof invoice === 'object' &&
      invoice !== null &&
      'remainingAmount' in invoice
    ) {
      const remainingAmount = parseFloat(invoice.remainingAmount) || 0;
      const paymentAmount = parseFloat(additionalPayment) || 0;

      // 🔒 VALIDATION: Ensure payment amount doesn't exceed remaining amount
      if (paymentAmount > remainingAmount) {
        return NextResponse.json(
          {
            error: `Payment amount (${paymentAmount}) cannot exceed remaining amount (${remainingAmount})`,
          },
          { status: 400 }
        );
      }

      const newPayment = {
        addedDate: new Date(),
        amount: paymentAmount,
        paymentMethod: paymentMethod,
      };

      const updatedInvoice = {
        ...invoice,
        additionalPayment: [...(invoice.additionalPayment || []), newPayment],
        remainingAmount: remainingAmount - paymentAmount,
      };

      await executeOperation('invoices', 'updateOne', updatedInvoice);

      return NextResponse.json({ message: 'Invoice updated successfully' });
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

    // 1. First, get the invoice details before deleting
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    console.log(
      '🗑️ Starting complete invoice deletion for:',
      invoice.invoiceNo
    );
    console.log('📋 Invoice details:', {
      customerName: invoice.customerName,
      totalProducts: invoice.products?.length || 0,
      totalAmount: invoice.remainingAmount,
      paymentMethod: invoice.paymentMethod,
    });

    // 2. Preserve warranty data before deletion (for warranty lookups)
    if (invoice.products && Array.isArray(invoice.products)) {
      console.log('🔧 Preserving warranty data...');
      for (const product of invoice.products) {
        if (product.warrentyCode) {
          try {
            await executeOperation('warrantyHistory', 'insertOne', {
              warrentyCode: product.warrentyCode
                ? product.warrentyCode.trim()
                : '',
              customerName: invoice.customerName,
              customerContactNumber: invoice.customerContactNumber,
              customerAddress: invoice.customerAddress,
              productDetails: {
                brandName: product.brandName,
                series: product.series,
                warrentyStartDate: product.warrentyStartDate,
                warrentyEndDate: product.warrentyEndDate,
                warrentyDuration: product.warrentyDuration,
              },
              originalInvoiceNo: invoice.invoiceNo,
              originalInvoiceId: invoice._id,
              deletedAt: new Date(),
              deletionReason: 'Invoice deleted by user',
            });
            console.log(
              `✅ Warranty data preserved for: ${product.warrentyCode}`
            );
          } catch (warrantyError) {
            console.warn(
              `⚠️ Failed to preserve warranty data for ${product.warrentyCode}:`,
              warrantyError
            );
          }
        }
      }
    }

    // 3. Reverse stock changes (restore quantities)
    if (invoice.products && Array.isArray(invoice.products)) {
      console.log('📦 Reversing stock changes...');
      for (const product of invoice.products) {
        // Skip stock restoration for charging service/scrap battery products
        if (product.isChargingService || product.isScrapBattery) {
          console.log(
            `⏭️ Skipping stock restoration for service: ${product.productName || product.series}`
          );
          continue;
        }

        // Handle legacy scrap battery invoices by checking series name patterns
        const seriesName = product.batteryDetails?.name || product.series || '';
        const isLegacyScrap =
          seriesName.toLowerCase().includes('scrap') ||
          (product.brandName &&
            product.brandName.toLowerCase().includes('scrap'));

        if (isLegacyScrap) {
          console.log(
            `⏭️ Skipping stock restoration for legacy scrap: ${seriesName}`
          );
          continue;
        }

        const quantity = product.quantity;

        console.log(`🔄 Restoring stock for ${seriesName}: +${quantity} units`);

        try {
          // Restore stock quantities (increase inStock, decrease soldCount)
          await executeOperation('stock', 'restoreStockFromInvoice', {
            series: seriesName,
            quantity: parseInt(quantity) || 0,
          });
          console.log(`✅ Stock restored for ${seriesName}`);
        } catch (stockError: any) {
          console.error(
            `❌ Failed to restore stock for ${seriesName}:`,
            stockError
          );
          // Don't throw error for stock restoration failures - log and continue
          console.warn(
            `⚠️ Stock restoration failed but continuing with invoice deletion`
          );
        }
      }
    }

    // 4. Delete the sales record
    console.log('💼 Deleting sales record...');
    try {
      await executeOperation('sales', 'deleteOne', {
        invoiceId: invoice.invoiceNo,
      });
      console.log('✅ Sales record deleted');
    } catch (salesError: any) {
      console.error('❌ Failed to delete sales record:', salesError);
      throw new Error(`Failed to delete sales record: ${salesError.message}`);
    }

    // 5. Archive invoice data for audit purposes
    console.log('📁 Archiving invoice data...');
    try {
      await executeOperation('archivedInvoices', 'insertOne', {
        originalInvoice: invoice,
        deletedAt: new Date(),
        deletionReason: 'Invoice deleted by user',
        originalId: invoice._id,
        invoiceNo: invoice.invoiceNo,
      });
      console.log('✅ Invoice data archived');
    } catch (archiveError) {
      console.warn('⚠️ Failed to archive invoice data:', archiveError);
      // Don't fail the deletion if archiving fails
    }

    // 6. Delete the invoice
    console.log('🗑️ Deleting main invoice record...');
    try {
      await executeOperation('invoices', 'deleteOne', {
        _id: invoiceId,
      });
      console.log('✅ Main invoice record deleted');
    } catch (invoiceError: any) {
      console.error('❌ Failed to delete invoice:', invoiceError);
      throw new Error(`Failed to delete invoice: ${invoiceError.message}`);
    }

    console.log('🎉 Complete invoice deletion successful:', invoice.invoiceNo);

    return NextResponse.json({
      message: 'Invoice completely deleted and all related data reverted',
      deletedInvoiceNo: invoice.invoiceNo,
      actionsCompleted: [
        'Warranty data preserved',
        'Stock quantities restored',
        'Sales record deleted',
        'Invoice data archived',
        'Main invoice deleted',
      ],
    });
  } catch (err: any) {
    console.error('❌ Error during invoice deletion:', err);
    return NextResponse.json(
      {
        error: err.message,
        details: 'Invoice deletion failed. Please check the logs for details.',
      },
      { status: 500 }
    );
  }
}
