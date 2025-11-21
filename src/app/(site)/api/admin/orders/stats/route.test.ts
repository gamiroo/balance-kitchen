// src/app/api/admin/orders/stats/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminOrderService } from "@/shared/lib/services/admin/orderService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/shared/lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("@/shared/lib/services/admin/orderService", () => ({
  adminOrderService: {
    getOrderStats: jest.fn()
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

// Define types for test data
interface ServiceOrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value?: number;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

describe('GET /api/admin/orders/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to order stats')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_ORDER_STATS',
      'orders',
      'UNAUTHORIZED'
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
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to order stats', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_ORDER_STATS',
      'orders',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return order statistics successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockServiceStats: ServiceOrderStats = {
      total_orders: 100,
      pending_orders: 10,
      confirmed_orders: 30,
      delivered_orders: 50,
      cancelled_orders: 10,
      total_revenue: 2500.00,
      average_order_value: 25.00
    }

    const expectedStats: OrderStats = {
      totalOrders: 100,
      pendingOrders: 10,
      confirmedOrders: 30,
      deliveredOrders: 50,
      cancelledOrders: 10,
      totalRevenue: 2500.00,
      averageOrderValue: 25.00
    }

    ;(adminOrderService.getOrderStats as jest.Mock).mockResolvedValue(mockServiceStats)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: expectedStats
    })
    expect(logger.info).toHaveBeenCalledWith('Admin accessing order statistics', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Order statistics fetched successfully', { 
      userId: 'admin-123',
      stats: expectedStats 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_ORDER_STATS',
      'orders',
      { stats: expectedStats }
    )
  })

  it('should handle missing average_order_value by defaulting to 0', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockServiceStats: ServiceOrderStats = {
      total_orders: 50,
      pending_orders: 5,
      confirmed_orders: 15,
      delivered_orders: 25,
      cancelled_orders: 5,
      total_revenue: 1250.00
      // average_order_value is missing
    }


    ;(adminOrderService.getOrderStats as jest.Mock).mockResolvedValue(mockServiceStats)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.data.averageOrderValue).toBe(0)
  })

  it('should handle service returning zero values', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockServiceStats: ServiceOrderStats = {
      total_orders: 0,
      pending_orders: 0,
      confirmed_orders: 0,
      delivered_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
      average_order_value: 0
    }

    const expectedStats: OrderStats = {
      totalOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    }

    ;(adminOrderService.getOrderStats as jest.Mock).mockResolvedValue(mockServiceStats)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.data).toEqual(expectedStats)
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

    const serviceError = new Error('Database connection failed')
    ;(adminOrderService.getOrderStats as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch order statistics. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_order_stats',
      service: 'admin',
      endpoint: '/api/admin/orders/stats',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch order statistics', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })
})
