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

    // Fetch collections
    const [initialStockDocs, salesDocs, invoicesDocs, customers] =
      await Promise.all([
        db.collection('stock').find().toArray(),
        db.collection('sales').find().toArray(),
        db.collection('invoices').find().toArray(),
        db.collection('customers').find().toArray(),
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
          if (!sale.date) return false;
          const saleDate = new Date(sale.date);
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

    // PROFIT CALCULATION (SIMPLE - USING STORED COSTS)
    // Calculate total cost and profit using stored values from sales data
    const totalCost = filteredSalesForRevenue.reduce((sum, sale) => {
      return sum + toNumber(sale.totalCost || 0); // ← Use stored totalCost
    }, 0);

    const totalProfit = filteredSalesForRevenue.reduce((sum, sale) => {
      return sum + toNumber(sale.totalProfit || 0); // ← Use stored totalProfit
    }, 0);

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // TOP PRODUCTS
    const filteredSalesForTopProducts = Array.isArray(salesDocs)
      ? salesDocs.filter((sale: any) => {
          if (!sale.date) return false;
          const saleDate = new Date(sale.date);
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
    logger.debug(
      `📊 Total sales with products: ${filteredSalesForTopProducts.filter((sale) => Array.isArray(sale.products) && sale.products.length > 0).length}`
    );

    // Debug sales data structure
    if (filteredSalesForTopProducts.length > 0) {
      const sampleSale = filteredSalesForTopProducts[0];
      logger.debug('📊 Sample sale structure:', {
        customerName: sampleSale.customerName,
        date: sampleSale.date,
        productsCount: sampleSale.products?.length || 0,
        firstProduct: sampleSale.products?.[0]
          ? {
              brandName: sampleSale.products[0].brandName,
              series: sampleSale.products[0].series,
              batteryDetails: sampleSale.products[0].batteryDetails,
              quantity: sampleSale.products[0].quantity,
            }
          : null,
      });
    }

    const actualSalesCount: { [key: string]: number } = {};
    filteredSalesForTopProducts.forEach((sale: any) => {
      if (Array.isArray(sale.products)) {
        sale.products.forEach((product: any) => {
          // Handle different possible field names for brand and series
          const brandName =
            product.brandName || product.batteryDetails?.brandName || '';
          const series =
            product.series || product.batteryDetails?.name || 'Unknown';

          // Only count if we have valid brand and series
          if (brandName && series && series !== 'Unknown') {
            const normalizedSeries = normalizeSalesSeries(brandName, series);
            const normalizedKey = `${brandName}-${normalizedSeries}`;
            const quantity = toNumber(product.quantity);

            // Store only normalized key to avoid duplicates
            actualSalesCount[normalizedKey] =
              (actualSalesCount[normalizedKey] || 0) + quantity;

            logger.debug(
              `📊 Sales count for ${brandName}-${series}: ${quantity} (total: ${actualSalesCount[normalizedKey]})`
            );
          } else {
            logger.warning(
              `⚠️ Skipping invalid product: brandName="${brandName}", series="${series}"`
            );
          }
        });
      }
    });

    logger.debug('📊 Sales count summary:');
    const salesKeys = Object.keys(actualSalesCount);
    logger.debug(`📊 Total unique products sold: ${salesKeys.length}`);
    salesKeys.slice(0, 10).forEach((key) => {
      logger.debug(`📊 ${key}: ${actualSalesCount[key]} units sold`);
    });

    logger.debug('📦 Stock data structure check:');
    logger.debug(`📦 Total stock documents: ${stock.length}`);
    stock.slice(0, 3).forEach((doc, index) => {
      logger.debug(
        `📦 Stock doc ${index + 1}: brandName="${doc.brandName}", seriesStock count: ${doc.seriesStock?.length || 0}`
      );
      if (doc.seriesStock && doc.seriesStock.length > 0) {
        doc.seriesStock.slice(0, 2).forEach((series, sIndex) => {
          logger.debug(
            `  Series ${sIndex + 1}: series="${series.series}", inStock=${series.inStock}, soldCount=${series.soldCount}`
          );
        });
      }
    });

    const productSales = stock.reduce((sales: any[], document) => {
      if (!document.seriesStock || !Array.isArray(document.seriesStock))
        return sales;
      const documentBrandName = document.brandName || '';
      const documentSales = document.seriesStock
        .map((series) => {
          const seriesName = series.series || 'Unknown';
          const normalizedSeries = normalizeSalesSeries(
            documentBrandName,
            seriesName
          );
          const normalizedKey = `${documentBrandName}-${normalizedSeries}`;

          // Use only normalized key for consistent matching
          const actualSoldCount = actualSalesCount[normalizedKey] || 0;

          logger.debug(
            `🔍 Checking stock item: ${seriesName}, normalizedKey: ${normalizedKey}, actualSoldCount: ${actualSoldCount}, inStock: ${toNumber(series.inStock)}`
          );

          // Use calculated sales for date range, but fall back to stock soldCount if needed
          const stockSoldCount = validateSoldCount(series.soldCount);
          const dateRangeSoldCount = actualSoldCount || 0;

          // Prefer date range sales, but use stock soldCount if no sales in date range
          const finalSoldCount =
            dateRangeSoldCount > 0 ? dateRangeSoldCount : stockSoldCount;

          logger.debug(
            `🔍 Stock item ${seriesName}: stockSoldCount=${stockSoldCount}, dateRangeSoldCount=${dateRangeSoldCount}, finalSoldCount=${finalSoldCount}`
          );

          // Only include products that have been sold in the date range OR have historical sales
          if (finalSoldCount > 0) {
            return {
              brandName: documentBrandName,
              series: seriesName,
              soldCount: finalSoldCount,
              inStock: toNumber(series.inStock),
              isDateRangeData: dateRangeSoldCount > 0, // Flag to indicate if this is date range data
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries
      return [...sales, ...documentSales];
    }, []);
    const topSellingProducts = productSales
      .filter((product) => product.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    logger.debug(
      '🏆 Top selling products (date range + fallback to historical):'
    );

    logger.debug(
      `🏆 Top selling products calculated: ${topSellingProducts.length}`
    );
    topSellingProducts.forEach((product, index) => {
      const dataSource = product.isDateRangeData
        ? '📅 Date Range'
        : '📊 Historical';
      logger.debug(
        `  ${index + 1}. ${product.brandName} ${product.series}: ${product.soldCount} sold, ${product.inStock} in stock (${dataSource})`
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
    const salesTrend = [];
    const diffTime = Math.abs(
      salesTrendDateRange!.end.getTime() - salesTrendDateRange!.start.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 0; i < diffDays; i++) {
      const date = new Date(salesTrendDateRange!.start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dailySales = Array.isArray(salesDocs)
        ? salesDocs.filter((sale: any) => {
            if (!sale.date) return false;
            const saleDate = new Date(sale.date).toISOString().split('T')[0];
            return saleDate === dateStr;
          })
        : [];
      const dailyRevenue = dailySales.reduce(
        (sum: number, sale: any) => sum + toNumber(sale.totalAmount),
        0
      );
      salesTrend.push({
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        sales: dailySales.length,
        revenue: dailyRevenue,
      });
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
      totalCustomers: Array.isArray(customers) ? customers.length : 0,
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
