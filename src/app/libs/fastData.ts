import { connectToMongoDB } from './connectToMongoDB';

// Helper function to serialize MongoDB documents (convert _id to id)
function serializeDocuments(documents: any[]): any[] {
  return documents.map((doc: any) => {
    const serializedDocument: Record<string, any> = {};
    for (const key in doc) {
      if (key === '_id') {
        serializedDocument['id'] = doc[key].toString();
      } else {
        serializedDocument[key] = doc[key];
      }
    }
    return serializedDocument;
  });
}

// Fast data fetching functions
export async function fastGetCustomers() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const customers = await db.collection('customers')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000) // Limit to prevent large result sets
      .toArray();
    
    return { success: true, data: serializeDocuments(customers) };
  } catch (error) {
    console.error('Fast getCustomers error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function fastGetStock() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const stock = await db.collection('stock')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();
    
    return { success: true, data: serializeDocuments(stock) };
  } catch (error) {
    console.error('Fast getStock error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function fastGetInvoices() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const invoices = await db.collection('invoices')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();
    
    return { success: true, data: serializeDocuments(invoices) };
  } catch (error) {
    console.error('Fast getInvoices error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function fastGetSales() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const sales = await db.collection('sales')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();
    
    return { success: true, data: serializeDocuments(sales) };
  } catch (error) {
    console.error('Fast getSales error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function fastGetBrands() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const brands = await db.collection('brands')
      .find({})
      .sort({ name: 1 })
      .limit(100)
      .toArray();
    
    return { success: true, data: serializeDocuments(brands) };
  } catch (error) {
    console.error('Fast getBrands error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function fastGetCategories() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const categories = await db.collection('categories')
      .find({})
      .sort({ name: 1 })
      .limit(100)
      .toArray();
    
    return { success: true, data: serializeDocuments(categories) };
  } catch (error) {
    console.error('Fast getCategories error:', error);
    return { success: false, error: (error as Error).message };
  }
}
