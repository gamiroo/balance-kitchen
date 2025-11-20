// app/api/packs/purchase/route.test.ts
import { POST } from './route'
import { db } from '../../../../lib/database/client'
import { getServerSession } from 'next-auth'
import { AuditLogger } from '../../../../lib/logging/audit-logger'
import { logger } from '../../../../lib/logging/logger'
import { captureErrorSafe } from '../../../../lib/utils/error-utils'

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

const mockRequest = <T = unknown>(body: T) => ({
  json: async () => body
} as unknown as Request)

describe('POST /api/packs/purchase', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com'
    }
  }

  const validPurchaseData = {
    userId: 'user-123',
    packSize: 20
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  it('should purchase a meal pack successfully', async () => {
    // ARRANGE
    const mockPack = {
      id: 'pack-123',
      user_id: 'user-123',
      pack_size: 20, // Database field name
      remaining_balance: 20,
      purchase_date: new Date(),
      is_active: true
    }
    
    ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPack] })

    // ACT
    const response = await POST(mockRequest(validPurchaseData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.pack.id).toBe(mockPack.id)
    expect(data.pack.user_id).toBe(mockPack.user_id)
    expect(data.pack.pack_size).toBe(mockPack.pack_size)
    expect(data.pack.remaining_balance).toBe(mockPack.remaining_balance)
    expect(data.pack.is_active).toBe(mockPack.is_active)
    expect(data.pack.purchase_date).toBeDefined()
    expect(new Date(data.pack.purchase_date)).toBeInstanceOf(Date)
    
    expect(data.message).toBe('Successfully purchased 20 meal pack!')
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO meal_packs'),
      ['user-123', 20, 20]
    )
    expect(logger.info).toHaveBeenCalledWith('Meal pack created successfully', {
      userId: 'user-123',
      packId: 'pack-123',
      packSize: 20
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'user-123',
      'PURCHASE_PACK',
      'packs',
      { packId: 'pack-123', packSize: 20 } // Now matches the actual API behavior
    )
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(mockRequest(validPurchaseData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized pack purchase attempt - no session')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'PURCHASE_PACK',
      'packs',
      'UNAUTHORIZED'
    )
  })

  it('should return 401 when user tries to purchase for someone else', async () => {
    // ARRANGE
    const purchaseData = {
      ...validPurchaseData,
      userId: 'user-456' // Different user ID
    }

    // ACT
    const response = await POST(mockRequest(purchaseData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized pack purchase attempt - user mismatch', {
      sessionUserId: 'user-123',
      requestUserId: 'user-456'
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'PURCHASE_PACK',
      'packs',
      'USER_MISMATCH',
      { requestUserId: 'user-456' }
    )
  })

  it('should return 400 when pack size is invalid', async () => {
    // ARRANGE
    const invalidPurchaseData = {
      ...validPurchaseData,
      packSize: 15 // Not in valid sizes [10, 20, 40, 80]
    }

    // ACT
    const response = await POST(mockRequest(invalidPurchaseData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid pack size. Must be one of: 10, 20, 40, 80')
    expect(logger.warn).toHaveBeenCalledWith('Pack purchase failed - invalid pack size', {
      userId: 'user-123',
      packSize: 15,
      validSizes: [10, 20, 40, 80]
    })
  })

  it('should return 500 when database error occurs', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

    // ACT
    const response = await POST(mockRequest(validPurchaseData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to purchase pack. Please try again.')
    expect(captureErrorSafe).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Pack purchase failed with system error', {
      error: 'Error: Database error',
      stack: expect.any(String),
      userId: 'user-123'
    })
  })
})
