import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { NextRequest } from 'next/server';
import logger from '@/utils/logger';

interface SeriesStockItem {
  series: string;
  productCost: number;
  inStock: number;
  soldCount?: number | string;
}

interface StockItem {
  _id: string;
  brandName: string;
  seriesStock: SeriesStockItem[];
}

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to validate and fix soldCount data
const validateSoldCount = (soldCount: any): number => {
  const num = toNumber(soldCount);
  if (num < 0) {
    logger.warning(
      `⚠️ Negative soldCount detected: ${soldCount}, setting to 0`
    );
    return 0;
  }
  return num;
};

// Series normalization function for consistent matching
const normalizeSeriesForMatching = (series: string): string => {
  return String(series || '')
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/\s*\(\s*/g, ' (') // Add space before opening parenthesis
    .replace(/\s*\)\s*/g, ') ') // Add space after closing parenthesis
    .replace(/\s*\/\s*/g, '/') // Fix spaces around slashes
    .replace(/\s+/g, ' ') // Clean up any new multiple spaces
    .replace(/thin\/thick/g, 'thinthick') // Handle Thin/Thick vs ThinThick
    .replace(/\s+/g, ' ') // Clean up any new multiple spaces
    .trim();
};

// Enhanced normalization for sales data (handles brand prefix)
const normalizeSalesSeries = (brandName: string, series: string): string => {
  let cleanSeries = series;

  // Remove brand prefix if present
  if (
    brandName &&
    cleanSeries.toLowerCase().startsWith(brandName.toLowerCase())
  ) {
    cleanSeries = cleanSeries.substring(brandName.length).trim();
  }

  return String(cleanSeries || '')
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/\s*\(\s*/g, ' (') // Add space before opening parenthesis
    .replace(/\s*\)\s*/g, ') ') // Add space after closing parenthesis
    .replace(/\s*\/\s*/g, '/') // Fix spaces around slashes
    .replace(/\s+/g, ' ') // Clean up any new multiple spaces
    .replace(/thin\/thick/g, 'thinthick') // Handle Thin/Thick vs ThinThick
    .replace(/\s+/g, ' ') // Clean up any new multiple spaces
    .trim();
};

