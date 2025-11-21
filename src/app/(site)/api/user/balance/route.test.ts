// app/api/user/balance/route.test.ts
import { GET } from './route'
import { db } from '@/shared/lib/database/client'
import { getServerSession } from 'next-auth'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { logger } from '@/shared/lib/logging/logger'
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('@/lib/logging/logger')
jest.mock('@/lib/logging/audit-logger')
jest.mock('@/lib/utils/error-utils')


describe('GET /api/user/balance', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  it('should return user balance successfully', async () => {
    // ARRANGE
    const mockBalanceResult = { rows: [{ total_meals: '15' }] }
    ;(db.query as jest.Mock).mockResolvedValueOnce(mockBalanceResult)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.balance).toBe(15)
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COALESCE(SUM(remaining_balance), 0) as total_meals'),
      ['user-123']
    )
    expect(logger.debug).toHaveBeenCalledWith('User meal balance retrieved', {
      userId: 'user-123',
      balance: 15
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'user-123',
      'CHECK_BALANCE',
      'users',
      { balance: 15 }
    )
  })

  it('should return 0 balance when user has no active meal packs', async () => {
    // ARRANGE
    const mockBalanceResult = { rows: [{ total_meals: '0' }] }
    ;(db.query as jest.Mock).mockResolvedValueOnce(mockBalanceResult)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.balance).toBe(0)
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized balance check attempt - no session')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'CHECK_BALANCE',
      'users',
      'UNAUTHORIZED'
    )
  })

  it('should return 500 when database error occurs', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch meal balance. Please try again.')
    expect(captureErrorSafe).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch meal balance', {
      error: 'Error: Database error',
      stack: expect.any(String),
      userId: 'user-123'
    })
  })
})
