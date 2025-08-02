import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { NextRequest } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting dashboard data fetch...');
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to MongoDB');
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

    console.log('✅ Connected to MongoDB, fetching essential data...');

    // Fetch collections
    const [stockDocs, salesDocs, invoicesDocs, customers] = await Promise.all([
      db.collection('stock').find().toArray(),
      db.collection('sales').find().toArray(),
      db.collection('invoices').find().toArray(),
      db.collection('customers').find().toArray(),
    ]);

    const stock = stockDocs as unknown as StockItem[];

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

    // PROFIT CALCULATION (NEW!)
    // Build a lookup for stock cost per (brand+series)
    const stockCostLookup: Record<string, number> = {};
    stock.forEach((stockItem) => {
      const brand = stockItem.brandName || '';
      if (Array.isArray(stockItem.seriesStock)) {
        stockItem.seriesStock.forEach((series) => {
          const key = `${brand}|||${series.series}`;
          stockCostLookup[key] = toNumber(series.productCost);
        });
      }
    });
    // Calculate total cost for products sold in period
    const totalCost = filteredSalesForRevenue.reduce((sum, sale) => {
      if (!Array.isArray(sale.products)) return sum;
      const saleCost = sale.products.reduce((prodSum, product) => {
        const key = `${product.brandName || ''}|||${product.series || ''}`;
        const unitCost = stockCostLookup[key] || 0;
        const qty = toNumber(product.quantity);
        return prodSum + unitCost * qty;
      }, 0);
      return sum + saleCost;
    }, 0);
    const totalProfit = totalRevenue - totalCost;
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

    const actualSalesCount: { [key: string]: number } = {};
    filteredSalesForTopProducts.forEach((sale: any) => {
      if (Array.isArray(sale.products)) {
        sale.products.forEach((product: any) => {
          const brandName = product.brandName || '';
          const series = product.series || 'Unknown';
          const key = `${brandName}-${series}`;
          const quantity = toNumber(product.quantity);
          actualSalesCount[key] = (actualSalesCount[key] || 0) + quantity;
        });
      }
    });
    const productSales = stock.reduce((sales: any[], document) => {
      if (!document.seriesStock || !Array.isArray(document.seriesStock))
        return sales;
      const documentBrandName = document.brandName || '';
      const documentSales = document.seriesStock.map((series) => {
        const seriesName = series.series || 'Unknown';
        const key = `${documentBrandName}-${seriesName}`;
        const actualSoldCount = actualSalesCount[key] || 0;
        return {
          brandName: documentBrandName,
          series: seriesName,
          soldCount: actualSoldCount,
          inStock: toNumber(series.inStock),
        };
      });
      return [...sales, ...documentSales];
    }, []);
    const topSellingProducts = productSales
      .filter((product) => product.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    // PENDING PAYMENTS
    const totalPending = Array.isArray(invoicesDocs)
      ? invoicesDocs.reduce((sum: number, invoice: any) => {
          return sum + toNumber(invoice.remainingAmount);
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
      alerts: {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        pendingPayments: totalPending > 0 ? totalPending : 0,
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('❌ Error in dashboard route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
