---
description: Complete Implementation Guide for Invoice Void and Replace Feature
---

# Invoice Void and Replace Feature - Complete Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing the invoice void and replace feature in the Mudasir Traders system. This feature allows customers to add products to existing invoices by voiding the original and creating a new combined invoice.

## 📋 Prerequisites

- MongoDB database access
- Node.js environment
- Understanding of current invoice system
- Backup of production database

---

## 🗄️ Phase 1: Database Migration

### Step 1.1: Review Migration Script

**File:** `migrations/add-invoice-void-fields.js`

**What it does:**

- Adds `status: 'active'` to all existing invoices
- Adds void/replace specific fields as null
- Creates performance indexes
- Validates migration success

**Key fields being added:**

```javascript
{
  status: 'active',           // Invoice lifecycle status
  voidedAt: null,             // When invoice was voided
  voidReason: null,           // Reason for voiding
  voidedBy: null,             // User who voided
  replacedBy: null,           // New invoice ID
  replacesInvoice: null,      // Old invoice ID
  originalAmount: null,       // Amount from replaced invoice
  additionalAmount: null,      // New products amount
  notes: null                 // Additional notes
}
```

### Step 1.2: Test Migration on Staging

```bash
# Navigate to project root
cd d:\MudasirTraders

# Run migration on staging database
node migrations/add-invoice-void-fields.js

# Expected output:
# 🔄 Starting Invoice Void/Replace Migration...
# 📊 Analyzing current invoice collection...
#    Total invoices: 1,247
#    With status field: 0
#    Without status field: 1,247
# 🔧 Adding status field to invoices...
#    ✅ Updated 1,247 invoices
# 📊 Creating indexes...
#    ✅ Created index on status field
#    ✅ Created index on replacedBy field
#    ✅ Created index on replacesInvoice field
#    ✅ Created compound index on status + createdAt
# 🎉 Migration completed successfully!
```

### Step 1.3: Validate Migration Results

After migration, verify:

- All invoices have `status: 'active'`
- New indexes are created
- No data corruption
- Existing functionality works

### Step 1.4: Production Migration

```bash
# Backup production database first!
# Then run migration:
node migrations/add-invoice-void-fields.js

# Monitor for any errors
# Verify dashboard stats remain accurate
```

### Step 1.5: Rollback Plan (If Needed)

```bash
# If migration fails, rollback:
node migrations/add-invoice-void-fields.js rollback
```

---

## 📝 Phase 2: Type Definitions

### Step 2.1: Update Invoice Interface

**File:** `src/interfaces/index.ts`

Add to existing InvoiceData interface:

```typescript
export interface InvoiceData {
  // ... existing fields
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'partial'; // ✅ Keep existing
  invoiceDate: Date;
  dueDate?: Date;
  notes?: string;

  // NEW VOID/REPLACE FIELDS:
  status?: 'active' | 'voided' | 'cancelled';
  voidedAt?: Date;
  voidReason?: string;
  voidedBy?: string;
  replacedBy?: string;
  replacesInvoice?: string;
  originalAmount?: number;
  additionalAmount?: number;
}
```

### Step 2.2: Add Supporting Types

```typescript
// Add to interfaces file:
export interface VoidReplaceResult {
  newInvoice: InvoiceData;
  voidedInvoice: InvoiceData;
  success: boolean;
}

export interface InvoiceTransferChain {
  chain: InvoiceData[];
  success: boolean;
}

export interface VoidReplaceRequest {
  additionalProducts: InvoiceItem[];
  additionalNotes?: string;
}
```

---

## 🔧 Phase 3: Core Business Logic

### Step 3.1: Create Core Void Function

**File:** `src/actions/invoiceActions.ts`

