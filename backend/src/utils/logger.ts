/**
 * Simple logger utility that respects NODE_ENV
 * In production, only errors and warnings are logged
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[INFO]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  debug: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[DEBUG]', ...args);
    }
  }
};

export default logger;
