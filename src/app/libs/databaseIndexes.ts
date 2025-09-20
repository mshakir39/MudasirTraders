'use server';
import { connectToMongoDB } from './connectToMongoDB';

// Database indexes for performance optimization
export async function createDatabaseIndexes() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database for index creation');
      return;
    }

    console.log('🔧 Creating database indexes for performance optimization...');

    // Invoice collection indexes
    await Promise.all([
      // Primary invoice indexes
      db.collection('invoices').createIndex({ invoiceNo: 1 }, { unique: true }),
      db.collection('invoices').createIndex({ createdDate: -1 }),
      db.collection('invoices').createIndex({ customerName: 1 }),
      db.collection('invoices').createIndex({ customerContactNumber: 1 }),
      db.collection('invoices').createIndex({ paymentStatus: 1 }),
      db.collection('invoices').createIndex({ customerId: 1 }),
      
      // Compound indexes for common queries
      db.collection('invoices').createIndex({ customerName: 1, createdDate: -1 }),
      db.collection('invoices').createIndex({ createdDate: -1, paymentStatus: 1 }),
      db.collection('invoices').createIndex({ customerName: 1, paymentStatus: 1 }),
      
      // Text index for customer search
      db.collection('invoices').createIndex({ 
        customerName: 'text', 
        customerContactNumber: 'text' 
      })
    ]);

    // Sales collection indexes
    await Promise.all([
      db.collection('sales').createIndex({ invoiceId: 1 }, { unique: true }),
      db.collection('sales').createIndex({ date: -1 }),
      db.collection('sales').createIndex({ customerName: 1 }),
      db.collection('sales').createIndex({ 'products.brandName': 1 }),
      db.collection('sales').createIndex({ 'products.series': 1 }),
      db.collection('sales').createIndex({ customerName: 1, date: -1 })
    ]);

    // Stock collection indexes
    await Promise.all([
      db.collection('stock').createIndex({ brandName: 1 }),
      db.collection('stock').createIndex({ 'seriesStock.series': 1 }),
      db.collection('stock').createIndex({ brandName: 1, 'seriesStock.series': 1 })
    ]);

    // Categories collection indexes
    await Promise.all([
      db.collection('categories').createIndex({ brandName: 1 }, { unique: true }),
      db.collection('categories').createIndex({ 'series.name': 1 }),
      db.collection('categories').createIndex({ salesTax: 1 })
    ]);

    // Customers collection indexes
    await Promise.all([
      db.collection('customers').createIndex({ customerName: 1 }),
      db.collection('customers').createIndex({ customerContactNumber: 1 }),
      db.collection('customers').createIndex({ customerType: 1 }),
      db.collection('customers').createIndex({ 
        customerName: 'text', 
        customerContactNumber: 'text' 
      })
    ]);

    // Warranty history indexes
    await Promise.all([
      db.collection('warrantyHistory').createIndex({ warrentyCode: 1 }),
      db.collection('warrantyHistory').createIndex({ customerName: 1 }),
      db.collection('warrantyHistory').createIndex({ 'productDetails.brandName': 1 }),
      db.collection('warrantyHistory').createIndex({ 'productDetails.series': 1 }),
      db.collection('warrantyHistory').createIndex({ originalInvoiceNo: 1 })
    ]);

    // Category history indexes
    await Promise.all([
      db.collection('categoryHistory').createIndex({ categoryId: 1 }),
      db.collection('categoryHistory').createIndex({ historyDate: -1 }),
      db.collection('categoryHistory').createIndex({ categoryId: 1, historyDate: -1 })
    ]);

    // Archived invoices indexes
    await Promise.all([
      db.collection('archivedInvoices').createIndex({ originalInvoiceNo: 1 }),
      db.collection('archivedInvoices').createIndex({ deletedAt: -1 }),
      db.collection('archivedInvoices').createIndex({ originalId: 1 })
    ]);

    console.log('✅ Database indexes created successfully');
    
    // Log index statistics
    await logIndexStatistics(db);
    
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
}

// Log index statistics for monitoring
async function logIndexStatistics(db: any) {
  try {
    const collections = [
      'invoices', 'sales', 'stock', 'categories', 
      'customers', 'warrantyHistory', 'categoryHistory'
    ];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      
      console.log(`📊 ${collectionName} indexes:`, indexes.length);
      
      // Log index sizes
      const stats = await collection.stats();
      console.log(`📈 ${collectionName} stats:`, {
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        indexSizes: stats.indexSizes
      });
    }
  } catch (error) {
    console.warn('⚠️ Could not log index statistics:', error);
  }
}

// Drop indexes (for development/testing)
export async function dropDatabaseIndexes() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database for index dropping');
      return;
    }

    console.log('🗑️ Dropping database indexes...');

    const collections = [
      'invoices', 'sales', 'stock', 'categories', 
      'customers', 'warrantyHistory', 'categoryHistory'
    ];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      await collection.dropIndexes();
      console.log(`✅ Dropped indexes for ${collectionName}`);
    }

    console.log('✅ All database indexes dropped');
  } catch (error) {
    console.error('❌ Error dropping database indexes:', error);
  }
}

// Check index performance
export async function checkIndexPerformance() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database for performance check');
      return;
    }

    console.log('🔍 Checking index performance...');

    // Test common queries
    const testQueries = [
      {
        name: 'Recent Invoices',
        collection: 'invoices',
        query: {},
        sort: { createdDate: -1 },
        limit: 10
      },
      {
        name: 'Customer Invoices',
        collection: 'invoices',
        query: { customerName: 'Test Customer' },
        sort: { createdDate: -1 }
      },
      {
        name: 'Stock by Brand',
        collection: 'stock',
        query: { brandName: 'PHOENIX' }
      }
    ];

    for (const testQuery of testQueries) {
      const start = Date.now();
      const collection = db.collection(testQuery.collection);
      
      let cursor = collection.find(testQuery.query);
      if (testQuery.sort) cursor = cursor.sort(testQuery.sort as any);
      if (testQuery.limit) cursor = cursor.limit(testQuery.limit);
      
      await cursor.toArray();
      const duration = Date.now() - start;
      
      console.log(`⏱️ ${testQuery.name}: ${duration}ms`);
      
      if (duration > 100) {
        console.warn(`⚠️ Slow query detected: ${testQuery.name} (${duration}ms)`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking index performance:', error);
  }
}