// Helper function to safely extract sale date from multiple possible field names
const getSaleDate = (sale: any): Date | null => {
  const raw =
    sale?.date || sale?.createdDate || sale?.saleDate || sale?.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

// Helper function to verify sales-stock synchronization
const verifySalesStockSync = (salesData: any[], stockData: any[]) => {
  logger.debug('🔍 Starting sales-stock sync verification...');

  const syncIssues: any[] = [];
  const syncSummary = {
    totalProducts: 0,
    syncedProducts: 0,
    mismatchedProducts: 0,
    missingInSales: 0,
    missingInStock: 0,
  };

  // Create a map of stock data for quick lookup
  const stockMap = new Map();
  stockData.forEach((stockDoc) => {
    if (stockDoc.seriesStock && Array.isArray(stockDoc.seriesStock)) {
      stockDoc.seriesStock.forEach((series: any) => {
        const normalizedSeries = normalizeSeriesForMatching(series.series);
        const normalizedKey = `${stockDoc.brandName}-${normalizedSeries}`;

        // Store only normalized key to avoid duplicates
        stockMap.set(normalizedKey, {
          brandName: stockDoc.brandName,
          series: series.series,
          stockSoldCount: validateSoldCount(series.soldCount),
          inStock: toNumber(series.inStock),
          normalizedSeries: normalizedSeries,
        });
      });
    }
  });

  // Calculate actual sales from sales data
  const salesMap = new Map();
  salesData.forEach((sale) => {
    if (Array.isArray(sale.products)) {
      sale.products.forEach((product: any) => {
        const brandName =
          product.brandName || product.batteryDetails?.brandName || '';
        const series = product.series || product.batteryDetails?.name || '';

        if (brandName && series) {
          const normalizedSeries = normalizeSalesSeries(brandName, series);
          const normalizedKey = `${brandName}-${normalizedSeries}`;
          const quantity = toNumber(product.quantity);

          // Store only normalized key to avoid duplicates
          if (salesMap.has(normalizedKey)) {
            salesMap.set(normalizedKey, salesMap.get(normalizedKey) + quantity);
          } else {
            salesMap.set(normalizedKey, quantity);
          }
        }
      });
    }
  });

  // Compare stock soldCount with actual sales
  stockMap.forEach((stockItem, normalizedKey) => {
    syncSummary.totalProducts++;

    // Use normalized key directly since we only store normalized keys
    const actualSales = salesMap.get(normalizedKey) || 0;
    const stockSoldCount = stockItem.stockSoldCount;

    if (Math.abs(actualSales - stockSoldCount) > 0) {
      syncSummary.mismatchedProducts++;
      syncIssues.push({
        product: normalizedKey,
        brandName: stockItem.brandName,
        series: stockItem.series,
        stockSoldCount,
        actualSales,
        difference: actualSales - stockSoldCount,
        inStock: stockItem.inStock,
        issue:
          actualSales > stockSoldCount
            ? 'Stock undercounted'
            : 'Stock overcounted',
      });

      logger.warning(
        `❌ Sync issue: ${normalizedKey} - Sold Count: ${stockSoldCount}, Sales: ${actualSales}, Diff: ${actualSales - stockSoldCount}`
      );
    } else {
      syncSummary.syncedProducts++;
      logger.success(
        `✅ Synced: ${normalizedKey} - Sold Count: ${stockSoldCount}, Sales: ${actualSales}`
      );
    }
  });

  // Check for products in sales but not in stock
  salesMap.forEach((salesCount, key) => {
    // Use only normalized keys for consistent matching
    const stockItem = stockMap.get(key);

    if (!stockItem) {
      syncSummary.missingInStock++;
      syncIssues.push({
        product: key,
        actualSales: salesCount,
        stockSoldCount: 0,
        difference: salesCount,
        issue: 'Product in sales but missing from stock',
      });
      logger.warning(`❌ Missing in stock: ${key} - Sales: ${salesCount}`);
    }
  });

  // Check for products in stock but no sales
  stockMap.forEach((stockItem, key) => {
    if (!salesMap.has(key) && stockItem.stockSoldCount > 0) {
      syncSummary.missingInSales++;
      syncIssues.push({
        product: key,
        brandName: stockItem.brandName,
        series: stockItem.series,
        stockSoldCount: stockItem.stockSoldCount,
        actualSales: 0,
        difference: -stockItem.stockSoldCount,
        inStock: stockItem.inStock,
        issue: 'Product in stock with soldCount but no sales records',
      });
      logger.warning(
        `❌ Missing in sales: ${key} - Stock soldCount: ${stockItem.stockSoldCount}`
      );
    }
  });

  logger.info('📊 Sales-Stock Sync Summary', syncSummary);
  logger.info(`🔍 Found ${syncIssues.length} sync issues`);

  return {
    syncSummary,
    syncIssues,
    isFullySynced: syncIssues.length === 0,
  };
};

export async function GET(request: NextRequest) {
  try {
    logger.info('🔄 Starting dashboard data fetch...');
    const db = await connectToMongoDB();
    if (!db) {
      logger.error('❌ Failed to connect to MongoDB');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Parse URL parameters for date filtering
    const { searchParams } = new URL(request.url);
    const revenueStart = searchParams.get('revenueStart');
    const revenueEnd = searchParams.get('revenueEnd');
    const topProductsStart = searchParams.get('topProductsStart');
    const topProductsEnd = searchParams.get('topProductsEnd');
    const salesTrendStart = searchParams.get('salesTrendStart');
    const salesTrendEnd = searchParams.get('salesTrendEnd');

    logger.success('✅ Connected to MongoDB, fetching essential data...');

    // Fetch collections with targeted projections for high performance
    const [
      initialStockDocs,
      salesDocs,
      invoicesDocs,
      customerCount,
      stockHistoryDocs,
    ] = await Promise.all([
      db.collection('stock').find().toArray(),
      db.collection('sales').find().toArray(),
      db
        .collection('invoices')
        .find(
          {
            status: { $ne: 'voided' },
            paymentStatus: { $in: ['pending', 'partial'] },
          },
          {
            projection: {
              status: 1,
              paymentStatus: 1,
              totalAmount: 1,
              receivedAmount: 1,
              batteriesRate: 1,
              additionalPayment: 1,
              products: 1,
              remainingAmount: 1,
            },
          }
        )
        .toArray(),
      db.collection('customers').countDocuments(),
      db
        .collection('stockHistory')
        .find(
          {},
          {
            projection: {
              brandName: 1,
              series: 1,
              newCost: 1,
              historyDate: 1,
            },
          }
        )
        .sort({ historyDate: 1 })
        .toArray(),
    ]);

    let stockDocs = initialStockDocs;
    let stock = stockDocs as unknown as StockItem[];

    // VERIFY SALES-STOCK SYNCHRONIZATION
    // let syncVerification = verifySalesStockSync(salesDocs, stock);
    // let reconciliationResult: any = null;

    // if (syncVerification.syncIssues.length > 0) {
    //   try {
    //     const origin = request.nextUrl.origin;
    //     const fixResponse = await fetch(`${origin}/api/dashboard/fix-sync`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       cache: 'no-store',
    //     });

    //     if (fixResponse.ok) {
    //       reconciliationResult = await fixResponse.json();

    //       if (reconciliationResult?.updated > 0) {
    //         logger.info(
    //           `🔧 Reconciled ${reconciliationResult.updated} stock records. Refreshing dashboard data...`
    //         );

    //         stockDocs = await db.collection('stock').find().toArray();
    //         stock = stockDocs as unknown as StockItem[];
    //         syncVerification = verifySalesStockSync(salesDocs, stock);
    //       } else {
    //         logger.info('ℹ️ Fix-sync API returned no updates.');
    //       }
    //     } else {
    //       const errorText = await fixResponse.text();
    //       logger.error(
    //         `❌ Failed to reconcile stock via fix-sync API. Status: ${fixResponse.status}. Body: ${errorText}`
    //       );
    //     }
    //   } catch (error) {
    //     logger.error('❌ Error calling fix-sync API:', error);
    //   }
    // }

    // Default sync verification for dashboard response
    const syncVerification = {
      syncSummary: {
        totalProducts: 0,
        syncedProducts: 0,
        mismatchedProducts: 0,
        missingInSales: 0,
        missingInStock: 0,
      },
      syncIssues: [],
      isFullySynced: true,
    };
    const reconciliationResult = null;

    // INVENTORY METRICS
    let totalProducts = 0;
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    stock.forEach((document) => {
      if (Array.isArray(document.seriesStock)) {
        document.seriesStock.forEach((series) => {
          const inStock = toNumber(series.inStock);
          const productCost = toNumber(series.productCost);
          const itemValue = inStock * productCost;
          totalProducts += inStock;
          totalInventoryValue += itemValue;
          if (inStock === 0) outOfStockCount++;
          else if (inStock < 10) lowStockCount++;
        });
      }
    });

    // Exclude charging service invoices from affecting inventory counts
    // Charging services don't represent physical inventory items

    // DATE RANGES
    let revenueDateRange = null;
    let topProductsDateRange = null;
    let salesTrendDateRange = null;

    if (revenueStart && revenueEnd) {
      revenueDateRange = {
        start: new Date(revenueStart),
        end: new Date(revenueEnd),
      };
    } else {
      const today = new Date();
      const thirtyDaysAgo = new Date(
        today.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      revenueDateRange = { start: thirtyDaysAgo, end: today };
    }
    if (topProductsStart && topProductsEnd) {
      topProductsDateRange = {
        start: new Date(topProductsStart),
        end: new Date(topProductsEnd),
      };
    } else {
      topProductsDateRange = revenueDateRange;
    }
    if (salesTrendStart && salesTrendEnd) {
      salesTrendDateRange = {
        start: new Date(salesTrendStart),
        end: new Date(salesTrendEnd),
      };
    } else {
      const today = new Date();
      const fourteenDaysAgo = new Date(
        today.getTime() - 14 * 24 * 60 * 60 * 1000
      );
      salesTrendDateRange = { start: fourteenDaysAgo, end: today };
    }

    // REVENUE SALES FILTERING
    const filteredSalesForRevenue = Array.isArray(salesDocs)
      ? salesDocs.filter((sale: any) => {
          const saleDate = getSaleDate(sale);
          if (!saleDate) return false;
          return (
            saleDate >= revenueDateRange!.start &&
            saleDate <= revenueDateRange!.end
          );
        })
      : [];

    const totalSales = filteredSalesForRevenue.length;
    const totalRevenue = filteredSalesForRevenue.reduce(
      (sum: number, sale: any) => {
        return sum + toNumber(sale.totalAmount);
      },
      0
    );

    // Build fast in-memory map of historical costs: "normalizedBrand:::normalizedSeries" -> [{ time: timestamp, cost: number }]
    const historyCostMap = new Map<string, Array<{ time: number; cost: number }>>();

    if (Array.isArray(stockHistoryDocs)) {
      stockHistoryDocs.forEach((doc: any) => {
        const rawBrand = (doc.brandName || '').trim();
        const rawSeries = (doc.series || '').trim();
        const cost = toNumber(doc.newCost);
        const rawDate = doc.historyDate;
        if (!rawBrand || !rawSeries || cost <= 0 || !rawDate) return;

        const dateObj = new Date(rawDate);
        if (isNaN(dateObj.getTime())) return;

        const normBrand = rawBrand.toLowerCase();
        const normSeries = normalizeSalesSeries(rawBrand, rawSeries);
        const key = `${normBrand}:::${normSeries}`;

        const existing = historyCostMap.get(key) || [];
        existing.push({ time: dateObj.getTime(), cost });
        historyCostMap.set(key, existing);
      });
    }

    // Build fast lookup map from current stock: "normalizedBrand:::normalizedSeries" -> stock info
    const stockLookup = new Map<
      string,
      { inStock: number; brandName: string; series: string; productCost?: number }
    >();

    stock.forEach((document) => {
      const documentBrandName = (document.brandName || '').trim();
      const normalizedBrand = documentBrandName.toLowerCase();

      if (Array.isArray(document.seriesStock)) {
        document.seriesStock.forEach((seriesItem: any) => {
          const seriesName = (seriesItem.series || '').trim();
          const normalizedSeries = normalizeSalesSeries(
            documentBrandName,
            seriesName
          );
          const key = `${normalizedBrand}:::${normalizedSeries}`;
          const inStock = toNumber(seriesItem.inStock);

          stockLookup.set(key, {
            inStock,
            brandName: documentBrandName,
            series: seriesName,
            productCost: toNumber(seriesItem.productCost),
          });
        });
      }
    });

    const getHistoricalProductCost = (
      brandName: string,
      series: string,
      saleDate: Date
    ): number => {
      const normBrand = (brandName || '').trim().toLowerCase();
      const normSeries = normalizeSalesSeries(normBrand, (series || '').trim());
      const key = `${normBrand}:::${normSeries}`;

      // 1. Check stockHistory (most recent entry on or before saleDate)
      const historyList = historyCostMap.get(key);
      if (historyList && historyList.length > 0) {
        const saleTime = saleDate.getTime();
        for (let i = historyList.length - 1; i >= 0; i--) {
          if (historyList[i].time <= saleTime && historyList[i].cost > 0) {
            return historyList[i].cost;
          }
        }
        // If saleDate was before first recorded history entry, use earliest known cost
        if (historyList[0].cost > 0) {
          return historyList[0].cost;
        }
      }

      // 2. Fallback to current stock series productCost
      const stockMatch = stockLookup.get(key);
      if (stockMatch && (stockMatch.productCost || 0) > 0) {
        return stockMatch.productCost!;
      }

      return 0;
    };

    // PROFIT CALCULATION (USING STORED PROFITS WITH DYNAMIC HISTORICAL STOCK COST FALLBACK)
    let totalCost = 0;
    let totalProfit = 0;

    filteredSalesForRevenue.forEach((sale: any) => {
      // 1. Charging service: pure service fee, 0 inventory cost, 100% margin
      if (sale.isChargingService) {
        totalProfit += toNumber(sale.totalAmount);
        return;
      }

      // 2. Scrap battery
      if (sale.isScrapBattery) {
        totalProfit += toNumber(sale.totalProfit || 0);
        totalCost += toNumber(sale.totalCost || 0);
        return;
      }

      // 3. Stored totalProfit & totalCost on sale (from modern invoices)
      const storedProfit = toNumber(sale.totalProfit);
      const storedCost = toNumber(sale.totalCost);
      if (storedProfit > 0 && storedCost > 0) {
        totalProfit += storedProfit;
        totalCost += storedCost;
        return;
      }

      // 4. Historical sales: compute dynamically using products array and stockHistory
      const saleDate = getSaleDate(sale) || new Date();
      const products =
        Array.isArray(sale.products) && sale.products.length > 0
          ? sale.products
          : sale.brandName && sale.series
            ? [sale]
            : [];

      let saleCalculatedProfit = 0;
      let saleCalculatedCost = 0;
      let hasCalculatedItem = false;

      products.forEach((product: any) => {
        if (product.isChargingService) {
          saleCalculatedProfit += toNumber(
            product.totalPrice || product.productPrice || 0
          );
          return;
        }
        if (product.isScrapBattery) return;

        const qty = toNumber(product.quantity) || 1;
        const sellingPrice =
          toNumber(product.productPrice) ||
          toNumber(product.unitPrice) ||
          (qty > 0 && product.totalPrice
            ? toNumber(product.totalPrice) / qty
            : 0);

        // If product itself already has profit stored:
        if (
          product.profit !== undefined &&
          product.profit !== null &&
          !isNaN(Number(product.profit)) &&
          Number(product.profit) > 0
        ) {
          saleCalculatedProfit += toNumber(product.profit);
          saleCalculatedCost += toNumber(product.costPrice || 0) * qty;
          hasCalculatedItem = true;
          return;
        }

        // Find unit cost: from product.costPrice OR historical stock cost
        let unitCost = toNumber(product.costPrice);
        if (unitCost <= 0) {
          unitCost = getHistoricalProductCost(
            product.brandName ||
              product.batteryDetails?.brandName ||
              sale.brandName ||
              '',
            product.series ||
              product.batteryDetails?.name ||
              sale.series ||
              '',
            saleDate
          );
        }

        if (unitCost > 0) {
          const lineCost = unitCost * qty;
          const lineRevenue = sellingPrice * qty;
          saleCalculatedCost += lineCost;
          saleCalculatedProfit += lineRevenue - lineCost;
          hasCalculatedItem = true;
        } else {
          if (storedProfit > 0) {
            saleCalculatedProfit += storedProfit;
            hasCalculatedItem = true;
          }
        }
      });

      if (hasCalculatedItem && saleCalculatedCost > 0) {
        totalProfit += saleCalculatedProfit;
        totalCost += saleCalculatedCost;
      } else if (storedProfit > 0) {
        totalProfit += storedProfit;
        totalCost += storedCost;
      } else {
        totalCost += storedCost;
        totalProfit += storedProfit;
      }
    });

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // TOP PRODUCTS FILTERING
    const filteredSalesForTopProducts = Array.isArray(salesDocs)
      ? salesDocs.filter((sale: any) => {
          if (sale.isChargingService || sale.isScrapBattery) return false;
          const saleDate = getSaleDate(sale);
          if (!saleDate) return false;
          return (
            saleDate >= topProductsDateRange!.start &&
            saleDate <= topProductsDateRange!.end
          );
        })
      : [];

    logger.debug(
      `📅 Top products date range: ${topProductsDateRange!.start.toISOString()} to ${topProductsDateRange!.end.toISOString()}`
    );
    logger.debug(
      `📊 Total sales in date range: ${filteredSalesForTopProducts.length}`
    );

    // Aggregate sales strictly from the filtered sales for the chosen date range
    const salesAggMap = new Map<
      string,
      { brandName: string; series: string; soldCount: number }
    >();

    filteredSalesForTopProducts.forEach((sale: any) => {
      // Handle both invoice products array and direct sales documents
      const products =
        Array.isArray(sale.products) && sale.products.length > 0
          ? sale.products
          : sale.brandName && sale.series
            ? [sale]
            : [];

      products.forEach((product: any) => {
        // Exclude charging services and scrap batteries
        if (product.isChargingService || product.isScrapBattery) return;

        const rawBrand = (
          product.brandName ||
          product.batteryDetails?.brandName ||
          ''
        ).trim();
        const rawSeries = (
          product.series ||
          product.batteryDetails?.name ||
          ''
        ).trim();

        if (!rawBrand || !rawSeries || rawSeries.toLowerCase() === 'unknown') {
          return;
        }

        const normalizedBrand = rawBrand.toLowerCase();
        const normalizedSeries = normalizeSalesSeries(rawBrand, rawSeries);
        const key = `${normalizedBrand}:::${normalizedSeries}`;
        const quantity = toNumber(product.quantity) || 1;

        const existing = salesAggMap.get(key);
        if (existing) {
          existing.soldCount += quantity;
        } else {
          const stockMatch = stockLookup.get(key);
          salesAggMap.set(key, {
            brandName: stockMatch?.brandName || rawBrand,
            series: stockMatch?.series || rawSeries,
            soldCount: quantity,
          });
        }
      });
    });

    // Convert aggregated sales to product array with current stock
    let topSellingProducts = Array.from(salesAggMap.entries())
      .map(([key, item]) => {
        const stockInfo = stockLookup.get(key);
        return {
          brandName: item.brandName,
          series: item.series,
          soldCount: item.soldCount,
          inStock: stockInfo ? stockInfo.inStock : 0,
        };
      })
      .filter((product) => product.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    // Fallback ONLY IF the entire sales collection has zero documents across the entire system
    if (
      topSellingProducts.length === 0 &&
      (!salesDocs || salesDocs.length === 0)
    ) {
      const historicalSales: any[] = [];
      stock.forEach((document) => {
        const brandName = document.brandName || '';
        if (Array.isArray(document.seriesStock)) {
          document.seriesStock.forEach((seriesItem: any) => {
            const count = validateSoldCount(seriesItem.soldCount);
            if (count > 0) {
              historicalSales.push({
                brandName,
                series: seriesItem.series || 'Unknown',
                soldCount: count,
                inStock: toNumber(seriesItem.inStock),
              });
            }
          });
        }
      });
      topSellingProducts = historicalSales
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5);
    }

    logger.debug(
      `🏆 Top selling products calculated for date range: ${topSellingProducts.length}`
    );
    topSellingProducts.forEach((product, index) => {
      logger.debug(
        `  ${index + 1}. ${product.brandName} ${product.series}: ${product.soldCount} sold, ${product.inStock} in stock`
      );
    });

    // PENDING PAYMENTS
    const totalPending = Array.isArray(invoicesDocs)
      ? invoicesDocs.reduce((sum: number, invoice: any) => {
          // Exclude voided invoices
          if (invoice.status === 'voided') {
            return sum;
          }

          // Calculate totalAmount same as frontend (fetchInvoicesAtom)
          const calculateTotalAmount = (): number => {
            if (
              invoice.totalAmount &&
              typeof invoice.totalAmount === 'number'
            ) {
              return invoice.totalAmount;
            }
            if (invoice.products && Array.isArray(invoice.products)) {
              return invoice.products.reduce((s: number, product: any) => {
                return (
                  s +
                  (typeof product.totalPrice === 'number'
                    ? product.totalPrice
                    : 0)
                );
              }, 0);
            }
            return (
              toNumber(invoice.remainingAmount) +
              toNumber(invoice.receivedAmount)
            );
          };

          const total = calculateTotalAmount();
          const received = toNumber(invoice.receivedAmount);
          const batteryRate = toNumber(invoice.batteriesRate);
          const additionalPayments = (invoice.additionalPayment || []).reduce(
            (s: number, payment: any) => s + toNumber(payment.amount),
            0
          );
          const totalReceived = received + batteryRate + additionalPayments;
          const actualRemaining = total - totalReceived;

          // Only include pending or partial invoices
          let actualStatus: 'pending' | 'partial' | 'paid';
          // Check if any actual payment was received (excluding battery rate)
          const actualPaymentsReceived = received + additionalPayments;
          if (actualPaymentsReceived === 0) {
            actualStatus = 'pending';
          } else if (actualRemaining > 0) {
            actualStatus = 'partial';
          } else {
            actualStatus = 'paid';
          }

          if (actualStatus === 'pending' || actualStatus === 'partial') {
            return sum + Math.max(0, actualRemaining);
          }
          return sum;
        }, 0)
      : 0;

    // SALES TREND
    const salesByDay = new Map<string, { count: number; revenue: number }>();
    if (Array.isArray(salesDocs)) {
      salesDocs.forEach((sale: any) => {
        if (sale.isChargingService || sale.isScrapBattery) return;
        const saleDate = getSaleDate(sale);
        if (!saleDate) return;
        const dayKey = saleDate.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Karachi',
        });
        const existing = salesByDay.get(dayKey) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += toNumber(sale.totalAmount);
        salesByDay.set(dayKey, existing);
      });
    }

    const salesTrend = [];
    const currentTrendDate = new Date(salesTrendDateRange!.start);
    currentTrendDate.setHours(0, 0, 0, 0);
    const endTrendBoundary = new Date(salesTrendDateRange!.end);
    endTrendBoundary.setHours(23, 59, 59, 999);

    while (currentTrendDate <= endTrendBoundary) {
      const dayKey = currentTrendDate.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Karachi',
      });
      const label = currentTrendDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Karachi',
        month: 'short',
        day: 'numeric',
      });
      const entry = salesByDay.get(dayKey) || { count: 0, revenue: 0 };

      salesTrend.push({
        date: label,
        fullDate: dayKey,
        sales: entry.count,
        revenue: entry.revenue,
      });

      currentTrendDate.setDate(currentTrendDate.getDate() + 1);
    }

    // INVENTORY BY BRAND
    const brandInventory: {
      [key: string]: { value: number; products: number };
    } = {};
    stock.forEach((document) => {
      const brandName = document.brandName || 'Generic';
      if (!brandInventory[brandName]) {
        brandInventory[brandName] = { value: 0, products: 0 };
      }
      if (Array.isArray(document.seriesStock)) {
        document.seriesStock.forEach((series) => {
          const inStock = toNumber(series.inStock);
          const productCost = toNumber(series.productCost);
          brandInventory[brandName].value += inStock * productCost;
          brandInventory[brandName].products += inStock;
        });
      }
    });
    const inventoryByBrand = Object.entries(brandInventory).map(
      ([brand, data]) => ({
        brand,
        value: data.value,
        products: data.products,
      })
    );

    // BUILD FINAL RESPONSE
    const dashboardStats = {
      totalProducts,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      totalSales,
      totalRevenue,
      averageOrderValue:
        totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
      totalProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      totalPending,
      totalCustomers: typeof customerCount === 'number' ? customerCount : 0,
      topSellingProducts,
      salesTrend,
      inventoryByBrand,
      syncVerification, // Add sync verification data
      reconciliationResult,
      alerts: {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        pendingPayments: totalPending > 0 ? totalPending : 0,
        syncIssues:
          syncVerification.syncIssues.length > 0
            ? syncVerification.syncIssues.length
            : 0,
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    logger.error('❌ Error in dashboard route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
