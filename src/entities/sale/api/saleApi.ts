// src/entities/sale/api/saleApi.ts
// Sale API operations - wraps existing actions

import {
  Sale,
  DateRange,
  SalesFilter,
  SalesSummary,
  CustomerOption,
} from '../model/types';

export class SaleApi {
  // Fetch all sales
  static async fetchSales(): Promise<Sale[]> {
    try {
      // Import the existing action
      const { getSales } = await import('@/actions/salesActions');

      const result = await getSales();

      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  // Delete a sale
  static async deleteSale(saleId: string): Promise<void> {
    try {
      const response = await fetch('/api/sales', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: saleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete sale');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }

  // Get unique customers from sales
  static getCustomerOptions(sales: Sale[]): CustomerOption[] {
    const uniqueCustomers = Array.from(
      new Set(
        sales
          .map((sale) => sale.customerName)
          .filter(Boolean)
          .filter((name) => name.trim() !== '')
      )
    ).sort();

    return [
      { label: 'All Customers', value: '' },
      ...uniqueCustomers.map((customer) => ({
        label: customer,
        value: customer,
      })),
    ];
  }

  // Filter sales based on criteria
  static filterSales(sales: Sale[], filter: SalesFilter): Sale[] {
    return sales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const dateMatch =
        saleDate >= filter.dateRange.start && saleDate <= filter.dateRange.end;

      // Customer filter
      const customerMatch =
        !filter.customer || sale.customerName === filter.customer;

      return dateMatch && customerMatch;
    });
  }

  // Calculate sales summary
  static calculateSalesSummary(sales: Sale[]): SalesSummary {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );
    const totalCost = sales.reduce(
      (sum, sale) => sum + (sale.totalCost || 0),
      0
    );
    const totalProfit = totalRevenue - totalCost;
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get unique customers from filtered results
    const uniqueCustomers = Array.from(
      new Set(sales.map((sale) => sale.customerName).filter(Boolean))
    ).length;

    return {
      totalSales,
      totalRevenue,
      avgSaleValue,
      uniqueCustomers,
      totalProfit,
    };
  }

  // Get default date range (last 30 days)
  static getDefaultDateRange(): DateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Search sales by customer name
  static searchSales(sales: Sale[], searchTerm: string): Sale[] {
    if (!searchTerm.trim()) {
      return sales;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return sales.filter(
      (sale) =>
        sale.customerName.toLowerCase().includes(lowerSearchTerm) ||
        sale.customerContactNumber.toLowerCase().includes(lowerSearchTerm)
    );
  }

  // Validate sale data
  static validateSaleData(sale: Partial<Sale>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!sale.customerName?.trim()) {
      errors.push('Customer name is required');
    }

    if (!sale.customerContactNumber?.trim()) {
      errors.push('Customer contact number is required');
    }

    if (!sale.products || sale.products.length === 0) {
      errors.push('At least one product is required');
    }

    if (sale.totalAmount !== undefined && sale.totalAmount < 0) {
      errors.push('Total amount must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
