// src/app/api/health/route.test.ts
import { GET } from './route'
import { db } from '../../../lib/database/client'
import { captureErrorSafe } from '../../../lib/utils/error-utils'
import { logger } from '../../../lib/logging/logger'

// Mock external dependencies
jest.mock('../../../lib/database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../lib/logging/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('GET /api/health', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return healthy status when all services are operational', async () => {
    // ARRANGE
    const mockDbResult = {
      rows: [{ now: new Date().toISOString() }]
    }
    
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)
    
    const mockNow = new Date('2023-01-01T12:00:00Z')
    jest.useFakeTimers().setSystemTime(mockNow)
    
    process.env.APP_VERSION = '1.2.3'

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      status: 'healthy',
      timestamp: mockNow.toISOString(),
      services: {
        database: 'healthy',
        authentication: 'healthy'
      },
      responseTimes: {
        database: expect.stringMatching(/^\d+ms$/)
      },
      version: '1.2.3'
    })
    
    expect(logger.debug).toHaveBeenCalledWith('Health check initiated')
    expect(logger.info).toHaveBeenCalledWith('Health check completed', data)
    expect(db.query).toHaveBeenCalledWith('SELECT NOW() as now')

    // Cleanup
    jest.useRealTimers()
  })

  it('should return healthy status with default version when APP_VERSION is not set', async () => {
    // ARRANGE
    const mockDbResult = {
      rows: [{ now: new Date().toISOString() }]
    }
    
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)
    
    delete process.env.APP_VERSION

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.version).toBe('1.0.0')
    expect(data.services.database).toBe('healthy')
    expect(data.services.authentication).toBe('healthy')
  })

  it('should return degraded status when database is unhealthy', async () => {
    // ARRANGE
    const mockDbResult = {
      rows: [] // Empty rows indicate unhealthy database
    }
    
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.services.database).toBe('unhealthy')
    expect(data.services.authentication).toBe('healthy')
  })

  it('should return unhealthy status when database query fails', async () => {
    // ARRANGE
    const dbError = new Error('Database connection failed')
    ;(db.query as jest.Mock).mockRejectedValue(dbError)
    
    const mockNow = new Date('2023-01-01T12:00:00Z')
    jest.useFakeTimers().setSystemTime(mockNow)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({
      status: 'unhealthy',
      timestamp: mockNow.toISOString(),
      error: 'Database connection failed'
    })
    
    expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
      action: 'health_check',
      service: 'system'
    })
    expect(logger.error).toHaveBeenCalledWith('Health check failed', {
      error: 'Error: Database connection failed',
      stack: dbError.stack
    })

    // Cleanup
    jest.useRealTimers()
  })

  it('should handle generic error during health check', async () => {
    // ARRANGE
    const systemError = new Error('System error occurred')
    ;(db.query as jest.Mock).mockImplementation(() => {
      throw systemError
    })
    
    const mockNow = new Date('2023-01-01T12:00:00Z')
    jest.useFakeTimers().setSystemTime(mockNow)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({
      status: 'unhealthy',
      timestamp: mockNow.toISOString(),
      error: 'System error occurred'
    })
    
    expect(captureErrorSafe).toHaveBeenCalledWith(systemError, {
      action: 'health_check',
      service: 'system'
    })
    expect(logger.error).toHaveBeenCalledWith('Health check failed', {
      error: 'Error: System error occurred',
      stack: systemError.stack
    })

    // Cleanup
    jest.useRealTimers()
  })

  it('should handle non-Error objects during health check', async () => {
    // ARRANGE
    const errorMessage = 'Unknown error'
    ;(db.query as jest.Mock).mockImplementation(() => {
      throw errorMessage
    })
    
    const mockNow = new Date('2023-01-01T12:00:00Z')
    jest.useFakeTimers().setSystemTime(mockNow)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({
      status: 'unhealthy',
      timestamp: mockNow.toISOString(),
      error: 'Unknown error'
    })
    
    expect(captureErrorSafe).toHaveBeenCalledWith(errorMessage, {
      action: 'health_check',
      service: 'system'
    })
    expect(logger.error).toHaveBeenCalledWith('Health check failed', {
      error: 'Unknown error',
      stack: undefined
    })

    // Cleanup
    jest.useRealTimers()
  })
})
