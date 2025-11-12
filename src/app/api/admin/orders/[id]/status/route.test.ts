// src/app/api/admin/orders/[id]/status/route.test.ts
import { PUT } from './route'
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../../lib/auth/auth"
import { adminOrderService } from "../../../../../../lib/services/admin/orderService"
import { captureErrorSafe } from '../../../../../../lib/utils/error-utils'
import { logger } from '../../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../../lib/logging/audit-logger'
import { NextRequest } from "next/server"

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("../../../../../../lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("../../../../../../lib/services/admin/orderService", () => ({
  adminOrderService: {
    updateOrderStatus: jest.fn()
  }
}))

jest.mock('../../../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

// Helper to create a mock NextRequest with JSON body
const createMockNextRequest = (body: any = {}): NextRequest => {
  return {
    json: async () => body
  } as unknown as NextRequest
}

describe('PUT /api/admin/orders/[id]/status', () => {
  const mockParams = { params: Promise.resolve({ id: 'order-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest({ status: 'confirmed' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to update order status', { orderId: 'order-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'UPDATE_ORDER_STATUS',
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
    const response = await PUT(createMockNextRequest({ status: 'confirmed' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to update order status', { 
      userId: 'user-123',
      userRole: 'user',
      orderId: 'order-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'UPDATE_ORDER_STATUS',
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
    const response = await PUT(createMockNextRequest({ status: 'confirmed' }), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Order ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Order status update failed - missing order ID')
  })

  it('should return 400 when status is missing', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await PUT(createMockNextRequest({}), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Status is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Order status update failed - no status provided', { 
      userId: 'admin-123',
      orderId: 'order-123' 
    })
  })

  it('should return 400 when status is invalid', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await PUT(createMockNextRequest({ status: 'invalid-status' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Invalid status. Must be one of: pending, confirmed, delivered, cancelled" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Order status update failed - invalid status', { 
      userId: 'admin-123',
      orderId: 'order-123',
      status: 'invalid-status' 
    })
  })

  it('should update order status successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { status: 'confirmed' }
    const mockUpdatedOrder = {
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

    ;(adminOrderService.updateOrderStatus as jest.Mock).mockResolvedValue(mockUpdatedOrder)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockUpdatedOrder
    })
    expect(adminOrderService.updateOrderStatus).toHaveBeenCalledWith('order-123', 'confirmed')
    expect(logger.info).toHaveBeenCalledWith('Admin updating order status', { 
      userId: 'admin-123',
      orderId: 'order-123',
      newStatus: 'confirmed' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Executing order status update', { 
      orderId: 'order-123',
      status: 'confirmed',
      userId: 'admin-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Order status updated successfully', { 
      userId: 'admin-123',
      orderId: 'order-123',
      oldStatus: 'confirmed',
      newStatus: 'confirmed' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_ORDER_STATUS',
      'orders',
      { 
        orderId: 'order-123',
        oldStatus: 'confirmed',
        newStatus: 'confirmed' 
      }
    )
  })

  it('should return 404 when order to update is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { status: 'confirmed' }
    ;(adminOrderService.updateOrderStatus as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "Order not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('Order status update failed - order not found', { 
      userId: 'admin-123',
      orderId: 'order-123' 
    })
  })

  it('should handle service error during status update gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { status: 'confirmed' }
    const serviceError = new Error('Failed to update order status')
    ;(adminOrderService.updateOrderStatus as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to update order status. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_update_order_status',
      service: 'admin',
      endpoint: `/api/admin/orders/order-123/status`,
      userId: 'admin-123',
      orderId: 'order-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to update order status', { 
      error: 'Error: Failed to update order status',
      stack: serviceError.stack,
      orderId: 'order-123'
    })
  })
})
