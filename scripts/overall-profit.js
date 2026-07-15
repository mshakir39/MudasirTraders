#!/usr/bin/env node
require('dotenv/config');
const { MongoClient } = require('mongodb');

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-PK');
}

async function getHistoricalCost(db, brandName, series, saleDate, historyCache, stockCache) {
  const cacheKey = `${brandName}::${series}::${saleDate.toISOString()}`;
  if (historyCache.has(cacheKey)) {
    return historyCache.get(cacheKey);
  }

  const historyEntry = await db
    .collection('stockHistory')
    .find({
      brandName,
      series,
      historyDate: { $lte: saleDate },
    })
    .sort({ historyDate: -1 })
    .limit(1)
    .toArray();

  let cost = 0;

  if (historyEntry.length > 0) {
    cost = Number(historyEntry[0].newCost) || 0;
  } else {
    if (stockCache.has(brandName)) {
      cost = stockCache.get(brandName);
    } else {
      const currentStock = await db.collection('stock').findOne({ brandName });
      if (currentStock && currentStock.seriesStock) {
        const seriesData = currentStock.seriesStock.find((s) => s.series === series);
        cost = Number(seriesData?.productCost) || 0;
      }
      stockCache.set(brandName, cost);
    }
  }

  historyCache.set(cacheKey, cost);
  return cost;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName =
    process.env.MONGODB_DB ||
    (uri ? uri.match(/\/([^/?]+)(?:\?|$)/)?.[1] : null) ||
    'batteryStore';

  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const sales = await db.collection('sales').find({}, {
      projection: {
        date: 1,
        createdAt: 1,
        saleDate: 1,
        products: 1,
        isChargingService: 1,
        isScrapBattery: 1,
      },
    }).toArray();

    const historyCache = new Map();
    const stockCache = new Map();

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let saleCount = 0;
    let earliestDate = null;
    let latestDate = null;

    console.log(`Scanning ${sales.length} sales...`);

    for (let index = 0; index < sales.length; index += 1) {
      const sale = sales[index];
      const saleDate = new Date(sale.date || sale.createdAt || sale.saleDate);
      if (Number.isNaN(saleDate.getTime())) {
        continue;
      }

      if (!earliestDate || saleDate < earliestDate) earliestDate = saleDate;
      if (!latestDate || saleDate > latestDate) latestDate = saleDate;

      if (sale.isChargingService || sale.isScrapBattery) {
        continue;
      }

      if (!Array.isArray(sale.products)) {
        continue;
      }

      for (const product of sale.products) {
        const brandName = product.brandName;
        const series = product.series;
        const quantity = Number(product.quantity) || 0;
        const sellingPrice = Number(product.productPrice) || 0;

        if (!brandName || !series || quantity === 0 || sellingPrice === 0) {
          continue;
        }

        const historicalCost = await getHistoricalCost(
          db,
          brandName,
          series,
          saleDate,
          historyCache,
          stockCache
        );
        const saleRevenue = sellingPrice * quantity;
        const saleCost = historicalCost * quantity;
        const saleProfit = saleRevenue - saleCost;

        totalRevenue += saleRevenue;
        totalCost += saleCost;
        totalProfit += saleProfit;
        saleCount += 1;
      }

      if ((index + 1) % 100 === 0 || index + 1 === sales.length) {
        process.stdout.write(`Processed ${index + 1}/${sales.length} sales\r`);
      }
    }

    console.log('\n📊 Overall profit summary');
    console.log('Method: sales + historical cost (matches dashboard logic)');
    console.log(`Sales processed: ${saleCount}`);
    console.log(`Revenue: ${formatCurrency(totalRevenue)}`);
    console.log(`Cost: ${formatCurrency(totalCost)}`);
    console.log(`Profit: ${formatCurrency(totalProfit)}`);
    console.log(`Margin: ${(totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0).toFixed(2)}%`);
    console.log(`From: ${formatDate(earliestDate)}`);
    console.log(`To: ${formatDate(latestDate)}`);
  } catch (error) {
    console.error('❌ Failed to calculate overall profit:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
