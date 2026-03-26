// logger.ts
// Centralized logging utility with environment-based control

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includePrefix: boolean;
}

class Logger {
  private config: LogConfig;
  private emojiMap: Record<LogLevel, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍',
  };

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development' ? true : true, // Always enabled but filtered by level
      level: process.env.NODE_ENV === 'development' ? 'info' : 'error', // Only errors in production
      includeTimestamp: true,
      includePrefix: true,
    };
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const emoji = this.emojiMap[level];
    const timestamp = this.config.includeTimestamp
      ? `[${new Date().toISOString()}] `
      : '';
    const prefix = this.config.includePrefix ? `${emoji} ` : '';

    let formattedMessage = `${timestamp}${prefix}${message}`;

    if (data !== undefined) {
      if (typeof data === 'object') {
        formattedMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        formattedMessage += ` ${data}`;
      }
    }

    return formattedMessage;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.config.enabled) return;

    // Filter logs based on level
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    switch (level) {
      case 'info':
        console.info(formattedMessage);
        break;
      case 'success':
        console.log(formattedMessage);
        break;
      case 'warning':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      success: 2,
      warning: 3,
      error: 4,
    };

    const currentLevel = levels[this.config.level];
    const messageLevel = levels[level];

    return messageLevel >= currentLevel;
  }

  // Public methods
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  success(message: string, data?: any): void {
    this.log('success', message, data);
  }

  warning(message: string, data?: any): void {
    this.log('warning', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  // Generic category-based logging method
  category(category: string, message: string, data?: any): void {
    const categoryEmoji = this.getCategoryEmoji(category);
    this.info(`${categoryEmoji} ${message}`, data);
  }

  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      // Business operations
      invoice: '�',
      stock: '��',
      sales: '💰',
      customer: '👤',
      product: '📦',
      order: '🛒',
      payment: '💳',
      warranty: '🔧',
      return: '🔄',
      refund: '💸',

      // System operations
      database: '💾',
      api: '🌐',
      auth: '🔐',
      cache: '⚡',
      server: '🖥️',
      network: '🌐',
      file: '📁',
      email: '📧',
      sms: '📱',

      // Development
      dev: '🔧',
      debug: '🔍',
      test: '🧪',
      build: '🏗️',
      deploy: '🚀',

      // Common categories
      system: '⚙️',
      config: '⚙️',
      security: '🔒',
      performance: '⚡',
      monitoring: '📊',
      backup: '💾',
      sync: '🔄',
      import: '📥',
      export: '📤',
      delete: '�️',
      create: '➕',
      update: '✏️',
      archive: '📚',
      restore: '♻️',

      // Default
      default: 'ℹ️',
    };

    return emojiMap[category.toLowerCase()] || emojiMap['default'];
  }

  // Configuration methods
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  // Utility method to check if logging is enabled
  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Convenience methods for common categories
  invoice(message: string, data?: any): void {
    this.category('invoice', message, data);
  }

  stock(message: string, data?: any): void {
    this.category('stock', message, data);
  }

  sales(message: string, data?: any): void {
    this.category('sales', message, data);
  }

  customer(message: string, data?: any): void {
    this.category('customer', message, data);
  }

  product(message: string, data?: any): void {
    this.category('product', message, data);
  }

  payment(message: string, data?: any): void {
    this.category('payment', message, data);
  }

  warranty(message: string, data?: any): void {
    this.category('warranty', message, data);
  }

  database(message: string, data?: any): void {
    this.category('database', message, data);
  }

  api(message: string, data?: any): void {
    this.category('api', message, data);
  }

  auth(message: string, data?: any): void {
    this.category('auth', message, data);
  }

  system(message: string, data?: any): void {
    this.category('system', message, data);
  }

  dev(message: string, data?: any): void {
    this.category('dev', message, data);
  }

  test(message: string, data?: any): void {
    this.category('test', message, data);
  }
}

// Create and export singleton instance
const logger = new Logger();

export default logger;

// Export types for TypeScript
export type { LogLevel, LogConfig };

// Export convenience functions for direct usage
export const log = {
  // Basic logging methods
  info: logger.info.bind(logger),
  success: logger.success.bind(logger),
  warning: logger.warning.bind(logger),
  error: logger.error.bind(logger),
  debug: logger.debug.bind(logger),

  // Generic category method
  category: logger.category.bind(logger),

  // Business operation methods
  invoice: logger.invoice.bind(logger),
  stock: logger.stock.bind(logger),
  sales: logger.sales.bind(logger),
  customer: logger.customer.bind(logger),
  product: logger.product.bind(logger),
  payment: logger.payment.bind(logger),
  warranty: logger.warranty.bind(logger),

  // System operation methods
  database: logger.database.bind(logger),
  api: logger.api.bind(logger),
  auth: logger.auth.bind(logger),
  system: logger.system.bind(logger),

  // Development methods
  dev: logger.dev.bind(logger),
  test: logger.test.bind(logger),

  // Configuration methods
  configure: logger.configure.bind(logger),
  enable: logger.enable.bind(logger),
  disable: logger.disable.bind(logger),
  isEnabled: logger.isEnabled.bind(logger),
};
