// src/app/api/admin/orders/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminOrderService } from "@/shared/lib/services/admin/orderService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { NextRequest } from "next/server"

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/shared/lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("@/shared/lib/services/admin/orderService", () => ({
  adminOrderService: {
    getAllOrders: jest.fn()
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

// Helper to create a mock NextRequest
const createMockNextRequest = (url: string = 'http://localhost:3000/api/admin/orders'): NextRequest => {
  return {
    url
  } as unknown as NextRequest
}

// Define types for order objects
interface MockOrder {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string;
  created_at: Date;
  user_name?: string;
  user_email?: string;
}

describe('GET /api/admin/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to orders list')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_ORDERS_LIST',
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
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to orders list', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_ORDERS_LIST',
      'orders',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return orders list successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: MockOrder[] = [
      {
        id: 'order-1',
        user_id: 'user-456',
        menu_id: 'menu-789',
        order_date: new Date('2023-01-01'),
        total_meals: 5,
        total_price: 25.00,
        status: 'confirmed',
        created_at: new Date('2023-01-01T10:00:00Z'),
        user_name: 'John Doe',
        user_email: 'john@example.com'
      }
    ]

    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([
      {
        id: 'order-1',
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
    ])
    expect(data.meta.count).toBe(1)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing orders list', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.info).toHaveBeenCalledWith('Orders list fetched successfully', { 
      count: 1,
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_ORDERS_LIST',
      'orders',
      { orderCount: 1, filters: {} }
    )
  })

  it('should filter orders by status', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: MockOrder[] = []
    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockNextRequest('http://localhost:3000/api/admin/orders?status=confirmed'))
    await response.json()

    // ASSERT
    expect(adminOrderService.getAllOrders).toHaveBeenCalledWith({ status: 'confirmed' })
    expect(logger.debug).toHaveBeenCalledWith('Fetching orders with filters', { 
      filters: { status: 'confirmed' } 
    })
  })

  it('should filter orders by user ID', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: MockOrder[] = []
    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockNextRequest('http://localhost:3000/api/admin/orders?userId=user-456'))
    await response.json()

    // ASSERT
    expect(adminOrderService.getAllOrders).toHaveBeenCalledWith({ userId: 'user-456' })
  })

  it('should filter orders by date range', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: MockOrder[] = []
    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockNextRequest('http://localhost:3000/api/admin/orders?startDate=2023-01-01&endDate=2023-01-31'))
    await response.json()

    // ASSERT
    expect(adminOrderService.getAllOrders).toHaveBeenCalledWith({ 
      startDate: '2023-01-01', 
      endDate: '2023-01-31' 
    })
  })

  it('should normalize invalid status to pending', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: MockOrder[] = [
      {
        id: 'order-1',
        user_id: 'user-456',
        menu_id: 'menu-789',
        order_date: new Date('2023-01-01'),
        total_meals: 5,
        total_price: 25.00,
        status: 'invalid-status',
        created_at: new Date('2023-01-01T10:00:00Z')
      }
    ]

    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.data[0].status).toBe('pending')
  })

  it('should handle empty orders list', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: MockOrder[] = []
    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.meta.count).toBe(0)
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
    ;(adminOrderService.getAllOrders as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to fetch orders. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_orders',
      service: 'admin',
      endpoint: '/api/admin/orders',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch orders list', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })

  it('should handle non-array response from service', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminOrderService.getAllOrders as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.meta.count).toBe(0)
  })
})
