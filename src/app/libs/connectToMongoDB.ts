import { Db, MongoClient } from 'mongodb';

interface MongoConnection {
  client: MongoClient | null;
  db: Db | null;
  lastUsed: number;
  isConnecting: boolean; // Prevent multiple simultaneous connections
}

// Global connection object
let connection: MongoConnection = {
  client: null,
  db: null,
  lastUsed: 0,
  isConnecting: false,
};

// Connection timeout (3 minutes for serverless)
const CONNECTION_TIMEOUT = 3 * 60 * 1000;
const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes idle timeout

// Cleanup timer
let cleanupTimer: NodeJS.Timeout | null = null;

// Event handlers flag to prevent duplicate listeners
let handlersAdded = false;

// Helper function to extract database name from MongoDB URI
function extractDbNameFromUri(uri: string): string | null {
  try {
    // Match pattern: /databaseName? in the URI
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  } catch (error) {
    console.warn('Could not extract database name from URI:', error);
    return null;
  }
}

export async function connectToMongoDB(): Promise<Db | null> {
  const currentTime = Date.now();

  // If already connecting, wait a bit and retry
  if (connection.isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (connection.db) return connection.db;
  }

  // Check if existing connection is still valid and not too old
  if (connection.client && connection.db && !connection.isConnecting) {
    const timeSinceLastUsed = currentTime - connection.lastUsed;
    
    if (timeSinceLastUsed < CONNECTION_TIMEOUT) {
      try {
        // Quick ping to verify connection
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

  // Prevent multiple simultaneous connections
  if (connection.isConnecting) {
    return null;
  }

  connection.isConnecting = true;

  try {
    // Use single MONGODB_URI for both production and development
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      connection.isConnecting = false;
      throw new Error(`❌ MONGODB_URI is not defined in environment variables`);
    }

    // Extract database name from the URI or use a default
    const dbName = extractDbNameFromUri(uri) || 'mudasirtraders';

    // Optimized settings for serverless and connection limits
    const client = new MongoClient(uri, {
      maxPoolSize: 3, // Further reduced for serverless
      minPoolSize: 0, // No minimum connections
      maxIdleTimeMS: IDLE_TIMEOUT,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      waitQueueTimeoutMS: 5000, // Reduced wait time
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000, // Reduce heartbeat frequency
      maxConnecting: 1, // Limit concurrent connection attempts
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
    });

    console.log(`🔄 Connecting to MongoDB database: ${dbName}`);
    await client.connect();
    
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
    throw error;
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

  // For serverless, we rely on the platform's cleanup rather than process signals
  // But keep this for local development
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
  // Clear existing timer
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  // Schedule cleanup after idle timeout
  cleanupTimer = setTimeout(async () => {
    const timeSinceLastUsed = Date.now() - connection.lastUsed;
    if (timeSinceLastUsed >= IDLE_TIMEOUT) {
      console.log('🧹 Auto-closing idle MongoDB connection');
      await closeConnection();
    }
  }, IDLE_TIMEOUT + 10000); // Add 10 seconds buffer
}

async function closeConnection() {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  if (connection.client) {
    try {
      await connection.client.close(true); // Force close
      console.log('✅ MongoDB connection closed successfully.');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }
  
  resetConnection();
}

// Export the close function for manual cleanup
export async function closeMongoConnection() {
  await closeConnection();
}

// Export function to get connection stats (for debugging)
export function getConnectionStats() {
  return {
    isConnected: !!connection.client && !!connection.db,
    lastUsed: connection.lastUsed,
    timeSinceLastUsed: connection.lastUsed ? Date.now() - connection.lastUsed : 0,
    isConnecting: connection.isConnecting,
  };
}