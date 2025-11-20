// src/lib/logging/logger.ts
import type { Logger } from 'winston';
import path from 'path';

// Check if we're in test environment
const isTest = process.env.NODE_ENV === 'test';
const isBrowser = typeof window !== 'undefined';

let logger: Logger;

if (isTest) {
  // For tests, export simple mock functions that can be overridden
  logger = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
  } as unknown as Logger;
} else if (isBrowser) {
  // Browser-side mock logger
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log,
  } as unknown as Logger;
} else {
  // Server-side Winston logger setup
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log,
  } as unknown as Logger;

  // Server-side only - use dynamic imports to avoid require() warnings
  import('winston').then((winstonModule) => {
    const winston = winstonModule.default;
    
    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    
    logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'meal-service' },
      transports: [
        // Only add file transports on server
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          level: 'info'
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error'
        }),
        // Console output in development
        ...(process.env.NODE_ENV !== 'production' 
          ? [new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              )
            })]
          : []
        )
      ]
    });
  }).catch((error) => {
    console.error('Failed to initialize logger:', error);
    // Fallback to console logger
    logger = {
      info: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.log,
    } as unknown as Logger;
  });
}

export { logger };
