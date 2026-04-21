// src/entities/invoice/api/invoiceApi.ts
// Invoice API layer - business logic for invoice operations

import {
  Invoice,
  InvoiceFilter,
  InvoiceSummary,
  InvoiceValidationResult,
  InvoiceStats,
  InvoiceFormData,
} from '../model/types';

export class InvoiceApi {
  // Generate next invoice number (8-digit format)
  static generateInvoiceNumber(lastInvoiceNo?: string): string {
    if (!lastInvoiceNo || !/^\d{8}$/.test(lastInvoiceNo)) {
      return '00000001';
    }

    const numericPart = parseInt(lastInvoiceNo);
    const nextNumber = numericPart + 1;
    return nextNumber.toString().padStart(8, '0');
  }

  // Filter invoices based on criteria
  static filterInvoices(invoices: Invoice[], filter: InvoiceFilter): Invoice[] {
    return invoices.filter((invoice) => {
      // Customer filter
      if (filter.customer && filter.customer.trim()) {
        const customerMatch = invoice.customerName
          .toLowerCase()
          .includes(filter.customer.toLowerCase());
        if (!customerMatch) return false;
      }

      // Status filter
      if (filter.status && filter.status !== 'all') {
        if (invoice.status !== filter.status) return false;
      }

      // Payment status filter
      if (filter.paymentStatus && filter.paymentStatus !== 'all') {
        // Exclude voided invoices when filtering for partial or pending payment status
        if (
          (filter.paymentStatus === 'partial' ||
            filter.paymentStatus === 'pending') &&
          invoice.status === 'voided'
        ) {
          return false;
        }

        // Calculate actual payment status dynamically
        const total = invoice.totalAmount || 0;
        const received = invoice.receivedAmount || 0;
        const batteryRate = invoice.batteriesRate || 0;
        const additionalPayments = (invoice.additionalPayment || []).reduce(
          (sum: number, payment: any) => sum + (payment.amount || 0),
          0
        );
        const totalReceived = received + batteryRate + additionalPayments;
        const actualRemaining = total - totalReceived;

        // Use the same logic as the grid
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

        if (actualStatus !== filter.paymentStatus) return false;
      }

      // Payment method filter
      if (filter.paymentMethod && filter.paymentMethod !== 'all') {
        const hasPaymentMethod = invoice.paymentMethod.some(
          (method) =>
            method.toLowerCase() === filter.paymentMethod!.toLowerCase()
        );
        if (!hasPaymentMethod) return false;
      }

      // Invoice number filter
      if (filter.invoiceNo && filter.invoiceNo.trim()) {
        const invoiceNoMatch = invoice.invoiceNo.includes(filter.invoiceNo);
        if (!invoiceNoMatch) return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const invoiceDate = new Date(invoice.createdDate);
        if (
          invoiceDate < filter.dateRange.start ||
          invoiceDate > filter.dateRange.end
        ) {
          return false;
        }
      }

      return true;
    });
  }

  // Calculate invoice summary statistics
  static calculateInvoiceSummary(invoices: Invoice[]): InvoiceSummary {
    const summary: InvoiceSummary = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      averageInvoiceValue: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      partialInvoices: 0,
    };

    const now = new Date();

    invoices.forEach((invoice) => {
      const total = invoice.totalAmount || 0;
      summary.totalAmount += total;

      switch (invoice.paymentStatus) {
        case 'paid':
          summary.paidAmount += total;
          summary.paidInvoices++;
          break;
        case 'pending':
          summary.pendingAmount += total;
          summary.pendingInvoices++;

          // Check if overdue
          if (invoice.dueDate && new Date(invoice.dueDate) < now) {
            summary.overdueAmount += total;
            summary.overdueInvoices++;
          }
          break;
        case 'partial':
          const paid = invoice.receivedAmount || 0;
          const remaining = invoice.remainingAmount || total - paid;
          summary.paidAmount += paid;
          summary.pendingAmount += remaining;
          summary.partialInvoices++;

          // Check if partial payment is overdue
          if (
            invoice.dueDate &&
            new Date(invoice.dueDate) < now &&
            remaining > 0
          ) {
            summary.overdueAmount += remaining;
            summary.overdueInvoices++;
          }
          break;
      }
    });

    // Calculate average invoice value
    summary.averageInvoiceValue =
      summary.totalInvoices > 0
        ? summary.totalAmount / summary.totalInvoices
        : 0;

