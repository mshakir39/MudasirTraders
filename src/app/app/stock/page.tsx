import StockLayout from '@/layouts/stockLayout';
import { getCategories } from '@/getData/getCategories';
import { getStock } from '@/actions/stockActions';
import StockErrorBoundary from '@/components/stock/StockErrorBoundary';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time stock data
export const revalidate = 0; // React 19: No caching for latest stock information

// React 19: Enhanced server component with better error handling
async function getStockData() {
  try {
    const stockResult = await getStock();

    if (!stockResult.success) {
      console.error('Failed to fetch stock:', stockResult.error);
      return [];
    }

    return stockResult.data || [];
  } catch (error) {
    console.error('Error loading stock data:', error);
    return [];
  }
}

async function getCategoriesData() {
  try {
    const categories = await getCategories();
    return Array.isArray(categories) ? categories : [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function page() {
  // React 19: Parallel data fetching for better performance
  const [categories, stock] = await Promise.all([
    getCategoriesData(),
    getStockData(),
  ]);

  return (
    // React 19: Error boundary for better error handling
    <StockErrorBoundary>
      <StockLayout categories={categories} stock={stock as any} />
    </StockErrorBoundary>
  );
}

export default page;
