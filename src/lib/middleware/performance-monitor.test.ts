// src/lib/middleware/performance-monitor.test.ts
import { withPerformanceMonitoring, measureOperation, withDatabasePerformance } from './performance-monitor'
import { logger } from '../logging/logger'
import { captureErrorSafe } from '../utils/error-utils'

// Mock dependencies
jest.mock('../logging/logger')
jest.mock('../utils/error-utils')

// Mock crypto for requestId generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-request-id'
  }
})

describe('performance-monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete (global as any).requestId
  })

  describe('withPerformanceMonitoring', () => {
    it('should monitor successful API requests', async () => {
      // ARRANGE
      const mockHandler = jest.fn().mockResolvedValue(new Response('Success', { status: 200 }))
      const monitoredHandler = withPerformanceMonitoring(mockHandler)
      const mockRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {
          get: (name: string) => {
            if (name === 'user-agent') return 'test-agent'
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }
        }
      }

      // ACT
      const result = await monitoredHandler(mockRequest as any)

      // ASSERT
      expect(result.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(mockRequest)
      expect(logger.debug).toHaveBeenCalledWith('API request started', expect.any(Object))
      expect(logger.info).toHaveBeenCalledWith('API request completed', expect.objectContaining({
        method: 'GET',
        url: '/api/test',
        status: 200,
        duration: expect.any(Number),
        requestId: 'test-request-id'
      }))
    })

    it('should log slow API responses', async () => {
      // ARRANGE
      process.env.PERFORMANCE_SLOW_THRESHOLD = '100' // 100ms threshold
      const mockHandler = jest.fn().mockImplementation(async () => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 150))
        return new Response('Slow response', { status: 200 })
      })
      const monitoredHandler = withPerformanceMonitoring(mockHandler)
      const mockRequest = {
        method: 'POST',
        url: '/api/slow',
        headers: {
          get: () => null
        }
      }

      // ACT
      const result = await monitoredHandler(mockRequest as any)

      // ASSERT
      expect(result.status).toBe(200)
      expect(logger.warn).toHaveBeenCalledWith('Slow API response detected', expect.any(Object))
    })

    it('should handle API request errors', async () => {
      // ARRANGE
      const error = new Error('API Error')
      const mockHandler = jest.fn().mockRejectedValue(error)
      const monitoredHandler = withPerformanceMonitoring(mockHandler)
      const mockRequest = {
        method: 'GET',
        url: '/api/error',
        headers: {
          get: () => null
        }
      }

      // ACT & ASSERT
      await expect(monitoredHandler(mockRequest as any)).rejects.toThrow('API Error')
      expect(captureErrorSafe).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          action: 'api_request_error',
          method: 'GET',
          url: '/api/error'
        })
      )
      expect(logger.error).toHaveBeenCalledWith('API request failed', expect.any(Object))
    })

    it('should use global requestId when available', async () => {
      // ARRANGE
      ;(global as any).requestId = 'global-request-id'
      const mockHandler = jest.fn().mockResolvedValue(new Response('Success', { status: 200 }))
      const monitoredHandler = withPerformanceMonitoring(mockHandler)
      const mockRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {
          get: () => null
        }
      }

      // ACT
      await monitoredHandler(mockRequest as any)

      // ASSERT
      expect(logger.info).toHaveBeenCalledWith('API request completed', expect.objectContaining({
        requestId: 'global-request-id'
      }))
    })
  })

  describe('measureOperation', () => {
    it('should measure successful operations', async () => {
      // ARRANGE
      const operation = jest.fn().mockResolvedValue('operation result')

      // ACT
      const result = await measureOperation(operation, 'test_operation', { test: 'context' })

      // ASSERT
      expect(result).toBe('operation result')
      expect(operation).toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('Operation started', expect.objectContaining({
        operation: 'test_operation',
        test: 'context'
      }))
      expect(logger.debug).toHaveBeenCalledWith('Operation completed', expect.objectContaining({
        operation: 'test_operation',
        test: 'context'
      }))
    })

    it('should handle operation errors', async () => {
      // ARRANGE
      const error = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(error)

      // ACT & ASSERT
      await expect(measureOperation(operation, 'failed_operation', { test: 'context' }))
        .rejects.toThrow('Operation failed')
      expect(captureErrorSafe).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          action: 'operation_error',
          operation: 'failed_operation',
          test: 'context'
        })
      )
      expect(logger.error).toHaveBeenCalledWith('Operation failed', expect.any(Object))
    })

    it('should measure operation without context', async () => {
      // ARRANGE
      const operation = jest.fn().mockResolvedValue('result')

      // ACT
      const result = await measureOperation(operation, 'simple_operation')

      // ASSERT
      expect(result).toBe('result')
      expect(logger.debug).toHaveBeenCalledWith('Operation started', expect.objectContaining({
        operation: 'simple_operation'
      }))
    })
  })

  describe('withDatabasePerformance', () => {
  it('should measure database operations', async () => {
    // ARRANGE
    const query = jest.fn().mockResolvedValue([{ id: 1, name: 'test' }])
    const queryInfo = { operation: 'SELECT', table: 'users', queryType: 'read' }

    // ACT
    const result = await withDatabasePerformance(query, queryInfo)

    // ASSERT
    expect(result).toEqual([{ id: 1, name: 'test' }])
    expect(logger.debug).toHaveBeenCalledWith('Operation started', expect.objectContaining({
      operation: 'SELECT',  // Changed from 'database_operation' to 'SELECT'
      category: 'database',
      table: 'users',
      queryType: 'read'
    }))
  })

  it('should handle database operation errors', async () => {
    // ARRANGE
    const error = new Error('Database error')
    const query = jest.fn().mockRejectedValue(error)
    const queryInfo = { operation: 'INSERT', table: 'orders' }

    // ACT & ASSERT
    await expect(withDatabasePerformance(query, queryInfo)).rejects.toThrow('Database error')
    expect(captureErrorSafe).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        action: 'operation_error',
        operation: 'INSERT',  // Changed from 'database_operation' to 'INSERT'
        category: 'database',
        table: 'orders'
      })
    )
  })
})

})
