// src/lib/database/client.ts
import { Pool, QueryResult, QueryResultRow } from 'pg'
import { captureErrorSafe } from '../utils/error-utils'
import { logger } from '../logging/logger'
import { DatabaseError } from '../errors/system-errors'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

export const db = {
  query: async <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
    const start = Date.now()
    const requestId = (global as { requestId?: string })?.requestId || 'unknown'
    
    try {
      logger.debug('Executing database query', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params?.length || 0,
        requestId
      })
      
      const result = await pool.query<T>(text, params)
      
      const duration = Date.now() - start
      logger.debug('Database query completed', {
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        requestId
      })
      
      return result
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'database_query',
        query: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        paramCount: params?.length || 0,
        requestId
      })
      
      logger.error('Database query failed', {
        error: error instanceof Error ? error.message : 'Unknown database error',
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params?.length || 0,
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Re-throw as a DatabaseError for better error handling
      throw new DatabaseError(
        `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          query: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          paramCount: params?.length || 0 
        }
      )
    }
  },
  
  // Add a method to get pool statistics for monitoring
  getPoolStats: () => {
    return {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    }
  },
  
  // Add a method to end the pool (useful for cleanup)
  end: async () => {
    logger.info('Closing database pool')
    await pool.end()
  }
}
