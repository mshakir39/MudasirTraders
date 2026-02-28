'use server';
import { executeOperation } from '@/app/libs/executeOperation';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export async function getDashboardStats() {
  try {
    // Get total sales
    const sales = await executeOperation('sales', 'findAll');
    const totalSales = Array.isArray(sales)
      ? sales.reduce(
          (sum: number, sale: any) => sum + (sale.totalAmount || 0),
          0
        )
      : 0;

    // Get total customers
    const customers = await executeOperation('customers', 'findAll');
    const totalCustomers = Array.isArray(customers) ? customers.length : 0;

    // Get total stock items
    const stock = await executeOperation('stock', 'findAll');
    const totalStockItems = Array.isArray(stock)
      ? stock.reduce((sum: number, item: any) => {
          if (item.seriesStock && Array.isArray(item.seriesStock)) {
            return (
              sum +
              item.seriesStock.reduce(
                (itemSum: number, series: any) =>
                  itemSum + (parseInt(series.inStock) || 0),
                0
              )
            );
          }
          return sum;
        }, 0)
      : 0;

    // Get total invoices and exclude charging service invoices from stock calculations
    // Charging services don't represent physical inventory items

    // Get total invoices
    const invoices = await executeOperation('invoices', 'findAll');
    const totalInvoices = Array.isArray(invoices) ? invoices.length : 0;

    // Get recent sales (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSales = Array.isArray(sales)
      ? sales.filter(
          (sale: any) => new Date(sale.date || sale.saleDate) >= sevenDaysAgo
        )
      : [];

    // Get top selling products (exclude charging services)
    const productSales = Array.isArray(sales)
      ? sales.reduce((acc: any, sale: any) => {
          // Skip charging service invoices from product sales calculations
          if (sale.isChargingService || sale.isScrapBattery) {
            return acc;
          }

          const key = `${sale.brandName}-${sale.series}`;
          if (!acc[key]) {
            acc[key] = {
              brandName: sale.brandName,
              series: sale.series,
              totalQuantity: 0,
              totalRevenue: 0,
            };
          }
          acc[key].totalQuantity += sale.quantity || 0;
          acc[key].totalRevenue += sale.totalAmount || 0;
          return acc;
        }, {})
      : {};

    const topSellingProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    return {
      success: true,
      data: {
        totalSales,
        totalCustomers,
        totalStockItems,
        totalInvoices,
        recentSales: recentSales.length,
        topSellingProducts,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getChargingStats(startDate?: Date, endDate?: Date) {
  try {
    const sales = await executeOperation('sales', 'findAll');
    const invoices = await executeOperation('invoices', 'findAll');

    // Filter charging service invoices
    const chargingSales = Array.isArray(sales)
      ? sales.filter(
          (sale: any) => sale.isChargingService || sale.isScrapBattery
        )
      : [];

    // Filter by date range if provided
    const filteredChargingSales =
      startDate && endDate
        ? chargingSales.filter((sale: any) => {
            const saleDate = new Date(sale.date || sale.saleDate);
            return saleDate >= startDate && saleDate <= endDate;
          })
        : chargingSales;

    // Calculate charging statistics
    const totalChargingRevenue = filteredChargingSales.reduce(
      (sum: number, sale: any) => sum + (sale.totalAmount || 0),
      0
    );

    const totalChargingServices = filteredChargingSales.length;

    const averageChargingAmount =
      totalChargingServices > 0
        ? totalChargingRevenue / totalChargingServices
        : 0;

    const chargingInvoices = Array.isArray(invoices)
      ? invoices.filter((invoice: any) => {
          const products = Array.isArray(invoice?.products)
            ? invoice.products
            : [];
          return products.some(
            (p: any) =>
              p?.isChargingService === true ||
              p?.isScrapBattery === true ||
              String(p?.brandName || '').toLowerCase() === 'charging service'
          );
        })
      : [];

    const filteredChargingInvoices =
      startDate && endDate
        ? chargingInvoices.filter((invoice: any) => {
            const invoiceDate = new Date(invoice.createdDate || invoice.date);
            return invoiceDate >= startDate && invoiceDate <= endDate;
          })
        : chargingInvoices;

    const pendingChargingInvoices = filteredChargingInvoices.filter(
      (invoice: any) => {
        const remaining = Number(invoice?.remainingAmount ?? 0);
        const isPayLater = invoice?.isPayLater === true;
        return isPayLater || (!isNaN(remaining) && remaining > 0);
      }
    );

    const pendingChargingAmount = pendingChargingInvoices.reduce(
      (sum: number, invoice: any) => {
        const remaining = Number(invoice?.remainingAmount ?? 0);
        return sum + (isNaN(remaining) ? 0 : remaining);
      },
      0
    );

    const pendingChargingCount = pendingChargingInvoices.length;

    return {
      success: true,
      data: {
        totalChargingRevenue,
        totalChargingServices,
        averageChargingAmount,
        pendingChargingAmount,
        pendingChargingCount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getChargingTrend(startDate: Date, endDate: Date) {
  try {
    const sales = await executeOperation('sales', 'findAll');

    // Filter charging service invoices
    const chargingSales = Array.isArray(sales)
      ? sales.filter(
          (sale: any) => sale.isChargingService || sale.isScrapBattery
        )
      : [];

    // Group by date
    const chargingSalesByDate = chargingSales.reduce((acc: any, sale: any) => {
      const date = new Date(sale.date || sale.saleDate)
        .toISOString()
        .split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          chargingRevenue: 0,
          chargingServices: 0,
        };
      }
      acc[date].chargingRevenue += sale.totalAmount || 0;
      acc[date].chargingServices += 1;
      return acc;
    }, {});

    // Filter by date range and sort
    const chargingTrend = Object.values(chargingSalesByDate)
      .filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    return { success: true, data: chargingTrend };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesTrend(startDate: Date, endDate: Date) {
  try {
    const sales = await executeOperation('sales', 'find', {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Group sales by date
    const salesByDate = Array.isArray(sales)
      ? sales.reduce((acc: any, sale: any) => {
          const date = new Date(sale.date || sale.saleDate)
            .toISOString()
            .split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, totalAmount: 0, count: 0 };
          }
          acc[date].totalAmount += sale.totalAmount || 0;
          acc[date].count += 1;
          return acc;
        }, {})
      : {};

    const salesTrend = Object.values(salesByDate).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { success: true, data: salesTrend };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventoryByBrand() {
  try {
    const stock = await executeOperation('stock', 'findAll');

    const inventoryByBrand = Array.isArray(stock)
      ? stock.map((item: any) => {
          const totalStock =
            item.seriesStock && Array.isArray(item.seriesStock)
              ? item.seriesStock.reduce(
                  (sum: number, series: any) =>
                    sum + (parseInt(series.inStock) || 0),
                  0
                )
              : 0;

          return {
            brandName: item.brandName,
            totalStock,
            seriesCount: item.seriesStock ? item.seriesStock.length : 0,
          };
        })
      : [];

    return { success: true, data: inventoryByBrand };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unlockDashboard() {
  const cookieStore = await cookies();
  cookieStore.set('dashboard-unlocked', 'true', {
    path: '/',
    maxAge: 60 * 30, // 30 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  redirect('/');
}

export async function lockDashboard() {
  const cookieStore = await cookies();
  cookieStore.delete('dashboard-unlocked');
  redirect(ROUTES.DASHBOARD_PASSWORD);
}
