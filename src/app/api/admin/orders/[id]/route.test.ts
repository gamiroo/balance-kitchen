// src/app/api/admin/orders/[id]/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminOrderService } from "../../../../../lib/services/admin/orderService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'
import { NextRequest } from "next/server"

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("../../../../../lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("../../../../../lib/services/admin/orderService", () => ({
  adminOrderService: {
    getOrderById: jest.fn()
  }
}))

jest.mock('../../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

// Helper to create a mock NextRequest
const createMockNextRequest = (): NextRequest => {
  return {
    method: 'GET'
  } as unknown as NextRequest
}

describe('GET /api/admin/orders/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'order-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to order details', { orderId: 'order-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_ORDER_DETAILS',
      'orders',
      'UNAUTHORIZED',
      { orderId: 'order-123' }
    )
  })

  it('should return 403 when user is not admin', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to order details', { 
      userId: 'user-123',
      userRole: 'user',
      orderId: 'order-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_ORDER_DETAILS',
      'orders',
      'FORBIDDEN',
      { userRole: 'user', orderId: 'order-123' }
    )
  })

  it('should return 400 when order ID is missing', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockParamsWithoutId = { params: Promise.resolve({ id: '' }) }

    // ACT
    const response = await GET(createMockNextRequest(), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Order ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Order details request failed - missing order ID')
  })

  it('should return order details successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrder = {
      id: 'order-123',
      user_id: 'user-456',
      menu_id: 'menu-789',
      order_date: '2023-01-01T00:00:00.000Z',
      total_meals: 5,
      total_price: 25.00,
      status: 'confirmed',
      created_at: '2023-01-01T10:00:00.000Z',
      user_name: 'John Doe',
      user_email: 'john@example.com'
    }

    ;(adminOrderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockOrder
    })
    expect(logger.info).toHaveBeenCalledWith('Admin accessing order details', { 
      userId: 'admin-123',
      orderId: 'order-123' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Order details fetched successfully', { 
      userId: 'admin-123',
      orderId: 'order-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_ORDER_DETAILS',
      'orders',
      { orderId: 'order-123' }
    )
  })

  it('should return 404 when order is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminOrderService.getOrderById as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "Order not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('Order details not found', { 
      userId: 'admin-123',
      orderId: 'order-123' 
    })
  })

  it('should handle service error gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const serviceError = new Error('Service unavailable')
    ;(adminOrderService.getOrderById as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch order details. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_order_by_id',
      service: 'admin',
      endpoint: `/api/admin/orders/order-123`,
      userId: 'admin-123',
      orderId: 'order-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch order details', { 
      error: 'Error: Service unavailable',
      stack: serviceError.stack,
      orderId: 'order-123'
    })
  })
})
