// Mock dependencies
jest.mock('../monitoring/sentry', () => ({
  captureError: jest.fn()
}))

// Import the actual implementation explicitly
const { isError, captureErrorSafe } = jest.requireActual('./error-utils')
import { captureError } from '../monitoring/sentry'

describe('error-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isError', () => {
    it('should return true for Error instances', () => {
      // ACT
      const result = isError(new Error('Test error'))

      // ASSERT
      expect(result).toBe(true)
    })

    it('should return false for non-Error objects', () => {
      // ACT & ASSERT
      expect(isError('string error')).toBe(false)
      expect(isError(123)).toBe(false)
      expect(isError(null)).toBe(false)
      expect(isError(undefined)).toBe(false)
      expect(isError({ message: 'error object' })).toBe(false)
    })

    it('should return false for Error-like objects', () => {
      // ACT
      const result = isError({ message: 'error-like object', stack: 'stack trace' })

      // ASSERT
      expect(result).toBe(false)
    })
  })

  describe('captureErrorSafe', () => {
    it('should capture Error instances directly', () => {
      // ARRANGE
      const error = new Error('Test error')
      const context = { action: 'test_action' }

      // ACT
      const result = captureErrorSafe(error, context)

      // ASSERT
      expect(result).toBe(error)
      expect(captureError).toHaveBeenCalledWith(error, context)
    })

    it('should wrap non-Error objects in Error before capturing', () => {
      // ARRANGE
      const error = 'string error'
      const context = { action: 'test_action' }

      // ACT
      const result = captureErrorSafe(error, context)

      // ASSERT
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Non-Error thrown: string error')
      expect(captureError).toHaveBeenCalledWith(result, context)
    })

    it('should handle null and undefined values', () => {
      // ARRANGE
      const context = { action: 'test_action' }

      // ACT
      const result1 = captureErrorSafe(null, context)
      const result2 = captureErrorSafe(undefined, context)

      // ASSERT
      expect(result1).toBeInstanceOf(Error)
      expect(result1.message).toBe('Non-Error thrown: null')
      expect(result2).toBeInstanceOf(Error)
      expect(result2.message).toBe('Non-Error thrown: undefined')
      expect(captureError).toHaveBeenCalledWith(result1, context)
      expect(captureError).toHaveBeenCalledWith(result2, context)
    })

    it('should handle complex objects', () => {
      // ARRANGE
      const error = { code: 500, message: 'Internal server error' }
      const context = { action: 'test_action' }

      // ACT
      const result = captureErrorSafe(error, context)

      // ASSERT
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Non-Error thrown: [object Object]')
      expect(captureError).toHaveBeenCalledWith(result, context)
    })

    it('should capture error without context', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT
      const result = captureErrorSafe(error)

      // ASSERT
      expect(result).toBe(error)
      expect(captureError).toHaveBeenCalledWith(error, undefined)
    })
  })
})
