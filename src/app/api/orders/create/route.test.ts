// app/api/orders/create/route.test.ts
import { POST } from './route'
import { db } from '../../../../lib/database/client'
import { getServerSession } from 'next-auth'

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

describe('POST /api/orders/create', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com'
    }
  }

  const validOrderData = {
    userId: 'user-123',
    selectedMeals: {
      'meal-1': 2,
      'meal-2': 1
    },
    totalMeals: 3,
    menuItems: [
      { id: 'meal-1', name: 'Meal 1', description: 'Test meal 1', category: 'main', price: 10 },
      { id: 'meal-2', name: 'Meal 2', description: 'Test meal 2', category: 'dessert', price: 5 }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  it('should create an order successfully', async () => {
    // ARRANGE
    // Mock all the database calls needed for successful order creation
    ;(db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ total_meals: '10' }] }) // Balance check
      .mockResolvedValueOnce({ rows: [{ id: 'pack-1', remaining_balance: 10 }] }) // Get packs
      .mockResolvedValueOnce({}) // Update pack
      .mockResolvedValueOnce({ rows: [{ id: 'order-123' }] }) // Create order
      .mockResolvedValueOnce({ rows: [{ id: 'item-1' }] }) // Create order item 1
      .mockResolvedValueOnce({ rows: [{ id: 'item-2' }] }) // Create order item 2

    // ACT
    const response = await POST(mockRequest(validOrderData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(mockRequest(validOrderData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 401 when user tries to order for someone else', async () => {
    // ARRANGE
    const orderData = {
      ...validOrderData,
      userId: 'user-456' // Different user ID
    }

    // ACT
    const response = await POST(mockRequest(orderData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when selectedMeals is missing', async () => {
    // ARRANGE
    const invalidData = {
      ...validOrderData,
      selectedMeals: null
    }

    // ACT
    const response = await POST(mockRequest(invalidData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Please select at least one meal')
  })

  it('should return 400 when totalMeals is zero or negative', async () => {
    // ARRANGE
    const invalidData = {
      ...validOrderData,
      totalMeals: 0
    }

    // ACT
    const response = await POST(mockRequest(invalidData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Please select at least one meal')
  })

  it('should return 400 when user has insufficient meal balance', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_meals: '2' }] }) // Less than requested

    // ACT
    const response = await POST(mockRequest(validOrderData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toContain('You only have 2 meals available')
  })

  it('should return 500 when database error occurs during balance check', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

    // ACT
    const response = await POST(mockRequest(validOrderData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to process order. Please try again.')
  })

  it('should return 500 when database error occurs during order creation', async () => {
    // ARRANGE
    ;(db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ total_meals: '10' }] }) // Check balance
      .mockResolvedValueOnce({ rows: [{ id: 'pack-1', remaining_balance: 10 }] }) // Get packs
      .mockResolvedValueOnce({}) // Update pack
      .mockRejectedValueOnce(new Error('Failed to create order')) // Create order fails

    // ACT
    const response = await POST(mockRequest(validOrderData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to process order. Please try again.')
  })
})
