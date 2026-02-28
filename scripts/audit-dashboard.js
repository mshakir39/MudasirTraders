const { MongoClient } = require('mongodb');

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function parseArgValue(argv, name) {
  const prefix = `--${name}=`;
  const item = argv.find((a) => a.startsWith(prefix));
  return item ? item.slice(prefix.length) : undefined;
}

function formatMoneyPKR(value) {
  const n = toNumber(value);
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function buildKey(brandName, series) {
  return `${String(brandName || '').trim()}|||${String(series || '').trim()}`;
}

async function main() {
  const argv = process.argv.slice(2);

  const baseUrl =
    parseArgValue(argv, 'baseUrl') || process.env.AUDIT_BASE_URL || '';
  const revenueStartStr = parseArgValue(argv, 'revenueStart');
  const revenueEndStr = parseArgValue(argv, 'revenueEnd');

  const revenueStart = revenueStartStr ? new Date(revenueStartStr) : null;
  const revenueEnd = revenueEndStr ? new Date(revenueEndStr) : null;

  if (
    (revenueStart && Number.isNaN(revenueStart.getTime())) ||
    (revenueEnd && Number.isNaN(revenueEnd.getTime()))
  ) {
    throw new Error(
      'Invalid revenueStart/revenueEnd. Use ISO date like 2026-02-01T00:00:00.000Z'
    );
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI env var');
  }

  const dbName =
    process.env.MONGODB_DB ||
    (() => {
      const match = mongoUri.match(/\/([^/?]+)(?:\?|$)/);
      return match ? match[1] : 'batteryStore';
    })();

  const client = new MongoClient(mongoUri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  console.log('🔍 Dashboard Audit starting...');
  console.log('  DB:', dbName);
  if (revenueStart && revenueEnd) {
    console.log(
      '  DateRange:',
      revenueStart.toISOString(),
      '→',
      revenueEnd.toISOString()
    );
  } else {
    console.log('  DateRange: (all time)');
  }
  if (baseUrl) {
    console.log('  BaseUrl:', baseUrl);
  }

  await client.connect();
  const db = client.db(dbName);

  const [stockDocs, salesDocs, invoicesDocs] = await Promise.all([
    db.collection('stock').find().toArray(),
    db.collection('sales').find().toArray(),
    db.collection('invoices').find().toArray(),
  ]);

  // Inventory metrics
  let totalProducts = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const stockKeySet = new Set();
  const stockSoldCountMap = new Map();

  for (const doc of stockDocs) {
    const brand = String(doc?.brandName || '').trim();
    const seriesStock = Array.isArray(doc?.seriesStock) ? doc.seriesStock : [];
    for (const s of seriesStock) {
      const inStock = toNumber(s?.inStock);
      const productCost = toNumber(s?.productCost);
      const soldCount = Math.max(0, toNumber(s?.soldCount));

      totalProducts += inStock;
      totalInventoryValue += inStock * productCost;

      if (inStock === 0) outOfStockCount++;
      else if (inStock < 10) lowStockCount++;

      const key = buildKey(brand, s?.series);
      stockKeySet.add(key);
      stockSoldCountMap.set(key, soldCount);
    }
  }

  // Sales aggregation
  const salesCountMap = new Map();
  const filteredSales =
    revenueStart && revenueEnd
      ? salesDocs.filter((sale) => {
          const d = new Date(sale?.date || sale?.saleDate);
          if (Number.isNaN(d.getTime())) return false;
          return d >= revenueStart && d <= revenueEnd;
        })
      : salesDocs;

  const totalSalesRecords = Array.isArray(filteredSales)
    ? filteredSales.length
    : 0;
  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + toNumber(sale?.totalAmount),
    0
  );

  for (const sale of salesDocs) {
    if (sale?.isChargingService) continue; // exclude charging services from inventory sync

    const products = Array.isArray(sale?.products) ? sale.products : [];
    for (const p of products) {
      const brand = String(
        p?.brandName || p?.batteryDetails?.brandName || ''
      ).trim();
      const series = String(p?.series || p?.batteryDetails?.name || '').trim();
      const qty = toNumber(p?.quantity);
      if (!brand || !series || qty <= 0) continue;

      const key = buildKey(brand, series);
      salesCountMap.set(key, (salesCountMap.get(key) || 0) + qty);
    }
  }

  // Sync verification
  const mismatches = [];
  let syncedCount = 0;

  for (const [key, stockSold] of stockSoldCountMap.entries()) {
    const actualSales = salesCountMap.get(key) || 0;
    if (actualSales !== stockSold) {
      mismatches.push({
        key,
        stockSold,
        actualSales,
        diff: actualSales - stockSold,
      });
    } else {
      syncedCount++;
    }
  }

  const missingInStock = [];
  for (const [key, sold] of salesCountMap.entries()) {
    if (!stockKeySet.has(key)) {
      missingInStock.push({ key, sold });
    }
  }

  // Pending (from invoices)
  const pendingInvoices = invoicesDocs.filter((inv) => {
    const remaining = toNumber(inv?.remainingAmount);
    return inv?.isPayLater === true || remaining > 0;
  });
  const totalPending = pendingInvoices.reduce(
    (sum, inv) => sum + toNumber(inv?.remainingAmount),
    0
  );

  // Report
  console.log('\n# Inventory (from stock)');
  console.log('totalProducts:', totalProducts);
  console.log('totalInventoryValue:', formatMoneyPKR(totalInventoryValue));
  console.log('lowStockCount:', lowStockCount);
  console.log('outOfStockCount:', outOfStockCount);

  console.log('\n# Revenue (from sales)');
  console.log('totalSalesRecords:', totalSalesRecords);
  console.log('totalRevenue:', formatMoneyPKR(totalRevenue));

  console.log('\n# Pending (from invoices)');
  console.log('totalPending:', formatMoneyPKR(totalPending));
  console.log('pendingInvoices:', pendingInvoices.length);

  console.log('\n# Stock vs Sales Sync (lifetime)');
  console.log('stockKeys:', stockKeySet.size);
  console.log('salesKeys:', salesCountMap.size);
  console.log('syncedKeys:', syncedCount);
  console.log('mismatchedKeys:', mismatches.length);
  console.log('missingInStockKeys:', missingInStock.length);

  if (mismatches.length > 0) {
    console.log('\nTop mismatches (first 20):');
    mismatches.slice(0, 20).forEach((m) => {
      console.log(
        `- ${m.key.replace('|||', '-')} | stock=${m.stockSold} sales=${m.actualSales} diff=${m.diff}`
      );
    });
  }

  if (missingInStock.length > 0) {
    console.log('\nMissing in stock (first 20):');
    missingInStock.slice(0, 20).forEach((m) => {
      console.log(`- ${m.key.replace('|||', '-')} | sold=${m.sold}`);
    });
  }

  // Optional: compare with live dashboard endpoint
  if (baseUrl) {
    const qs = new URLSearchParams();
    if (revenueStart && revenueEnd) {
      qs.set('revenueStart', revenueStart.toISOString());
      qs.set('revenueEnd', revenueEnd.toISOString());
    }
    const url = `${baseUrl.replace(/\/$/, '')}/api/dashboard${qs.toString() ? `?${qs}` : ''}`;
    console.log('\n# Compare with /api/dashboard');
    console.log('fetch:', url);

    try {
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        console.log(`API returned ${response.status}:`, await response.text());
        return;
      }

      if (!contentType || !contentType.includes('application/json')) {
        console.log(
          'API returned non-JSON response. Is the dev server running?'
        );
        console.log('Content-Type:', contentType);
        const text = await response.text();
        console.log('First 200 chars:', text.substring(0, 200));
        return;
      }

      const dashboard = await response.json();

      if (!dashboard || typeof dashboard !== 'object') {
        console.log('Invalid dashboard API response:', dashboard);
        return;
      }

      const diffs = [];

      const checks = [
        ['totalProducts', totalProducts, dashboard.totalProducts],
        [
          'totalInventoryValue',
          Math.round(totalInventoryValue),
          Math.round(toNumber(dashboard.totalInventoryValue)),
        ],
        [
          'totalRevenue',
          Math.round(totalRevenue),
          Math.round(toNumber(dashboard.totalRevenue)),
        ],
        ['totalSales', totalSalesRecords, toNumber(dashboard.totalSales)],
        [
          'totalPending',
          Math.round(totalPending),
          Math.round(toNumber(dashboard.totalPending)),
        ],
      ];

      for (const [name, localVal, apiVal] of checks) {
        if (toNumber(localVal) !== toNumber(apiVal)) {
          diffs.push({ name, localVal, apiVal });
        }
      }

      if (diffs.length === 0) {
        console.log('✅ Dashboard API matches audit results for key totals');
      } else {
        console.log('❌ Dashboard API differs from audit results:');
        diffs.forEach((d) => {
          console.log(`- ${d.name}: audit=${d.localVal} api=${d.apiVal}`);
        });
      }
    } catch (error) {
      console.log('Error fetching dashboard API:', error.message);
    }
  }

  await client.close();
  console.log('\n✅ Audit completed');
}

main().catch((err) => {
  console.error('❌ Audit failed:', err);
  process.exitCode = 1;
});
