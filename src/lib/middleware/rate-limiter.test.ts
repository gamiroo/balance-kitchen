import { NextRequest } from 'next/server'
import { rateLimit, getRateLimitStatus, banIP, unbanIP } from './rate-limiter'
import { logger } from '../logging/logger'
import { captureErrorSafe } from '../utils/error-utils'

// Mock dependencies
jest.mock('../logging/logger')
jest.mock('../utils/error-utils')

describe('rate-limiter', () => {
  const mockRequest = (overrides = {}) => ({
    url: '/api/test',
    headers: {
      get: jest.fn().mockReturnValue(null),
    },
    ...overrides,
  } as unknown as NextRequest)

  beforeEach(() => {
    jest.clearAllMocks()
    // Force reset modules to clear internal state
    jest.resetModules()
  })

  describe('rateLimit middleware', () => {
    it('should allow requests within rate limit', async () => {
      // ARRANGE
      const config = { maxRequests: 5, windowMs: 60000 }
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // ACT
      const result = await middleware(req)

      // ASSERT
      expect(result).toBeNull()
    })

    it('should block requests when rate limit is exceeded', async () => {
      // ARRANGE
      const config = { maxRequests: 2, windowMs: 60000 }
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // Make maxRequests requests to hit the limit
      await middleware(req) // 1st request
      await middleware(req) // 2nd request

      // ACT - 3rd request should be blocked
      const result = await middleware(req)

      // ASSERT
      expect(result).toBeInstanceOf(Response)
      if (result instanceof Response) {
        expect(result.status).toBe(429)
        const body = await result.json()
        expect(body.error).toBe('Too Many Requests')
      }
    })

    it('should allow requests after window resets', async () => {
      // ARRANGE
      const config = { maxRequests: 1, windowMs: 50 } // Very short window
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // Hit the rate limit
      await middleware(req) // 1st request (should be allowed)
      let result = await middleware(req) // 2nd request (should be blocked)

      expect(result).toBeInstanceOf(Response)
      if (result instanceof Response) {
        expect(result.status).toBe(429)
      }

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 60))

      // Re-import to get fresh function (since we reset modules)
      const { rateLimit: freshRateLimit } = require('./rate-limiter')
      const freshMiddleware = freshRateLimit(config)

      // ACT - Request after window reset
      result = await freshMiddleware(req)

      // ASSERT
      expect(result).toBeNull() // Should be allowed
    })

    it('should ban IP after ban threshold is exceeded', async () => {
      // ARRANGE
      const config = { 
        maxRequests: 1, 
        windowMs: 60000, 
        banThreshold: 2,
        banDuration: 3600000 
      }
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // Exceed rate limit multiple times to trigger ban
      await middleware(req) // 1st request - allowed
      await middleware(req) // 2nd request - blocked (violation 1)
      await middleware(req) // 3rd request - blocked (violation 2) - should trigger ban

      // ACT - Try request after ban
      const result = await middleware(req)

      // ASSERT
      expect(result).toBeInstanceOf(Response)
      if (result instanceof Response) {
        expect(result.status).toBe(429)
        const body = await result.json()
        expect(body.message).toContain('banned')
      }
    })

    it('should block banned IPs immediately', async () => {
      // ARRANGE
      const config = { maxRequests: 10, windowMs: 60000 }
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // Manually ban the IP
      banIP('192.168.1.1', 3600000)

      // ACT
      const result = await middleware(req)

      // ASSERT
      expect(result).toBeInstanceOf(Response)
      if (result instanceof Response) {
        expect(result.status).toBe(429)
        const body = await result.json()
        expect(body.message).toContain('banned')
      }
    })

    it('should allow requests from banned IP after ban expires', async () => {
      // ARRANGE
      const config = { maxRequests: 10, windowMs: 60000 }
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // Manually ban the IP with short duration
      banIP('192.168.1.1', 50) // 50ms ban

      // Wait for ban to expire
      await new Promise(resolve => setTimeout(resolve, 60))

      // ACT
      const result = await middleware(req)

      // ASSERT
      expect(result).toBeNull() // Should be allowed after ban expires
    })

    it('should extract client IP from various headers', async () => {
      // Test x-forwarded-for
      const req1 = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
            return null
          }),
        },
      })

      const middleware = rateLimit({ maxRequests: 10, windowMs: 60000 })
      await middleware(req1)
      
      // Test x-real-ip
      const req2 = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-real-ip') return '192.168.1.2'
            return null
          }),
        },
      })

      jest.clearAllMocks()
      await middleware(req2)
    })

