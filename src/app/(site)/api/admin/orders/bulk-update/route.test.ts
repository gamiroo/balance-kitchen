import { POST } from './route'
import { getServerSession } from "next-auth"
import { adminOrderService } from "@/shared/lib/services/admin/orderService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// Define types for test data
interface MockUser {
  id: string;
  email: string;
  role: string;
}

interface MockSession {
  user: MockUser;
}

interface MockOrder {
  id: string;
  status: string;
  updated_at: Date;
}

interface UpdatedOrder {
  id: string;
  status: string;
  updated_at: string;
}

interface BulkUpdateRequest {
  orderIds: string[];
  status: string;
}

// Mock external dependencies
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
  getServerSession: jest.fn()
}))

jest.mock("@/shared/lib/services/admin/orderService", () => ({
  adminOrderService: {
    bulkUpdateOrders: jest.fn()
  }
}))

jest.mock('@/shared/lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('@/shared/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('@/shared/lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

// Helper to create a mock Request with JSON body
const mockRequest = <T>(body: T) => ({
  json: async () => body
} as unknown as Request)

describe('POST /api/admin/orders/bulk-update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(mockRequest<BulkUpdateRequest>({ orderIds: ['order-1'], status: 'confirmed' }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to bulk update orders')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'BULK_UPDATE_ORDERS',
      'orders',
      'UNAUTHORIZED'
    )
  })

  it('should return 403 when user is not admin', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await POST(mockRequest<BulkUpdateRequest>({ orderIds: ['order-1'], status: 'confirmed' }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to bulk update orders', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'BULK_UPDATE_ORDERS',
      'orders',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return 400 when order IDs are missing', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await POST(mockRequest<{ status: string }>({ status: 'confirmed' }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Order IDs are required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Bulk update failed - no order IDs provided', { 
      userId: 'admin-123' 
    })
  })

  it('should return 400 when order IDs is empty array', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await POST(mockRequest<BulkUpdateRequest>({ orderIds: [], status: 'confirmed' }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Order IDs are required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Bulk update failed - no order IDs provided', { 
      userId: 'admin-123' 
    })
  })

  it('should return 400 when status is missing', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await POST(mockRequest<{ orderIds: string[] }>({ orderIds: ['order-1'] }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Status is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Bulk update failed - no status provided', { 
      userId: 'admin-123' 
    })
  })

  it('should return 400 when status is invalid', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await POST(mockRequest<BulkUpdateRequest>({ orderIds: ['order-1'], status: 'invalid-status' }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Invalid status. Must be one of: pending, confirmed, delivered, cancelled" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Bulk update failed - invalid status', { 
      userId: 'admin-123',
      status: 'invalid-status' 
    })
  })

  it('should bulk update orders successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: BulkUpdateRequest = {
      orderIds: ['order-1', 'order-2', 'order-3'],
      status: 'confirmed'
    }

    const mockUpdatedOrders: MockOrder[] = [
      {
        id: 'order-1',
        status: 'confirmed',
        updated_at: new Date('2023-01-01T12:00:00Z')
      },
      {
        id: 'order-2',
        status: 'confirmed',
        updated_at: new Date('2023-01-01T12:00:00Z')
      },
      {
        id: 'order-3',
        status: 'confirmed',
        updated_at: new Date('2023-01-01T12:00:00Z')
      }
    ]

    const expectedUpdatedOrders: UpdatedOrder[] = [
      {
        id: 'order-1',
        status: 'confirmed',
        updated_at: '2023-01-01T12:00:00.000Z'
      },
      {
        id: 'order-2',
        status: 'confirmed',
        updated_at: '2023-01-01T12:00:00.000Z'
      },
      {
        id: 'order-3',
        status: 'confirmed',
        updated_at: '2023-01-01T12:00:00.000Z'
      }
    ]

    ;(adminOrderService.bulkUpdateOrders as jest.Mock).mockResolvedValue(mockUpdatedOrders)

    // ACT
    const response = await POST(mockRequest(requestBody))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('3 orders updated successfully')
    expect(data.data).toEqual({
      updatedOrders: expectedUpdatedOrders,
      updatedCount: 3
    })
    expect(adminOrderService.bulkUpdateOrders).toHaveBeenCalledWith(['order-1', 'order-2', 'order-3'], 'confirmed')
    expect(logger.info).toHaveBeenCalledWith('Admin initiating bulk order update', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com',
      orderCount: 3
    })
    expect(logger.debug).toHaveBeenCalledWith('Executing bulk order update', { 
      orderCount: 3,
      status: 'confirmed',
      userId: 'admin-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Bulk order update completed successfully', { 
      updatedCount: 3,
      requestedCount: 3,
      status: 'confirmed',
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'BULK_UPDATE_ORDERS',
      'orders',
      { 
        updatedCount: 3,
        status: 'confirmed',
        orderIds: ['order-1', 'order-2', 'order-3']
      }
    )
  })

  it('should handle partial update when some orders are not found', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: BulkUpdateRequest = {
      orderIds: ['order-1', 'order-2', 'order-3'],
      status: 'delivered'
    }

    const mockUpdatedOrders: MockOrder[] = [
      {
        id: 'order-1',
        status: 'delivered',
        updated_at: new Date('2023-01-01T12:00:00Z')
      },
      {
        id: 'order-3',
        status: 'delivered',
        updated_at: new Date('2023-01-01T12:00:00Z')
      }
    ]

    const expectedUpdatedOrders: UpdatedOrder[] = [
      {
        id: 'order-1',
        status: 'delivered',
        updated_at: '2023-01-01T12:00:00.000Z'
      },
      {
        id: 'order-3',
        status: 'delivered',
        updated_at: '2023-01-01T12:00:00.000Z'
      }
    ]

    ;(adminOrderService.bulkUpdateOrders as jest.Mock).mockResolvedValue(mockUpdatedOrders)

    // ACT
    const response = await POST(mockRequest(requestBody))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('2 orders updated successfully')
    expect(data.data).toEqual({
      updatedOrders: expectedUpdatedOrders,
      updatedCount: 2
    })
    expect(logger.info).toHaveBeenCalledWith('Bulk order update completed successfully', { 
      updatedCount: 2,
      requestedCount: 3,
      status: 'delivered',
      userId: 'admin-123' 
    })
  })

  it('should handle empty result from service', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: BulkUpdateRequest = {
      orderIds: ['order-1', 'order-2'],
      status: 'cancelled'
    }

    const mockUpdatedOrders: MockOrder[] = []

    ;(adminOrderService.bulkUpdateOrders as jest.Mock).mockResolvedValue(mockUpdatedOrders)

    // ACT
    const response = await POST(mockRequest(requestBody))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('0 orders updated successfully')
    expect(data.data).toEqual({
      updatedOrders: [],
      updatedCount: 0
    })
  })

  it('should handle service error gracefully', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: BulkUpdateRequest = {
      orderIds: ['order-1'],
      status: 'confirmed'
    }

    const serviceError = new Error('Database connection failed')
    ;(adminOrderService.bulkUpdateOrders as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await POST(mockRequest(requestBody))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to bulk update orders. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_bulk_update_orders',
      service: 'admin',
      endpoint: '/api/admin/orders/bulk-update',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to bulk update orders', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })
})