```typescript
export async function voidAndReplaceInvoice(
  originalInvoiceId: string,
  additionalProducts: InvoiceItem[],
  additionalNotes?: string,
  userId?: string
): Promise<VoidReplaceResult> {
  try {
    const db = await connectToMongoDB();
    const invoiceCollection = db.collection('invoices');

    // 1. Validate original invoice
    const originalInvoice = await invoiceCollection.findOne({
      _id: new ObjectId(originalInvoiceId),
    });

    if (!originalInvoice) {
      throw new Error('Original invoice not found');
    }

    if (originalInvoice.status === 'voided') {
      throw new Error('Invoice already voided');
    }

    // 2. Calculate additional amount
    const additionalAmount = additionalProducts.reduce(
      (sum, product) => sum + (product.totalPrice || 0),
      0
    );

    // 3. Void the original invoice
    await invoiceCollection.updateOne(
      { _id: new ObjectId(originalInvoiceId) },
      {
        $set: {
          status: 'voided',
          voidedAt: new Date(),
          voidReason: 'Replaced with additional products',
          voidedBy: userId,
          notes: additionalNotes,
        },
      }
    );

    // 4. Create new invoice with combined products
    const combinedProducts = [...originalInvoice.items, ...additionalProducts];

    const newInvoiceData = {
      invoiceNumber: await generateInvoiceNumber(),
      customerName: originalInvoice.customerName,
      customerPhone: originalInvoice.customerPhone,
      customerAddress: originalInvoice.customerAddress,
      items: combinedProducts,
      subtotal:
        originalInvoice.subtotal +
        additionalProducts.reduce(
          (sum, p) => sum + p.unitPrice * p.quantity,
          0
        ),
      taxAmount: originalInvoice.taxAmount, // Recalculate if needed
      totalAmount: originalInvoice.totalAmount + additionalAmount,
      paymentMethod: originalInvoice.paymentMethod,
      paymentStatus: 'pending', // New invoice starts as pending
      invoiceDate: new Date(),
      dueDate: originalInvoice.dueDate,
      notes: `Replaces Invoice #${originalInvoice.invoiceNumber} + additional items${additionalNotes ? ': ' + additionalNotes : ''}`,

      // Void/replace fields
      status: 'active',
      replacesInvoice: originalInvoiceId,
      originalAmount: originalInvoice.totalAmount,
      additionalAmount: additionalAmount,
      createdAt: new Date(),
    };

    // 5. Insert new invoice
    const result = await invoiceCollection.insertOne(newInvoiceData);
    const newInvoiceId = result.insertedId.toString();

    // 6. Update original invoice with new invoice reference
    await invoiceCollection.updateOne(
      { _id: new ObjectId(originalInvoiceId) },
      {
        $set: {
          replacedBy: newInvoiceId,
        },
      }
    );

    // 7. Update stock for additional products only
    await updateStockForProducts(additionalProducts, 'deduct');

    // 8. Revalidate cache
    revalidateInvoicePaths();

    return {
      newInvoice: { ...newInvoiceData, _id: newInvoiceId },
      voidedInvoice: { ...originalInvoice, status: 'voided' },
      success: true,
    };
  } catch (error) {
    console.error('Error voiding and replacing invoice:', error);
    throw error;
  }
}
```

### Step 3.2: Add Transfer Chain Function

```typescript
export async function getInvoiceTransferChain(
  invoiceId: string
): Promise<InvoiceTransferChain> {
  try {
    const db = await connectToMongoDB();
    const invoiceCollection = db.collection('invoices');

    const chain = [];
    let currentId = invoiceId;

    // Build chain forward (replacedBy)
    while (currentId) {
      const invoice = await invoiceCollection.findOne({
        _id: new ObjectId(currentId),
      });

      if (!invoice) break;

      chain.push(invoice);

      // Follow replacedBy link
      if (invoice.replacedBy) {
        currentId = invoice.replacedBy;
      } else {
        break;
      }
    }

    // Also check backwards (replacesInvoice)
    const originalInvoice = await invoiceCollection.findOne({
      replacedBy: new ObjectId(invoiceId),
    });

    if (originalInvoice) {
      chain.unshift(originalInvoice);
    }

    return {
      chain: chain.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      ),
      success: true,
    };
  } catch (error) {
    console.error('Error getting invoice transfer chain:', error);
    return { chain: [], success: false };
  }
}
```

### Step 3.3: Add Helper Functions

```typescript
async function generateInvoiceNumber(): Promise<string> {
  // Your existing invoice number generation logic
  const db = await connectToMongoDB();
  const lastInvoice = await db
    .collection('invoices')
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  // Generate next number based on your existing logic
  return `INV-${Date.now()}`;
}