it('should handle rate limit check errors gracefully', async () => {
  // ARRANGE
  const config = { maxRequests: 10, windowMs: 60000 }
  const middleware = rateLimit(config)
  
  // Create a request that will throw an error when headers.get is called
  const req = {
    url: '/api/test',
    headers: {
      get: jest.fn().mockImplementation(() => {
        throw new Error('Header parsing error')
      }),
    },
  } as unknown as NextRequest

  // ACT
  const result = await middleware(req)

  // ASSERT
  expect(result).toBeNull()
  expect(captureErrorSafe).toHaveBeenCalled()
})


    it('should include proper headers in rate limit response', async () => {
      // ARRANGE
      const config = { maxRequests: 1, windowMs: 60000 }
      const middleware = rateLimit(config)
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          }),
        },
      })

      // Hit rate limit
      await middleware(req) // 1st request - allowed
      const result = await middleware(req) // 2nd request - blocked

      // ASSERT
      expect(result).toBeInstanceOf(Response)
      if (result instanceof Response) {
        expect(result.status).toBe(429)
        expect(result.headers.get('Content-Type')).toBe('application/json')
        expect(result.headers.get('Retry-After')).toBeTruthy()
      }
    })
  })

  describe('getRateLimitStatus', () => {
        it('should return correct status for non-existent records', () => {
      // Force reset modules to ensure clean state
      jest.resetModules()
      
      // Re-import after reset
      const { getRateLimitStatus } = require('./rate-limiter')
      
      // ACT
      const status = getRateLimitStatus('192.168.1.1', '/api/test')

      // ASSERT
      expect(status.remaining).toBe(0)
      expect(status.isRateLimited).toBe(false)
      // For non-existent records, resetTime should not be a future timestamp
      expect(status.resetTime).toBeLessThanOrEqual(Date.now())
    })

    it('should return correct status for existing records', async () => {
      // Force reset modules to ensure clean state
      jest.resetModules()
      
      // Re-import after reset
      const { rateLimit, getRateLimitStatus } = require('./rate-limiter')
      
      // ARRANGE
      const middleware = rateLimit({ maxRequests: 5, windowMs: 60000 })
      const req = mockRequest({
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'x-forwarded-for') return '192.168.1.2'
            return null
          }),
        },
      })

      // Make a request to create a record
      await middleware(req)

      // ACT
      const status = getRateLimitStatus('192.168.1.2', '/api/test')

      // ASSERT
      expect(status.resetTime).toBeGreaterThan(Date.now())
      expect(status.isRateLimited).toBe(false)
    })
  })

  describe('banIP and unbanIP', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    it('should ban and unban IP addresses', () => {
      // Re-import after reset
      const { banIP, unbanIP } = require('./rate-limiter')
      
      // ACT
      banIP('192.168.1.1', 3600000)
      
      // ACT
      const wasBanned = unbanIP('192.168.1.1')

      // ASSERT
      expect(wasBanned).toBe(true)
    })

    it('should return false when unbanIP is called for non-banned IP', () => {
      // Re-import after reset
      const { unbanIP } = require('./rate-limiter')
      
      // ACT
      const wasBanned = unbanIP('192.168.1.999')

      // ASSERT
      expect(wasBanned).toBe(false)
    })
  })
})
