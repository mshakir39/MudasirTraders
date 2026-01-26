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

    // Get total invoices
    const invoices = await executeOperation('invoices', 'findAll');
    const totalInvoices = Array.isArray(invoices) ? invoices.length : 0;

    // Get recent sales (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSales = Array.isArray(sales)
      ? sales.filter((sale: any) => new Date(sale.saleDate) >= sevenDaysAgo)
      : [];

    // Get top selling products
    const productSales = Array.isArray(sales)
      ? sales.reduce((acc: any, sale: any) => {
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

export async function getSalesTrend(startDate: Date, endDate: Date) {
  try {
    const sales = await executeOperation('sales', 'find', {
      saleDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Group sales by date
    const salesByDate = Array.isArray(sales)
      ? sales.reduce((acc: any, sale: any) => {
          const date = new Date(sale.saleDate).toISOString().split('T')[0];
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
