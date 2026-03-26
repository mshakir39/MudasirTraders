// lib/connectToMongoDB.ts
import { Db, MongoClient } from 'mongodb';

// ============================================================
// Config
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

function extractDbNameFromUri(uri: string): string | null {
  try {
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const MONGODB_DB =
  process.env.MONGODB_DB ||
  extractDbNameFromUri(MONGODB_URI) ||
  'batteryStore';

// ============================================================
// Global singleton — survives Next.js hot reloads in dev
// ============================================================

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
  var _mongoConnecting: Promise<Db | null> | undefined;
}

// ============================================================
// Main connect function
// ============================================================

export async function connectToMongoDB(): Promise<Db | null> {
  // 1. Already connected — return immediately
  if (global._mongoDb) {
    return global._mongoDb;
  }

  // 2. Connection in progress — wait for it instead of opening a second one
  if (global._mongoConnecting) {
    return global._mongoConnecting;
  }

  // 3. Skip during Next.js build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('🚫 Skipping MongoDB connection during build phase');
    return null;
  }

  // 4. Create new connection
  global._mongoConnecting = (async () => {
    try {
      console.log('🔗 Connecting to MongoDB...');

      const client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,           // keep at least 2 connections warm
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });

      await client.connect();
      const db = client.db(MONGODB_DB);

      // Ping to verify connection is actually alive
      await db.command({ ping: 1 });

      global._mongoClient = client;
      global._mongoDb = db;
      global._mongoConnecting = undefined;

      console.log(`✅ MongoDB connected — db: ${MONGODB_DB}`);
      return db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      global._mongoConnecting = undefined;
      return null;
    }
  })();

  return global._mongoConnecting;
}

// ============================================================
// Utilities
// ============================================================

export async function closeMongoConnection(): Promise<void> {
  if (global._mongoClient) {
    try {
      await global._mongoClient.close();
      console.log('🔌 MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    } finally {
      global._mongoClient = undefined;
      global._mongoDb = undefined;
      global._mongoConnecting = undefined;
    }
  }
}

export function getConnectionStats() {
  return {
    isConnected: !!global._mongoDb,
    isConnecting: !!global._mongoConnecting,
  };
}

export function isBuildMode(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export { MONGODB_DB };