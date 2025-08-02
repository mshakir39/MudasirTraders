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
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' &&
      process.env.VERCEL_ENV === undefined)
  ) {
    console.log('🚫 Skipping MongoDB connection during build phase');
    return null;
  }

  const currentTime = Date.now();

  // If already connecting, wait and return existing connection
  if (connection.isConnecting) {
    let attempts = 0;
    while (connection.isConnecting && attempts < 50) {
      // Wait up to 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    if (connection.db) return connection.db;
  }

  // Check if existing connection is still valid
  if (connection.client && connection.db && !connection.isConnecting) {
    const timeSinceLastUsed = currentTime - connection.lastUsed;

    if (timeSinceLastUsed < CONNECTION_TIMEOUT) {
      try {
        // Quick ping to verify connection is alive
        await connection.client.db().admin().ping();
        connection.lastUsed = currentTime;
        scheduleCleanup();
        return connection.db;
      } catch (error) {
        console.warn(
          '⚠️ MongoDB connection ping failed, reconnecting...',
          error
        );
        await closeConnection();
      }
    } else {
      console.log('🕐 MongoDB connection expired, creating new connection...');
      await closeConnection();
    }
  }

  // Prevent multiple simultaneous connections
  if (connection.isConnecting) {
    return null;
  }

  connection.isConnecting = true;

  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      connection.isConnecting = false;
      console.error('❌ MONGODB_URI is not defined in environment variables');
      throw new Error('MONGODB_URI is not defined');
    }

    const dbName = extractDbNameFromUri(uri) || 'mudasirtraders';

    const client = new MongoClient(uri, {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 3 : 5,
      minPoolSize: 0,
      maxIdleTimeMS: IDLE_TIMEOUT,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
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

    // Connect with timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Connection timeout after 20 seconds')),
        20000
      )
    );

    await Promise.race([connectPromise, timeoutPromise]);

    const db = client.db(dbName);

    // Test the connection
    await db.admin().ping();

    // Save the connection
    connection.client = client;
    connection.db = db;
    connection.lastUsed = currentTime;
    connection.isConnecting = false;

    console.log(`✅ Connected to MongoDB database: ${dbName}`);

    // Add event handlers only once
    if (!handlersAdded) {
      setupEventHandlers(client);
      handlersAdded = true;
    }

    // Schedule automatic cleanup
    scheduleCleanup();
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    connection.isConnecting = false;
    await closeConnection();
    throw error; // Throw the error so calling functions can handle it
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

  // Handle process termination
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const gracefulShutdown = async (signal: string) => {
      console.log(
        `Received ${signal}. Gracefully shutting down MongoDB connection.`
      );
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
    timeSinceLastUsed: connection.lastUsed
      ? Date.now() - connection.lastUsed
      : 0,
    isConnecting: connection.isConnecting,
  };
}

// Export a function to check if we're in build mode
export function isBuildMode(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' &&
      process.env.VERCEL_ENV === undefined)
  );
}