async function updateStockForProducts(
  products: InvoiceItem[],
  operation: 'deduct' | 'add'
) {
  // Your existing stock update logic
  // Only update for additional products in void/replace scenario
  for (const product of products) {
    // Update stock quantity
    // Add to stock history
    // Handle errors
  }
}
```

---

## 🌐 Phase 4: API Endpoints

### Step 4.1: Create Void/Replace API

**File:** `src/app/api/invoices/[id]/void-and-replace/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { voidAndReplaceInvoice } from '@/actions/invoiceActions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id'); // Get from auth
    const { additionalProducts, additionalNotes } = await request.json();

    // Validate request
    if (!additionalProducts || !Array.isArray(additionalProducts)) {
      return NextResponse.json(
        { error: 'Invalid products data' },
        { status: 400 }
      );
    }

    // Validate products structure
    for (const product of additionalProducts) {
      if (
        !product.brandName ||
        !product.series ||
        !product.quantity ||
        !product.unitPrice
      ) {
        return NextResponse.json(
          { error: 'Invalid product structure' },
          { status: 400 }
        );
      }
    }

    // Perform void and replace
    const result = await voidAndReplaceInvoice(
      params.id,
      additionalProducts,
      additionalNotes,
      userId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 4.2: Create Transfer Chain API

**File:** `src/app/api/invoices/[id]/transfer-chain/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getInvoiceTransferChain } from '@/actions/invoiceActions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getInvoiceTransferChain(params.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Transfer Chain API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Phase 5: UI Components

### Step 5.1: Update Invoice Detail Page

**File:** `src/features/invoice-management/ui/components/InvoiceDetail.tsx`

```typescript
import { useState } from 'react';
import VoidReplaceModal from './VoidReplaceModal';

export function InvoiceDetail({ invoice }: { invoice: InvoiceData }) {
  const [showVoidReplaceModal, setShowVoidReplaceModal] = useState(false);

  return (
    <div>
      {/* Existing invoice details */}

      {/* Add void/replace button - only show for active invoices */}
      {invoice.status !== 'voided' && (
        <button
          onClick={() => setShowVoidReplaceModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Add Products & Create New Invoice
        </button>
      )}

      {/* Show transfer relationships */}
      {invoice.replacesInvoice && (
        <div className="mt-4 p-3 bg-orange-50 rounded">
          <span className="text-orange-600 font-medium">
            Replaces Invoice #{invoice.replacesInvoice.slice(-6)}
          </span>
        </div>
      )}

      {invoice.replacedBy && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <span className="text-gray-600">
            Voided → Replaced by{' '}
            <a href={`/invoices/${invoice.replacedBy}`} className="text-blue-600 hover:underline">
              Invoice #{invoice.replacedBy.slice(-6)}
            </a>
          </span>
        </div>
      )}

      {/* Void/Replace Modal */}
      {showVoidReplaceModal && (
        <VoidReplaceModal
          originalInvoice={invoice}
          onClose={() => setShowVoidReplaceModal(false)}
          onSuccess={(newInvoice) => {
            // Redirect to new invoice
            window.location.href = `/invoices/${newInvoice._id}`;
          }}
        />
      )}
    </div>
  );
}
```

### Step 5.2: Create Void Replace Modal

**File:** `src/features/invoice-management/ui/components/VoidReplaceModal.tsx`

```typescript
import { useState } from 'react';
import { InvoiceData, InvoiceItem } from '@/interfaces';

interface VoidReplaceModalProps {
  originalInvoice: InvoiceData;
  onClose: () => void;
  onSuccess: (newInvoice: InvoiceData) => void;
}

export default function VoidReplaceModal({
  originalInvoice,
  onClose,
  onSuccess
}: VoidReplaceModalProps) {
  const [additionalProducts, setAdditionalProducts] = useState<InvoiceItem[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddProduct = (product: InvoiceItem) => {
    setAdditionalProducts([...additionalProducts, product]);
  };

  const handleRemoveProduct = (index: number) => {
    setAdditionalProducts(additionalProducts.filter((_, i) => i !== index));
  };

  const calculateAdditionalTotal = () => {
    return additionalProducts.reduce((sum, product) => sum + product.totalPrice, 0);
  };

  const calculateNewTotal = () => {
    return originalInvoice.totalAmount + calculateAdditionalTotal();
  };

  const handleSubmit = async () => {
    if (additionalProducts.length === 0) {
      setError('Please add at least one additional product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/invoices/${originalInvoice._id}/void-and-replace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalProducts,
          additionalNotes
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create new invoice');
      }

      onSuccess(result.newInvoice);
      onClose();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Products & Create New Invoice</h2>

        {/* Original Invoice Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Original Invoice: #{originalInvoice.invoiceNumber}</h3>
          <p>Customer: {originalInvoice.customerName}</p>
          <p>Current Total: Rs {originalInvoice.totalAmount.toLocaleString()}</p>
          <p>Items: {originalInvoice.items.length}</p>
        </div>

        {/* Additional Products */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Additional Products</h3>

          {/* Product selector - integrate with your existing product selection */}
          <ProductSelector onProductSelect={handleAddProduct} />

          {/* Selected additional products */}
          {additionalProducts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Selected Additional Products:</h4>
              {additionalProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span>{product.brandName} {product.series} - {product.quantity} x Rs {product.unitPrice}</span>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Any additional notes for this replacement..."
          />
        </div>

        {/* Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p>Original Amount: Rs {originalInvoice.totalAmount.toLocaleString()}</p>
          <p>Additional Amount: Rs {calculateAdditionalTotal().toLocaleString()}</p>
          <p className="font-bold">New Total: Rs {calculateNewTotal().toLocaleString()}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            disabled={loading || additionalProducts.length === 0}
          >
            {loading ? 'Creating...' : 'Create New Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 5.3: Update Invoice List

**File:** `src/features/invoice-management/ui/components/InvoiceDataTable.tsx`

```typescript
// Add status column to invoice table
const columns = [
  // ... existing columns

  {
    header: 'Status',
    accessorKey: 'status',
    cell: (invoice: InvoiceData) => (
      <div>
        {invoice.status === 'voided' ? (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
            VOIDED
          </span>
        ) : (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            ACTIVE
          </span>
        )}
      </div>
    )
  },

  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: (invoice: InvoiceData) => (
      <div className="flex space-x-2">
        {/* Existing actions */}

        {/* Transfer chain link */}
        {invoice.replacedBy && (
          <a
            href={`/invoices/${invoice.replacedBy}`}
            className="text-blue-600 hover:underline text-sm"
          >
            View Replacement →
          </a>
        )}
      </div>
    )
  }
];
```

---

## 📊 Phase 6: Reports & Dashboard Updates

### Step 6.1: Update Dashboard Stats

**File:** `src/actions/dashboardActions.ts`

```typescript
// Update all sales queries to exclude voided invoices
export async function getDashboardStats() {
  try {
    const db = await connectToMongoDB();
    const salesCollection = db.collection('invoices');

    // Add status filter to exclude voided invoices
    const salesData = await salesCollection
      .find({
        status: { $ne: 'voided' }, // 🎯 KEY CHANGE
        // ... existing filters
      })
      .toArray();

    // Rest of your existing logic remains the same
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    return {
      totalSales,
      totalRevenue,
      // ... other existing metrics
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}
```

### Step 6.2: Update Profit Analysis

```typescript
export async function calculateProfitForDateRange(
  startDate: Date,
  endDate: Date
) {
  try {
    const db = await connectToMongoDB();
    const salesCollection = db.collection('invoices');

    // Exclude voided invoices from profit calculation
    const sales = await salesCollection
      .find({
        invoiceDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'voided' }, // 🎯 KEY CHANGE
        paymentStatus: 'paid', // Only include paid invoices
      })
      .toArray();

    // Rest of your existing profit calculation logic
    // ...
  } catch (error) {
    console.error('Error calculating profit:', error);
    throw error;
  }
}
```

### Step 6.3: Update Sales Trend Chart

```typescript
// Ensure chart data excludes voided invoices
export async function getSalesTrendData(dateRange: DateRange) {
  const db = await connectToMongoDB();
  const salesCollection = db.collection('invoices');

  const sales = await salesCollection
    .find({
      invoiceDate: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $ne: 'voided' }, // 🎯 KEY CHANGE
    })
    .toArray();

  // Rest of your chart data processing
  // ...
}
```

---

## 🧪 Phase 7: Testing

### Step 7.1: Unit Tests

```typescript
// File: __tests__/invoiceActions.test.ts
describe('voidAndReplaceInvoice', () => {
  test('should void original and create new invoice', async () => {
    // Test implementation
  });

  test('should handle already voided invoice', async () => {
    // Test error handling
  });

  test('should update stock correctly', async () => {
    // Test stock updates
  });
});
```

### Step 7.2: Integration Tests

```typescript
// Test API endpoints
describe('POST /api/invoices/[id]/void-and-replace', () => {
  test('should create new invoice successfully', async () => {
    // Test API integration
  });

  test('should validate request data', async () => {
    // Test validation
  });
});
```

### Step 7.3: Manual Testing Checklist

- [ ] Migration runs successfully
- [ ] Existing invoices show as 'active'
- [ ] Void/replace button appears for active invoices
- [ ] Modal opens and functions correctly
- [ ] New invoice created with combined products
- [ ] Original invoice marked as voided
- [ ] Transfer chain displays correctly
- [ ] Dashboard stats exclude voided invoices
- [ ] Stock updated for additional products only
- [ ] Payment flow works with new invoice

---

## 🚀 Phase 8: Deployment

### Step 8.1: Pre-Deployment Checklist

- [ ] Migration tested on staging
- [ ] All code reviewed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Backup of production database
- [ ] Deployment window scheduled

### Step 8.2: Deployment Steps

1. **Run migration on production**
2. **Deploy updated code**
3. **Monitor system performance**
4. **Verify dashboard accuracy**
5. **Test void/replace functionality**
6. **Monitor error logs**

### Step 8.3: Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Check user feedback
- [ ] Verify reports accuracy
- [ ] Document any issues

---

## 📚 Phase 9: Documentation

### Step 9.1: User Documentation

Create user guide:

- How to void and replace invoices
- Understanding transfer chains
- Reading updated reports

### Step 9.2: Technical Documentation

Update API documentation:

- New endpoints
- Request/response formats
- Error handling

### Step 9.3: Admin Documentation

Create admin guide:

- Migration procedures
- Troubleshooting
- Audit procedures

---

## 🔍 Phase 10: Monitoring & Maintenance

### Step 10.1: Monitoring

- Track void/replace usage
- Monitor report accuracy
- Check system performance
- Watch for errors

### Step 10.2: Maintenance

- Regular backup checks
- Index optimization
- User feedback collection
- Feature improvements

---

## 🎯 Success Metrics

### Technical Metrics

- [ ] Zero downtime during deployment
- [ ] No impact on existing functionality
- [ ] 100% audit trail coverage
- [ ] Report accuracy maintained

### Business Metrics

- [ ] Reduced customer confusion
- [ ] Improved invoice management
- [ ] Better audit compliance
- [ ] Enhanced user experience

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Migration fails

**Solution:** Check database connection, verify permissions, rollback if needed

#### Issue: Reports show incorrect totals

**Solution:** Verify status filter applied correctly, check indexes

#### Issue: Stock not updated correctly

**Solution:** Check stock update logic, verify product data structure

#### Issue: Transfer chain not showing

**Solution:** Verify replacedBy/replacesInvoice links, check API response

#### Issue: Performance issues

**Solution:** Check indexes, optimize queries, monitor database load

---

## 📞 Support

For issues with this implementation:

1. Check this guide first
2. Review error logs
3. Test on staging environment
4. Contact development team

---

## 📝 Version History

- **v1.0** - Initial implementation guide
- **v1.1** - Added troubleshooting section
- **v1.2** - Updated with testing procedures

---

_This guide provides complete step-by-step instructions for implementing the invoice void and replace feature. Follow each phase in order for successful deployment._
