// src/lib/middleware/performance-monitor.ts
import { logger } from '../logging/logger'
import { captureErrorSafe } from '../utils/error-utils'

interface PerformanceMetrics {
  method: string;
  url: string;
  duration: number;
  requestId: string;
  status?: number;
  userAgent?: string;
  ip?: string;
}

interface RequestLike {
  method: string;
  url: string;
  headers: {
    get: (name: string) => string | null;
  };
}

export function withPerformanceMonitoring<T extends RequestLike>(
  handler: (req: T, ...args: unknown[]) => Promise<Response>
) {
  return async (req: T, ...args: unknown[]) => {
    const start = Date.now()
    const requestId = (global as { requestId?: string })?.requestId || crypto.randomUUID()
    
    // Extract request metadata
    const metadata: Partial<PerformanceMetrics> = {
      method: req.method,
      url: req.url,
      requestId,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    }

    try {
      logger.debug('API request started', {
        ...metadata,
        timestamp: new Date().toISOString()
      })

      const result = await handler(req, ...args)
      const duration = Date.now() - start
      
      const metrics: PerformanceMetrics = {
        ...metadata as PerformanceMetrics,
        duration,
        status: result?.status || 200
      }

      // Log performance metrics
      logger.info('API request completed', {
        ...metrics,
        timestamp: new Date().toISOString()
      })
      
      // Alert if response time exceeds threshold
      const slowThreshold = parseInt(process.env.PERFORMANCE_SLOW_THRESHOLD || '5000')
      if (duration > slowThreshold) {
        logger.warn('Slow API response detected', {
          ...metrics,
          threshold: slowThreshold,
          durationFormatted: `${duration}ms`
        })
      }
      
      return result
    } catch (error: unknown) {
      const duration = Date.now() - start
      
      captureErrorSafe(error, {
        action: 'api_request_error',
        ...metadata,
        duration
      })
      
      logger.error('API request failed', {
        ...metadata,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }
}

// Utility function to measure specific operations
export async function measureOperation<T>(
  operation: () => Promise<T>, 
  operationName: string,
  context?: Record<string, unknown>
): Promise<T> {
  const start = Date.now()
  const requestId = (global as { requestId?: string })?.requestId || crypto.randomUUID()
  
  try {
    logger.debug('Operation started', {
      operation: operationName,
      requestId,
      ...context
    })
    
    const result = await operation()
    
    const duration = Date.now() - start
    logger.debug('Operation completed', {
      operation: operationName,
      duration: `${duration}ms`,
      requestId,
      ...context
    })
    
    return result
  } catch (error: unknown) {
    const duration = Date.now() - start
    
    captureErrorSafe(error, {
      action: 'operation_error',
      operation: operationName,
      duration,
      requestId,
      ...context
    })
    
    logger.error('Operation failed', {
      operation: operationName,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      ...context
    })
    
    throw error
  }
}

// Performance monitoring for database queries
export function withDatabasePerformance<T>(
  query: () => Promise<T>,
  queryInfo: { operation: string; table?: string; queryType?: string }
): Promise<T> {
  return measureOperation(query, 'database_operation', {
    ...queryInfo,
    category: 'database'
  })
}
