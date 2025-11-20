// src/lib/database/client.test.ts
// Disable auto-mocking for this module
jest.unmock('./client')

describe('database client', () => {
  // Mock all external dependencies before importing the module
  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
  
  const mockCaptureErrorSafe = jest.fn()
  
  const mockQuery = jest.fn()
  const mockPoolEnd = jest.fn()
  
  const mockPool = {
    query: mockQuery,
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0,
    end: mockPoolEnd
  }
  
  const MockPool = jest.fn(() => mockPool)

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Mock modules
    jest.doMock('../logging/logger', () => ({
      logger: mockLogger
    }))
    
    jest.doMock('../utils/error-utils', () => ({
      captureErrorSafe: mockCaptureErrorSafe
    }))
    
    jest.doMock('pg', () => ({
      Pool: MockPool
    }))
  })

  afterEach(() => {
    jest.resetModules()
  })

  it('should export db object with all methods', async () => {
    // ACT
    const { db } = await import('./client')

    // ASSERT
    expect(db).toBeDefined()
    expect(typeof db).toBe('object')
    
    // Check all expected methods exist
    expect(db).toHaveProperty('query')
    expect(typeof db.query).toBe('function')
    
    expect(db).toHaveProperty('getPoolStats')
    expect(typeof db.getPoolStats).toBe('function')
    
    expect(db).toHaveProperty('end')
    expect(typeof db.end).toBe('function')
  })

  describe('query method', () => {
    it('should execute query successfully and return result', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const mockResult = {
        rows: [{ id: 1, name: 'test' }],
        rowCount: 1
      }
      mockQuery.mockResolvedValueOnce(mockResult)
      
      // ACT
      const result = await db.query('SELECT * FROM users', ['param1'])

      // ASSERT
      expect(result).toEqual(mockResult)
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users', ['param1'])
      
      // Check debug logging
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing database query',
        expect.objectContaining({
          query: 'SELECT * FROM users',
          paramCount: 1
        })
      )
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Database query completed',
        expect.objectContaining({
          rowCount: 1
        })
      )
    })

    it('should handle queries without parameters', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const mockResult = {
        rows: [],
        rowCount: 0
      }
      mockQuery.mockResolvedValueOnce(mockResult)
      
      // ACT
      const result = await db.query('SELECT * FROM users')

      // ASSERT
      expect(result).toEqual(mockResult)
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users', undefined)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing database query',
        expect.objectContaining({
          query: 'SELECT * FROM users',
          paramCount: 0
        })
      )
    })

    it('should truncate long queries in logs', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const longQuery = 'SELECT * FROM users WHERE id = $1 AND name = $2 AND email = $3 AND phone = $4 AND address = $5 AND city = $6 AND state = $7 AND zip = $8 AND country = $9 AND notes = $10'
      const mockResult = { rows: [], rowCount: 0 }
      mockQuery.mockResolvedValueOnce(mockResult)
      
      // ACT
      await db.query(longQuery, ['param1'])

      // ASSERT
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing database query',
        expect.objectContaining({
          query: expect.stringMatching(/^SELECT \* FROM users WHERE.*\.\.\.$/),
          paramCount: 1
        })
      )
    })

    it('should handle database errors and throw DatabaseError', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const dbError = new Error('Connection failed')
      mockQuery.mockRejectedValueOnce(dbError)
      
      // ACT & ASSERT
      await expect(db.query('SELECT * FROM users')).rejects.toThrow('Database query failed: Connection failed')
      
      // Check that it's a DatabaseError by checking the name
      try {
        await db.query('SELECT * FROM users')
      } catch (error: unknown) {
          if (error instanceof Error) {
            expect(error.name).toBe('DatabaseError');
          } else {
            fail('Expected error to be an instance of Error');
          }
      }
      
      // Check error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database query failed',
        expect.objectContaining({
          error: 'Connection failed',
          query: 'SELECT * FROM users'
        })
      )
      
      // Check error capture
      expect(mockCaptureErrorSafe).toHaveBeenCalledWith(
        dbError,
        expect.objectContaining({
          action: 'database_query',
          query: 'SELECT * FROM users'
        })
      )
    })

    it('should handle non-Error objects in database errors', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const errorMessage = 'Unknown error'
      mockQuery.mockRejectedValueOnce(errorMessage)
      
      // ACT & ASSERT
      await expect(db.query('SELECT * FROM users')).rejects.toThrow('Database query failed: Unknown error')
      
      // Check that it's a DatabaseError by checking the name
      try {
        await db.query('SELECT * FROM users')
      } catch (error: unknown) {
          if (error instanceof Error) {
            expect(error.name).toBe('DatabaseError');
          } else {
            fail('Expected error to be an instance of Error');
          }
      }
      
      // Check error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database query failed',
        expect.objectContaining({
          error: 'Unknown database error'
        })
      )
    })

    it('should include requestId in logs when available', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const mockResult = { rows: [], rowCount: 0 }
      mockQuery.mockResolvedValueOnce(mockResult)
      
      // Mock global requestId
      const originalRequestId = (global as unknown as { requestId: string }).requestId;
      (global as unknown as { requestId: string }).requestId = 'test-request-id';
      
      // ACT
      await db.query('SELECT * FROM users')

      // ASSERT
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing database query',
        expect.objectContaining({
          requestId: 'test-request-id'
        })
      )
      
      // Cleanup
      ;(global as unknown as { requestId: string }).requestId = originalRequestId
    })

    it('should use "unknown" as requestId when not available', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const mockResult = { rows: [], rowCount: 0 }
      mockQuery.mockResolvedValueOnce(mockResult)
      
      // Remove global requestId if it exists
      const originalRequestId = (global as unknown as { requestId: string }).requestId;
      delete (global as unknown as { requestId?: string }).requestId;

      
      // ACT
      await db.query('SELECT * FROM users')

      // ASSERT
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing database query',
        expect.objectContaining({
          requestId: 'unknown'
        })
      )
      
      // Cleanup
      if (originalRequestId) {
        ;(global as unknown as { requestId: string }).requestId = originalRequestId
      }
    })
  })

  describe('getPoolStats method', () => {
    it('should return pool statistics', async () => {
      // ARRANGE
      const { db } = await import('./client')

      // ACT
      const stats = db.getPoolStats()

      // ASSERT
      expect(stats).toEqual({
        total: 5,
        idle: 3,
        waiting: 0
      })
    })
  })

  describe('end method', () => {
    it('should call pool.end and log info', async () => {
      // ARRANGE
      const { db } = await import('./client')

      // ACT
      await db.end()

      // ASSERT
      expect(mockPoolEnd).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Closing database pool')
    })

    it('should handle errors when ending pool', async () => {
      // ARRANGE
      const { db } = await import('./client')
      
      const error = new Error('Failed to end pool')
      mockPoolEnd.mockRejectedValueOnce(error)
      
      // ACT & ASSERT
      await expect(db.end()).rejects.toThrow('Failed to end pool')
    })
  })
})
