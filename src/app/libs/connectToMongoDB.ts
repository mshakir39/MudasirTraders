import { Db, MongoClient } from 'mongodb';

interface MongoConnection {
  client: MongoClient | null;
  db: Db | null;
  lastUsed: number;
  isConnecting: boolean;
}

let connection: MongoConnection = {
  client: null,
  db: null,
  lastUsed: 0,
  isConnecting: false,
};

const CONNECTION_TIMEOUT = 3 * 60 * 1000;
const IDLE_TIMEOUT = 2 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;
let handlersAdded = false;

function extractDbNameFromUri(uri: string): string | null {
  try {
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  } catch (error) {
    console.warn('Could not extract database name from URI:', error);
    return null;
  }
}

export async function connectToMongoDB(): Promise<Db | null> {
  // During build time, return null to prevent connection attempts
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('🚫 Skipping MongoDB connection during build phase');
    return null;
  }

  const currentTime = Date.now();

  if (connection.isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (connection.db) return connection.db;
  }

  if (connection.client && connection.db && !connection.isConnecting) {
    const timeSinceLastUsed = currentTime - connection.lastUsed;
    
    if (timeSinceLastUsed < CONNECTION_TIMEOUT) {
      try {
        await connection.client.db().admin().ping();
        connection.lastUsed = currentTime;
        scheduleCleanup();
        return connection.db;
      } catch (error) {
        console.warn('⚠️ MongoDB connection ping failed, reconnecting...', error);
        await closeConnection();
      }
    } else {
      console.log('🕐 MongoDB connection expired, creating new connection...');
      await closeConnection();
    }
  }

  if (connection.isConnecting) {
    return null;
  }

  connection.isConnecting = true;

  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      connection.isConnecting = false;
      console.error('❌ MONGODB_URI is not defined in environment variables');
      return null;
    }

    const dbName = extractDbNameFromUri(uri) || 'mudasirtraders';

    const client = new MongoClient(uri, {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 3 : 5,
      minPoolSize: 0,
      maxIdleTimeMS: IDLE_TIMEOUT,
      connectTimeoutMS: 15000, // Increased timeout
      socketTimeoutMS: 45000,  // Increased timeout
      waitQueueTimeoutMS: 10000,
      serverSelectionTimeoutMS: 15000,
      heartbeatFrequencyMS: 30000,
      maxConnecting: 1,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
    });

    console.log(`🔄 Connecting to MongoDB database: ${dbName}`);
    
    // Add connection timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 20000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    
    const db = client.db(dbName);
    await db.admin().ping();

    connection.client = client;
    connection.db = db;
    connection.lastUsed = currentTime;
    connection.isConnecting = false;

    console.log(`✅ Connected to MongoDB database: ${dbName}`);

    if (!handlersAdded) {
      setupEventHandlers(client);
      handlersAdded = true;
    }

    scheduleCleanup();
    return db;

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    connection.isConnecting = false;
    await closeConnection();
    return null; // Return null instead of throwing
  }
}

function setupEventHandlers(client: MongoClient) {
  client.on('close', () => {
    console.log('⚡ MongoDB connection closed.');
    resetConnection();
  });

  client.on('timeout', () => {
    console.log('⚡ MongoDB connection timeout.');
    resetConnection();
  });

  client.on('error', (error) => {
    console.error('⚡ MongoDB connection error:', error);
    resetConnection();
  });

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Gracefully shutting down MongoDB connection.`);
      await closeConnection();
      process.exit(0);
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }
}

function resetConnection() {
  connection.client = null;
  connection.db = null;
  connection.lastUsed = 0;
  connection.isConnecting = false;
  
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }
}

function scheduleCleanup() {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  cleanupTimer = setTimeout(async () => {
    const timeSinceLastUsed = Date.now() - connection.lastUsed;
    if (timeSinceLastUsed >= IDLE_TIMEOUT) {
      console.log('🧹 Auto-closing idle MongoDB connection');
      await closeConnection();
    }
  }, IDLE_TIMEOUT + 10000);
}

async function closeConnection() {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  if (connection.client) {
    try {
      await connection.client.close(true);
      console.log('✅ MongoDB connection closed successfully.');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }
  
  resetConnection();
}

export async function closeMongoConnection() {
  await closeConnection();
}

export function getConnectionStats() {
  return {
    isConnected: !!connection.client && !!connection.db,
    lastUsed: connection.lastUsed,
    timeSinceLastUsed: connection.lastUsed ? Date.now() - connection.lastUsed : 0,
    isConnecting: connection.isConnecting,
  };
}