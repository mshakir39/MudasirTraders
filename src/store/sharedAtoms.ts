// src/store/sharedAtoms.ts
// Jotai atoms to replace Zustand stores - shared across the application

import { atom } from 'jotai';

// Categories atom (replaces useCategoryStore)
export const categoriesAtom = atom<any[]>([]);
export const categoriesLoadingAtom = atom<boolean>(false);
export const categoriesErrorAtom = atom<string | null>(null);

// Brands atom (replaces useBrandStore)
export const brandsAtom = atom<any[]>([]);
export const brandsLoadingAtom = atom<boolean>(false);
export const brandsErrorAtom = atom<string | null>(null);

// Customers atom (replaces useCustomersStore)
export const customersAtom = atom<any[]>([]);
export const customersLoadingAtom = atom<boolean>(false);
export const customersErrorAtom = atom<string | null>(null);

// Sales atom (replaces useSalesStore)
export const salesAtom = atom<any[]>([]);
export const salesLoadingAtom = atom<boolean>(false);
export const salesErrorAtom = atom<string | null>(null);

// Stock atom (for invoice management)
export const stockAtom = atom<any[]>([]);
export const stockLoadingAtom = atom<boolean>(false);
export const stockErrorAtom = atom<string | null>(null);

// Action atoms for categories
export const fetchCategoriesAtom = atom(null, async (get, set) => {
  set(categoriesLoadingAtom, true);
  set(categoriesErrorAtom, null);

  try {
    const response = await fetch('/api/categories');
    const result = await response.json();
    set(
      categoriesAtom,
      result.success && Array.isArray(result.data) ? result.data : []
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    set(categoriesErrorAtom, 'Failed to fetch categories');
    set(categoriesAtom, []);
  } finally {
    set(categoriesLoadingAtom, false);
  }
});

export const setCategoriesAtom = atom(null, (get, set, categories: any[]) => {
  set(categoriesAtom, categories);
});

// Action atoms for brands
export const fetchBrandsAtom = atom(null, async (get, set) => {
  set(brandsLoadingAtom, true);
  set(brandsErrorAtom, null);

  try {
    const response = await fetch('/api/brands');
    const result = await response.json();
    set(
      brandsAtom,
      result.success && Array.isArray(result.data) ? result.data : []
    );
  } catch (error) {
    console.error('Error fetching brands:', error);
    set(brandsErrorAtom, 'Failed to fetch brands');
    set(brandsAtom, []);
  } finally {
    set(brandsLoadingAtom, false);
  }
});

export const setBrandsAtom = atom(null, (get, set, brands: any[]) => {
  set(brandsAtom, brands);
});

// Action atoms for customers
export const fetchCustomersAtom = atom(null, async (get, set) => {
  set(customersLoadingAtom, true);
  set(customersErrorAtom, null);

  try {
    const response = await fetch('/api/customers');
    const result = await response.json();
    set(
      customersAtom,
      result.success && Array.isArray(result.data) ? result.data : []
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    set(customersErrorAtom, 'Failed to fetch customers');
    set(customersAtom, []);
  } finally {
    set(customersLoadingAtom, false);
  }
});

export const setCustomersAtom = atom(null, (get, set, customers: any[]) => {
  set(customersAtom, customers);
});

// Action atoms for sales
export const fetchSalesAtom = atom(null, async (get, set) => {
  set(salesLoadingAtom, true);
  set(salesErrorAtom, null);

  try {
    // Add sales fetching logic when needed
    set(salesAtom, []);
  } catch (error) {
    console.error('Error fetching sales:', error);
    set(salesErrorAtom, 'Failed to fetch sales');
    set(salesAtom, []);
  } finally {
    set(salesLoadingAtom, false);
  }
});

export const setSalesAtom = atom(null, (get, set, sales: any[]) => {
  set(salesAtom, sales);
});

// Action atoms for stock
export const fetchStockAtom = atom(null, async (get, set) => {
  set(stockLoadingAtom, true);
  set(stockErrorAtom, null);

  try {
    const response = await fetch('/api/stock');
    const result = await response.json();
    const stockData =
      result.success && Array.isArray(result.data) ? result.data : [];
    set(stockAtom, stockData);
  } catch (error) {
    console.error('❌ Error fetching stock:', error);
    set(stockErrorAtom, 'Failed to fetch stock');
    set(stockAtom, []);
  } finally {
    set(stockLoadingAtom, false);
  }
});

export const setStockAtom = atom(null, (get, set, stock: any[]) => {
  set(stockAtom, stock);
});

// Invoice atoms
export const invoicesAtom = atom<any[]>([]);
export const invoicesLoadingAtom = atom<boolean>(false);
export const invoicesErrorAtom = atom<string | null>(null);

// Action atoms for invoices
export const fetchInvoicesAtom = atom(null, async (get, set) => {
  set(invoicesLoadingAtom, true);
  set(invoicesErrorAtom, null);

  try {
    const response = await fetch('/api/invoices');
    const result = await response.json();

    if (result.success && result.data) {
      // Transform invoice data to match expected structure
      const transformedInvoices = result.data
        .map((invoice: any) => {
          // Calculate total amount from products if not available
          const calculateTotalAmount = () => {
            if (
              invoice.totalAmount &&
              typeof invoice.totalAmount === 'number'
            ) {
              return invoice.totalAmount;
            }

            // Calculate from products totalPrice
            if (invoice.products && Array.isArray(invoice.products)) {
              return invoice.products.reduce((sum: number, product: any) => {
                return (
                  sum +
                  (typeof product.totalPrice === 'number'
                    ? product.totalPrice
                    : 0)
                );
              }, 0);
            }

            // Use remainingAmount + receivedAmount as fallback
            const remaining =
              typeof invoice.remainingAmount === 'number'
                ? invoice.remainingAmount
                : 0;
            const received =
              typeof invoice.receivedAmount === 'number'
                ? invoice.receivedAmount
                : 0;
            return remaining + received;
          };

          const totalAmount = calculateTotalAmount();

          return {
            id: invoice._id || invoice.id || '',
            invoiceNo: invoice.invoiceNo || '',
            customerName: invoice.customerName || '',
            customerAddress: invoice.customerAddress || '',
            customerContactNumber:
              invoice.customerContactNumber || invoice.customerPhone || '',
            customerType: invoice.customerType || 'WalkIn Customer',
            products: invoice.products || invoice.productDetail || [],
            subtotal: invoice.subtotal || 0,
            taxAmount: invoice.taxAmount || 0,
            totalAmount: totalAmount,
            receivedAmount: invoice.receivedAmount || 0,
            remainingAmount:
              invoice.remainingAmount ||
              totalAmount - (invoice.receivedAmount || 0),
            paymentMethod: Array.isArray(invoice.paymentMethod)
              ? invoice.paymentMethod
              : invoice.paymentMethod
                ? [invoice.paymentMethod]
                : [],
            paymentStatus: invoice.paymentStatus || 'pending',
            status: invoice.status || 'active',
            useCustomDate: invoice.useCustomDate || false,
            customDate: invoice.customDate || '',
            createdDate: new Date(
              invoice.createdDate || invoice.createdAt || Date.now()
            ),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
            additionalPayment: invoice.additionalPayment || [],
            notes: invoice.notes || '',
            updatedAt: invoice.updatedAt
              ? new Date(invoice.updatedAt)
              : undefined,
            // Add battery fields with defaults
            batteriesRate: invoice.batteriesRate || 0,
            batteriesCountAndWeight: invoice.batteriesCountAndWeight || '',
            // Add consolidation fields
            consolidatedFrom: invoice.consolidatedFrom || undefined,
            previousAmounts: invoice.previousAmounts || undefined,
            consolidatedInvoiceNumbers:
              invoice.consolidatedInvoiceNumbers || undefined,
            replacesInvoice: invoice.replacesInvoice || undefined,
            replacedBy: invoice.replacedBy || undefined,
          };
        })
        .sort((a: any, b: any) => {
          // Sort by created date in descending order (newest first)
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });

      set(invoicesAtom, transformedInvoices);
    } else {
      set(invoicesAtom, []);
      set(invoicesErrorAtom, result.error || 'Failed to fetch invoices');
    }
  } catch (error) {
    set(
      invoicesErrorAtom,
      error instanceof Error ? error.message : 'Failed to fetch invoices'
    );
    set(invoicesAtom, []);
  } finally {
    set(invoicesLoadingAtom, false);
  }
});

export const setInvoicesAtom = atom(null, (get, set, invoices: any[]) => {
  set(invoicesAtom, invoices);
});