    return summary;
  }

  // Get customer options from invoices
  static getCustomerOptions(invoices: Invoice[]): string[] {
    const customers = new Set<string>();
    invoices.forEach((invoice) => {
      if (invoice.customerName) {
        customers.add(invoice.customerName);
      }
    });
    return Array.from(customers).sort((a, b) => a.localeCompare(b));
  }

  // Get payment method options from invoices
  static getPaymentMethodOptions(invoices: Invoice[]): string[] {
    const methods = new Set<string>();
    invoices.forEach((invoice) => {
      invoice.paymentMethod?.forEach((method) => {
        if (method) methods.add(method);
      });
    });
    return Array.from(methods).sort((a, b) => a.localeCompare(b));
  }

  // Create a new invoice
  static async create(invoiceData: InvoiceFormData): Promise<Invoice> {
    try {
      // Transform entity data to match the exact structure the API expects
      // Based on the working CreateInvoiceModal code
      const formData: any = { ...invoiceData };

      // Handle product data - the API expects productDetail array
      if (invoiceData.products && invoiceData.products.length > 0) {
        formData.productDetail = invoiceData.products.map((product: any) => ({
          brandName: product.brandName,
          series: product.series,
          productPrice: product.productPrice,
          quantity: String(product.quantity || 1),
          totalPrice: product.totalPrice,
          productName: `${product.brandName} ${product.series}`,
          isChargingService: false,
          // Add required fields that the API expects
          batteryType: 'Unknown',
          model: 'Unknown',
          capacity: 'Unknown',
          voltage: 'Unknown',
          warranty: 'N/A',
          // Add warranty fields
          warrentyCode: product.noWarranty
            ? 'No Warranty'
            : product.warrentyCode || '',
          warrentyStartDate: product.noWarranty
            ? ''
            : product.warrentyStartDate || '',
          warrentyDuration: product.noWarranty
            ? '0'
            : product.warrentyDuration || '',
          warrantyEndDate: product.noWarranty
            ? ''
            : product.warrantyEndDate || '',
          noWarranty: product.noWarranty || false,
        }));
      } else {
        formData.productDetail = [];
      }

      // Remove products field as API expects productDetail
      delete (formData as any).products;

      // Convert payment method array to string (API expects string for storage, but validation expects array)
      formData.paymentMethod = Array.isArray(invoiceData.paymentMethod)
        ? invoiceData.paymentMethod
        : invoiceData.paymentMethod
          ? [invoiceData.paymentMethod]
          : [];

      // Set customer type
      formData.customerType = invoiceData.customerType || 'WalkIn Customer';
      formData.clientName = invoiceData.customerName || '-'; // API expects clientName, use '-' as default

      // Handle customer contact number - allow empty/null
      formData.customerContactNumber = invoiceData.customerContactNumber || '-';
      formData.customerAddress = invoiceData.customerAddress || '-';

      // Ensure other required fields - handle battery fields properly
      const hasOldBattery =
        Array.isArray(formData.paymentMethod) &&
        formData.paymentMethod.includes('Old Battery');

      if (!hasOldBattery) {
        formData.batteriesRate = 0;
        formData.batteriesCountAndWeight = '';
      } else {
        // Preserve battery values from invoiceData when Old Battery is selected
        formData.batteriesRate = invoiceData.batteriesRate || 0;
        formData.batteriesCountAndWeight =
          invoiceData.batteriesCountAndWeight || '';
      }

      formData.customDate = invoiceData.customDate || undefined;
      formData.useCustomDate = invoiceData.useCustomDate || false;

      // Call the API with the exact same structure as working code
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const result = await response.json();

      // Handle MongoDB Buffer serialization issue
      let invoiceId: string;
      if (result && result.acknowledged && result.insertedId) {
        // Convert MongoDB Buffer/ObjectId to string
        invoiceId =
          typeof result.insertedId === 'object' && result.insertedId.toString
            ? result.insertedId.toString()
            : String(result.insertedId);
      } else {
        invoiceId = Date.now().toString();
      }

      // Transform response back to entity format
      return {
        ...invoiceData,
        id: invoiceId,
        invoiceNo: invoiceData.invoiceNo || '00000000', // Ensure invoiceNo is always provided
        status: 'active',
        createdDate: new Date(),
        updatedAt: new Date(),
        // Ensure battery fields are included in the response
        batteriesRate: invoiceData.batteriesRate || 0,
        batteriesCountAndWeight: invoiceData.batteriesCountAndWeight || '',
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Calculate due date based on payment terms (default 30 days)
  static calculateDueDate(invoiceDate: Date, days: number = 30): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  // Validate invoice data
  static validateInvoice(invoice: Partial<Invoice>): InvoiceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Customer info is now optional - allow empty/null values
    // if (!invoice.customerName?.trim()) {
    //   errors.push('Customer name is required');
    // }

    // if (!invoice.customerContactNumber?.trim()) {
    //   errors.push('Customer phone number is required');
    // } else if (invoice.customerContactNumber.trim() !== '-' && !/^\d{10,15}$/.test(invoice.customerContactNumber.replace(/\D/g, ''))) {
    //   errors.push('Invalid phone number format');
    // }

    if (!invoice.products || invoice.products.length === 0) {
      errors.push('At least one product is required');
    } else {
      invoice.products.forEach((product, index) => {
        if (!product.brandName?.trim()) {
          errors.push(`Product ${index + 1}: Brand name is required`);
        }
        if (!product.series?.trim()) {
          errors.push(`Product ${index + 1}: Series is required`);
        }
        if (!product.quantity || product.quantity <= 0) {
          errors.push(`Product ${index + 1}: Quantity must be greater than 0`);
        }
        if (!product.productPrice || product.productPrice <= 0) {
          errors.push(
            `Product ${index + 1}: Unit price must be greater than 0`
          );
        }
        if (!product.warrentyCode?.trim()) {
          warnings.push(`Product ${index + 1}: Warranty code is missing`);
        }
      });
    }

    if (typeof invoice.totalAmount !== 'number' || invoice.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (
      typeof invoice.receivedAmount !== 'number' ||
      invoice.receivedAmount < 0
    ) {
      errors.push('Received amount must be 0 or greater');
    }

    if (
      invoice.receivedAmount &&
      invoice.receivedAmount > (invoice.totalAmount || 0)
    ) {
      errors.push('Received amount cannot exceed total amount');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Calculate invoice statistics
  static calculateInvoiceStats(invoices: Invoice[]): InvoiceStats {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: InvoiceStats = {
      today: { count: 0, amount: 0 },
      thisWeek: { count: 0, amount: 0 },
      thisMonth: { count: 0, amount: 0 },
      total: { count: invoices.length, amount: 0 },
    };

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.createdDate);
      const amount = invoice.totalAmount || 0;

      stats.total.amount += amount;

      if (invoiceDate >= todayStart) {
        stats.today.count++;
        stats.today.amount += amount;
      }

      if (invoiceDate >= weekStart) {
        stats.thisWeek.count++;
        stats.thisWeek.amount += amount;
      }

      if (invoiceDate >= monthStart) {
        stats.thisMonth.count++;
        stats.thisMonth.amount += amount;
      }
    });

    return stats;
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Format date
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Format date with time
  static formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Get default date range for filtering (last 30 days)
  static getDefaultDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end };
  }

  // Check if invoice is overdue
  static isOverdue(invoice: Invoice): boolean {
    if (!invoice.dueDate) return false;
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    return dueDate < now && invoice.paymentStatus !== 'paid';
  }

  // Get overdue days
  static getOverdueDays(invoice: Invoice): number {
    if (!invoice.dueDate || !this.isOverdue(invoice)) return 0;
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate remaining amount
  static calculateRemainingAmount(invoice: Invoice): number {
    const total = invoice.totalAmount || 0;
    const received = invoice.receivedAmount || 0;
    const batteryRate = invoice.batteriesRate || 0;
    const additionalPayments = (invoice.additionalPayment || []).reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
    const totalReceived = received + batteryRate + additionalPayments;
    return Math.max(0, total - totalReceived);
  }

  // Update payment status based on amounts
  static updatePaymentStatus(invoice: Invoice): 'pending' | 'partial' | 'paid' {
    const total = invoice.totalAmount || 0;
    const received = invoice.receivedAmount || 0;
    const batteryRate = invoice.batteriesRate || 0;
    const additionalPayments = (invoice.additionalPayment || []).reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
    const totalReceived = received + batteryRate + additionalPayments;

    if (totalReceived >= total) {
      return 'paid';
    } else if (totalReceived > 0) {
      return 'partial';
    } else {
      return 'pending';
    }
  }
}
