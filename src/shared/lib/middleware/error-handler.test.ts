// src/lib/middleware/error-handler.test.ts
import { createErrorResponse } from './error-handler'
import { SystemError } from '../errors/system-errors'
import { logger } from '../logging/logger'
import { captureError } from '../monitoring/sentry'

// Mock external dependencies
jest.mock('../logging/logger', () => ({
  logger: {
    error: jest.fn()
  }
}))

jest.mock('../monitoring/sentry', () => ({
  captureError: jest.fn()
}))

describe('error-handler', () => {
  const mockRequestId = 'req-1234567890'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createErrorResponse', () => {
    it('should handle SystemError with 400 status code', () => {
      // ARRANGE
      const systemError = new SystemError(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        { field: 'email' }
      )

      // ACT
      const response = createErrorResponse(systemError, mockRequestId)

      // ASSERT
      expect(response.status).toBe(400)
      
      // Check that logger was called
      expect(logger.error).toHaveBeenCalledWith('API Error', {
        error: 'Invalid input data',
        stack: expect.any(String),
        name: 'SystemError',
        requestId: mockRequestId,
        timestamp: expect.any(String)
      })

      // Check that Sentry was NOT called for 4xx errors
      expect(captureError).not.toHaveBeenCalled()
    })

    it('should handle SystemError with 500 status code', () => {
      // ARRANGE
      const systemError = new SystemError(
        'DATABASE_ERROR',
        'Database connection failed',
        500,
        { query: 'SELECT * FROM users' }
      )

      // ACT
      const response = createErrorResponse(systemError, mockRequestId)

      // ASSERT
      expect(response.status).toBe(500)
      
      // Check that logger was called
      expect(logger.error).toHaveBeenCalledWith('API Error', {
        error: 'Database connection failed',
        stack: expect.any(String),
        name: 'SystemError',
        requestId: mockRequestId,
        timestamp: expect.any(String)
      })

      // Check that Sentry WAS called for 5xx errors
      expect(captureError).toHaveBeenCalledWith(systemError, {
        requestId: mockRequestId,
        timestamp: expect.any(String)
      })
    })

    it('should handle generic Error as internal error', () => {
      // ARRANGE
      const genericError = new Error('Something went wrong')

      // ACT
      const response = createErrorResponse(genericError, mockRequestId)

      // ASSERT
      expect(response.status).toBe(500)
      
      // Check that logger was called
      expect(logger.error).toHaveBeenCalledWith('API Error', {
        error: 'Something went wrong',
        stack: expect.any(String),
        name: 'Error',
        requestId: mockRequestId,
        timestamp: expect.any(String)
      })

      // Check that Sentry was called for generic errors
      expect(captureError).toHaveBeenCalledWith(genericError, {
        requestId: mockRequestId,
        timestamp: expect.any(String)
      })
    })

    it('should return correct response body for SystemError', async () => {
      // ARRANGE
      const systemError = new SystemError(
        'AUTH_ERROR',
        'Authentication failed',
        401,
        { user: 'test@example.com' }
      )

      // ACT
      const response = createErrorResponse(systemError, mockRequestId)
      
      // Extract JSON from response
      const result = await response.json()

      // ASSERT
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('AUTH_ERROR')
      expect(result.error.message).toBe('Authentication failed')
      expect(result.error.requestId).toBe(mockRequestId)
      expect(result.error.details).toEqual({ user: 'test@example.com' })
      expect(result.error.timestamp).toEqual(expect.any(String))
    })

    it('should return correct response body for generic Error', async () => {
      // ARRANGE
      const genericError = new Error('Unexpected error occurred')

      // ACT
      const response = createErrorResponse(genericError, mockRequestId)
      
      // Extract JSON from response
      const result = await response.json()

      // ASSERT
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('An unexpected error occurred')
      expect(result.error.requestId).toBe(mockRequestId)
      expect(result.error.timestamp).toEqual(expect.any(String))
      expect(result.error).not.toHaveProperty('details')
    })

    it('should handle SystemError without details', async () => {
      // ARRANGE
      const systemError = new SystemError(
        'NOT_FOUND',
        'Resource not found',
        404
        // No details provided
      )

      // ACT
      const response = createErrorResponse(systemError, mockRequestId)
      
      // Extract JSON from response
      const result = await response.json()

      // ASSERT
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('NOT_FOUND')
      expect(result.error.message).toBe('Resource not found')
      expect(result.error.requestId).toBe(mockRequestId)
      expect(result.error.timestamp).toEqual(expect.any(String))
      expect(result.error).not.toHaveProperty('details')
    })

    it('should capture timestamp correctly for 5xx error', () => {
      // ARRANGE
      const systemError = new SystemError('DATABASE_ERROR', 'Database error', 500)
      const before = new Date().toISOString()

      // ACT
      createErrorResponse(systemError, mockRequestId)

      // ASSERT
      const logCall = (logger.error as jest.Mock).mock.calls[0][1]
      const sentryCall = (captureError as jest.Mock).mock.calls[0][1]
      
      const logTimestamp = new Date(logCall.timestamp).getTime()
      const sentryTimestamp = new Date(sentryCall.timestamp).getTime()
      const beforeTimestamp = new Date(before).getTime()
      const nowTimestamp = Date.now()
      
      expect(logTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(logTimestamp).toBeLessThanOrEqual(nowTimestamp)
      expect(sentryTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(sentryTimestamp).toBeLessThanOrEqual(nowTimestamp)
    })

    it('should capture timestamp correctly for generic error', () => {
      // ARRANGE
      const genericError = new Error('Generic error')
      const before = new Date().toISOString()

      // ACT
      createErrorResponse(genericError, mockRequestId)

      // ASSERT
      const logCall = (logger.error as jest.Mock).mock.calls[0][1]
      const sentryCall = (captureError as jest.Mock).mock.calls[0][1]
      
      const logTimestamp = new Date(logCall.timestamp).getTime()
      const sentryTimestamp = new Date(sentryCall.timestamp).getTime()
      const beforeTimestamp = new Date(before).getTime()
      const nowTimestamp = Date.now()
      
      expect(logTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(logTimestamp).toBeLessThanOrEqual(nowTimestamp)
      expect(sentryTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(sentryTimestamp).toBeLessThanOrEqual(nowTimestamp)
    })
  })
})
