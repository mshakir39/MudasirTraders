#!/usr/bin/env node
require('dotenv/config');
const { MongoClient } = require('mongodb');

// Normalize series by replacing all symbols with spaces, then exact matching
function normalizeSeriesForMatching(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[\/\(\)\-\,\.\+]/g, ' ') // Replace symbols with spaces
    .replace(/([a-z])([0-9])/g, '$1 $2') // Add space between letters and numbers
    .replace(/([0-9])([a-z])/g, '$1 $2') // Add space between numbers and letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space before capitalized words
    .replace(/(thin)(thick)/g, '$1 $2') // Split ThinThick
    .replace(/(thinthick)/g, 'thin thick') // Handle combined form
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

async function checkSeriesNormalization() {
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
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const stockCollection = db.collection('stock');

    // Fetch all stock documents
    const allStock = await stockCollection.find({}).toArray();
    console.log(`\n📊 Found ${allStock.length} stock documents\n`);

    // Collect all series
    const allSeries = [];
    for (const stockDoc of allStock) {
      if (stockDoc.seriesStock && Array.isArray(stockDoc.seriesStock)) {
        for (const seriesItem of stockDoc.seriesStock) {
          allSeries.push({
            brand: stockDoc.brandName,
            original: seriesItem.series,
            normalized: normalizeSeriesForMatching(seriesItem.series),
            inStock: seriesItem.inStock,
            productCost: seriesItem.productCost
          });
        }
      }
    }

    console.log('📋 All Series Normalization Results:');
    console.log('='.repeat(100));
    console.log(`${'Brand'.padEnd(30)} | ${'Original'.padEnd(40)} | ${'Normalized'.padEnd(40)} | Stock`);
    console.log('='.repeat(100));

    // Sort by normalized value to see duplicates
    allSeries.sort((a, b) => a.normalized.localeCompare(b.normalized));

    // Track duplicates
    const normalizedMap = new Map();
    const duplicates = [];

    for (const item of allSeries) {
      console.log(`${item.brand.padEnd(30)} | ${item.original.padEnd(40)} | ${item.normalized.padEnd(40)} | ${item.inStock}`);
      
      // Check for duplicates
      if (normalizedMap.has(item.normalized)) {
        duplicates.push({
          normalized: item.normalized,
          items: [...normalizedMap.get(item.normalized), item]
        });
        normalizedMap.get(item.normalized).push(item);
      } else {
        normalizedMap.set(item.normalized, [item]);
      }
    }

    console.log('='.repeat(100));
    console.log(`\n📈 Total unique series: ${allSeries.length}`);

    // Show duplicates
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} potential duplicates (same normalized value):`);
      console.log('='.repeat(100));
      for (const dup of duplicates) {
        console.log(`\nNormalized: "${dup.normalized}"`);
        for (const item of dup.items) {
          console.log(`  - Brand: ${item.brand}, Original: "${item.original}", Stock: ${item.inStock}`);
        }
      }
    } else {
      console.log(`\n✅ No duplicates found in normalized series`);
    }

    // Test specific series
    console.log('\n🔍 Testing specific series:');
    const testSeries = 'MF 70 R/L (Thin/Thick Pole)';
    const normalizedTest = normalizeSeriesForMatching(testSeries);
    console.log(`Original: "${testSeries}"`);
    console.log(`Normalized: "${normalizedTest}"`);
    
    // Find matches
    const matches = allSeries.filter(item => item.normalized === normalizedTest);
    if (matches.length > 0) {
      console.log(`✅ Found ${matches.length} matching series in database:`);
      for (const match of matches) {
        console.log(`  - Brand: ${match.brand}, Original: "${match.original}", Stock: ${match.inStock}`);
      }
    } else {
      console.log(`❌ No matching series found in database`);
      console.log(`\n🔍 Closest matches (Levenshtein distance):`);
      // Find closest matches by character similarity
      const sortedBySimilarity = allSeries
        .map(item => ({
          ...item,
          similarity: calculateSimilarity(normalizedTest, item.normalized)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      
      for (const match of sortedBySimilarity) {
        console.log(`  - Brand: ${match.brand}, Original: "${match.original}", Similarity: ${match.similarity.toFixed(2)}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

// Simple similarity calculation (character overlap)
function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

checkSeriesNormalization();
