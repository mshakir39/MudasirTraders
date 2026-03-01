const { MongoClient } = require('mongodb');

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function auditDealersAndBills() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    
    // Get all dealers
    console.log('\n📋 Fetching all dealers...');
    const dealers = await db.collection('dealers').find({}).toArray();
    console.log(`Found ${dealers.length} dealers`);

    // Get all dealer bills
    console.log('\n💰 Fetching all dealer bills...');
    const bills = await db.collection('dealerBills').find({}).toArray();
    console.log(`Found ${bills.length} bills`);

    // Calculate summary statistics
    console.log('\n📊 Calculating summary statistics...');
    
    let totalBillsAmount = 0;
    let totalPaidAmount = 0;
    let totalOutstanding = 0;
    let billsWithPayments = 0;
    let billsWithoutPayments = 0;
    let overpaidBills = 0;
    let zeroAmountBills = 0;

    // Process each bill
    for (const bill of bills) {
      const billAmount = parseFloat(bill.totalAmount) || 0;
      totalBillsAmount += billAmount;

      // Calculate total paid for this bill
      let totalPaid = 0;
      if (bill.payments && Array.isArray(bill.payments)) {
        totalPaid = bill.payments.reduce((sum, payment) => {
          return sum + (parseFloat(payment.paymentAmount) || 0);
        }, 0);
      }

      totalPaidAmount += totalPaid;
      
      const outstanding = billAmount - totalPaid;
      totalOutstanding += outstanding;

      // Categorize bills
      if (billAmount === 0) {
        zeroAmountBills++;
      }
      
      if (totalPaid > 0) {
        billsWithPayments++;
      } else {
        billsWithoutPayments++;
      }

      if (outstanding < 0) {
        overpaidBills++;
      }

      // Log individual bill details for verification
      console.log(`\n📄 Bill #${bill.id?.slice(-8) || 'Unknown'}:`);
      console.log(`  Dealer: ${bill.dealerName || 'Unknown'}`);
      console.log(`  Bill Amount: Rs ${billAmount.toLocaleString('en-PK')}`);
      console.log(`  Total Paid: Rs ${totalPaid.toLocaleString('en-PK')}`);
      console.log(`  Outstanding: Rs ${outstanding.toLocaleString('en-PK')}`);
      console.log(`  Status: ${outstanding > 0 ? 'Outstanding' : outstanding < 0 ? 'Overpaid' : 'Paid'}`);
      console.log(`  Payment Count: ${bill.payments?.length || 0}`);
      
      // Show payment details
      if (bill.payments && bill.payments.length > 0) {
        console.log('  Payments:');
        bill.payments.forEach((payment, index) => {
          console.log(`    ${index + 1}. Rs ${parseFloat(payment.paymentAmount).toLocaleString('en-PK')} on ${new Date(payment.paymentDate).toLocaleString('en-PK')}`);
        });
      }
    }

    // Display summary
    console.log('\n📈 SUMMARY STATISTICS');
    console.log('='.repeat(50));
    console.log(`Total Dealers: ${dealers.length}`);
    console.log(`Total Bills: ${bills.length}`);
    console.log(`Total Bill Amount: Rs ${totalBillsAmount.toLocaleString('en-PK')}`);
    console.log(`Total Paid Amount: Rs ${totalPaidAmount.toLocaleString('en-PK')}`);
    console.log(`Total Outstanding: Rs ${totalOutstanding.toLocaleString('en-PK')}`);
    console.log(`Bills with Payments: ${billsWithPayments}`);
    console.log(`Bills without Payments: ${billsWithoutPayments}`);
    console.log(`Zero Amount Bills: ${zeroAmountBills}`);
    console.log(`Overpaid Bills: ${overpaidBills}`);

    // Check for potential issues
    console.log('\n⚠️  POTENTIAL ISSUES');
    console.log('='.repeat(50));
    
    if (zeroAmountBills > 0) {
      console.log(`⚠️  Found ${zeroAmountBills} bills with zero amount`);
    }
    
    if (overpaidBills > 0) {
      console.log(`⚠️  Found ${overpaidBills} overpaid bills (paid more than bill amount)`);
    }

    // Verify dealer bill counts
    console.log('\n🔍 DEALER BILL COUNT VERIFICATION');
    console.log('='.repeat(50));
    
    for (const dealer of dealers) {
      const dealerBills = bills.filter(bill => bill.dealerId === dealer.id);
      console.log(`Dealer: ${dealer.dealerName || 'Unknown'}`);
      console.log(`  Total Bills: ${dealerBills.length}`);
      
      // Calculate dealer totals
      let dealerTotal = 0;
      let dealerPaid = 0;
      
      dealerBills.forEach(bill => {
        const billAmount = parseFloat(bill.totalAmount) || 0;
        dealerTotal += billAmount;
        
        if (bill.payments) {
          const billPaid = bill.payments.reduce((sum, payment) => 
            sum + (parseFloat(payment.paymentAmount) || 0), 0);
          dealerPaid += billPaid;
        }
      });
      
      console.log(`  Total Amount: Rs ${dealerTotal.toLocaleString('en-PK')}`);
      console.log(`  Total Paid: Rs ${dealerPaid.toLocaleString('en-PK')}`);
      console.log(`  Outstanding: Rs ${(dealerTotal - dealerPaid).toLocaleString('en-PK')}`);
      console.log('');
    }

    console.log('\n✅ Audit completed successfully');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the audit
auditDealersAndBills();
