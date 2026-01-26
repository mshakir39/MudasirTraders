import InvoiceLayout from '@/layouts/invoicesLayout';
import { getCategories } from '@/getData/getCategories';
import { getInvoices } from '@/actions/invoiceActions';
import { getStock } from '@/actions/stockActions';
import InvoiceErrorBoundary from '@/components/invoices/InvoiceErrorBoundary';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time invoice data
export const revalidate = 0; // React 19: No caching for latest invoice information

// React 19: Enhanced server component with better error handling
async function getInvoicesData() {
  try {
    const invoicesResult = await getInvoices();

    if (!invoicesResult.success) {
      console.error('Failed to fetch invoices:', invoicesResult.error);
      return null;
    }

    return invoicesResult.data;
  } catch (error) {
    console.error('Error loading invoices data:', error);
    return null;
  }
}

async function getCategoriesData() {
  try {
    const categoriesResult = await getCategories();
    return Array.isArray(categoriesResult) ? categoriesResult : [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function getStockData() {
  try {
    const stockResult = await getStock();
    console.log('Stock API result:', stockResult);
    const stockData =
      stockResult.success && Array.isArray(stockResult.data)
        ? stockResult.data
        : [];
    console.log('Processed stock data:', stockData);
    return stockData;
  } catch (error) {
    console.error('Error loading stock:', error);
    return [];
  }
}

export default async function Invoices() {
  // React 19: Parallel data fetching for better performance
  const [invoices, categories, stock] = await Promise.all([
    getInvoicesData(),
    getCategoriesData(),
    getStockData(),
  ]);

  return (
    <InvoiceErrorBoundary>
      <InvoiceLayout
        categories={categories}
        invoices={invoices}
        stock={stock}
      />
    </InvoiceErrorBoundary>
  );
}
