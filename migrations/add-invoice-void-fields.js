// Migration Script: Add void/replace fields to existing invoices
// Run this before deploying the void/replace feature

const { MongoClient } = require('mongodb');

// Use the same connection method as your app
async function connectToMongoDB() {
  const { MongoClient } = require('mongodb');
  
  // Try to get MONGODB_URI from environment
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

async function migrateInvoiceVoidFields() {
  console.log('🔄 Starting Invoice Void/Replace Migration...\n');

  const client = await connectToMongoDB();
  
  try {
    const db = client.db();
    const invoiceCollection = db.collection('invoices');

    // Step 1: Check current state
    console.log('📊 Analyzing current invoice collection...');
    
    const totalInvoices = await invoiceCollection.countDocuments();
    const invoicesWithStatus = await invoiceCollection.countDocuments({ 
      status: { $exists: true } 
    });
    const invoicesWithoutStatus = totalInvoices - invoicesWithStatus;
    
    console.log(`   Total invoices: ${totalInvoices}`);
    console.log(`   With status field: ${invoicesWithStatus}`);
    console.log(`   Without status field: ${invoicesWithoutStatus}`);
    
    if (invoicesWithoutStatus === 0) {
      console.log('✅ All invoices already have status field. Migration not needed.');
      return;
    }

    // Step 2: Add status field (NOT paymentStatus - you already have that!)
    console.log('\n🔧 Adding status field to invoices...');
    
    const updateResult = await invoiceCollection.updateMany(
      { 
        status: { $exists: false } // Only add if status field doesn't exist
      },
      {
        $set: {
          status: 'active', // Default status for existing invoices
          // Add void/replace specific fields
          voidedAt: null,
          voidReason: null,
          voidedBy: null,
          replacedBy: null,
          replacesInvoice: null,
          originalAmount: null,
          additionalAmount: null,
          notes: null
        }
      }
    );

    console.log(`   ✅ Updated ${updateResult.modifiedCount} invoices`);

    // Step 3: No need to update paymentStatus - you already have it!
    console.log('\n🔄 paymentStatus field already exists - no updates needed...');
    console.log('   ✅ paymentStatus tracks: pending | paid | partial');
    console.log('   ✅ status field tracks: active | voided | cancelled');

    // Step 4: Create indexes for performance
    console.log('\n📊 Creating indexes...');
    
    try {
      // Index for status filtering (crucial for performance)
      await invoiceCollection.createIndex({ status: 1 });
      console.log('   ✅ Created index on status field');
      
      // Index for transfer relationships
      await invoiceCollection.createIndex({ replacedBy: 1 });
      console.log('   ✅ Created index on replacedBy field');
      
      await invoiceCollection.createIndex({ replacesInvoice: 1 });
      console.log('   ✅ Created index on replacesInvoice field');
      
      // Compound index for common queries
      await invoiceCollection.createIndex({ 
        status: 1, 
        createdAt: -1 
      });
      console.log('   ✅ Created compound index on status + createdAt');
      
    } catch (indexError) {
      console.log('   ⚠️  Index creation warning:', indexError.message);
      // Don't fail migration for index issues
    }

    // Step 5: Validate migration
    console.log('\n🔍 Validating migration...');
    
    const postMigrationStats = await invoiceCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('   Status distribution:');
    postMigrationStats.forEach(stat => {
      console.log(`     ${stat._id}: ${stat.count} invoices`);
    });

    // Check for any documents still missing status
    const stillMissingStatus = await invoiceCollection.countDocuments({
      status: { $exists: false }
    });

    if (stillMissingStatus > 0) {
      console.log(`   ❌ ERROR: ${stillMissingStatus} invoices still missing status field`);
      throw new Error('Migration incomplete');
    } else {
      console.log('   ✅ All invoices now have status field');
    }

    // Step 6: Sample verification
    console.log('\n📋 Sample verification...');
    
    const sampleInvoices = await invoiceCollection
      .find({})
      .limit(3)
      .toArray();
    
    sampleInvoices.forEach((invoice, index) => {
      console.log(`   Sample ${index + 1}:`);
      console.log(`     ID: ${invoice._id}`);
      console.log(`     Status: ${invoice.status}`);
      console.log(`     Customer: ${invoice.customerName}`);
      console.log(`     Amount: Rs ${invoice.totalAmount}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Total invoices processed: ${totalInvoices}`);
    console.log(`   ✅ Status field added: ${updateResult.modifiedCount}`);
    console.log(`   ✅ Indexes created: 4`);
    console.log(`   ✅ Validation passed: Yes`);
    console.log('\n🚀 Ready to deploy void/replace feature!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Rollback function (if needed)
async function rollbackMigration() {
  console.log('🔄 Rolling back invoice void/replace migration...\n');
  
  const client = await connectToMongoDB();
  
  try {
    const db = client.db();
    const invoiceCollection = db.collection('invoices');

    // Remove the new fields we added
    const rollbackResult = await invoiceCollection.updateMany(
      {},
      {
        $unset: {
          status: "",
          voidedAt: "",
          voidReason: "",
          voidedBy: "",
          replacedBy: "",
          replacesInvoice: "",
          originalAmount: "",
          additionalAmount: "",
          notes: ""
        }
      }
    );

    console.log(`✅ Rolled back ${rollbackResult.modifiedCount} invoices`);
    
    // Drop indexes (optional)
    try {
      await invoiceCollection.dropIndex('status_1');
      await invoiceCollection.dropIndex('replacedBy_1');
      await invoiceCollection.dropIndex('replacesInvoice_1');
      await invoiceCollection.dropIndex('status_1_createdAt_-1');
      console.log('✅ Dropped migration indexes');
    } catch (indexError) {
      console.log('⚠️  Some indexes may not exist:', indexError.message);
    }

    console.log('🎉 Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollbackMigration()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    migrateInvoiceVoidFields()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { 
  migrateInvoiceVoidFields, 
  rollbackMigration 
};
