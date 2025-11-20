// src/app/api/admin/recent-orders/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminStatsService } from "@/shared/lib/services/admin/statsService"
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

jest.mock("@/shared/lib/services/admin/statsService", () => ({
  adminStatsService: {
    getRecentOrders: jest.fn()
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
interface RecentOrder {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  menu_id: string;
  menu_name: string;
  delivery_date: string;
  status: string;
  total_meals: number;
  total_price: number;
  created_at: string;
}

interface MockUser {
  id: string;
  email: string;
  role: string;
}

interface MockSession {
  user: MockUser;
}

// Helper to create a mock Request
const createMockRequest = (url: string = 'http://localhost:3000/api/admin/recent-orders'): Request => {
  return {
    url: url
  } as unknown as Request
}

describe('GET /api/admin/recent-orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    (getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to recent orders')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_RECENT_ORDERS',
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
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to recent orders', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_RECENT_ORDERS',
      'orders',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return recent orders successfully for admin user with default limit', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: RecentOrder[] = [
      {
        id: 'order-1',
        user_id: 'user-456',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        menu_id: 'menu-789',
        menu_name: 'Weekly Menu',
        delivery_date: '2023-01-15',
        status: 'confirmed',
        total_meals: 5,
        total_price: 45.00,
        created_at: '2023-01-01T10:00:00.000Z'
      }
    ]

    ;(adminStatsService.getRecentOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockOrders)
    expect(data.meta.count).toBe(1)
    expect(data.meta.limit).toBe(10)
    expect(adminStatsService.getRecentOrders).toHaveBeenCalledWith(10)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing recent orders', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Fetching recent orders', { 
      limit: 10, 
      userId: 'admin-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Recent orders fetched successfully', { 
      count: 1,
      limit: 10,
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_RECENT_ORDERS',
      'orders',
      { orderCount: 1, limit: 10 }
    )
  })

  it('should return recent orders with custom limit', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: RecentOrder[] = []
    ;(adminStatsService.getRecentOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/recent-orders?limit=5'))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(adminStatsService.getRecentOrders).toHaveBeenCalledWith(5)
    expect(data.meta.limit).toBe(5)
  })

  it('should return 400 when limit is invalid (negative)', async () => {
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
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/recent-orders?limit=-5'))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Limit must be between 1 and 100" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Invalid limit parameter for recent orders', { 
      userId: 'admin-123',
      limitParam: '-5',
      parsedLimit: -5
    })
  })

  it('should return 400 when limit is invalid (zero)', async () => {
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
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/recent-orders?limit=0'))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Limit must be between 1 and 100" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Invalid limit parameter for recent orders', { 
      userId: 'admin-123',
      limitParam: '0',
      parsedLimit: 0
    })
  })

  it('should return 400 when limit is invalid (over 100)', async () => {
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
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/recent-orders?limit=150'))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Limit must be between 1 and 100" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Invalid limit parameter for recent orders', { 
      userId: 'admin-123',
      limitParam: '150',
      parsedLimit: 150
    })
  })

  it('should return 400 when limit is not a number', async () => {
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
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/recent-orders?limit=abc'))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Limit must be between 1 and 100" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Invalid limit parameter for recent orders', { 
      userId: 'admin-123',
      limitParam: 'abc',
      parsedLimit: NaN
    })
  })

  it('should handle empty recent orders list', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockOrders: RecentOrder[] = []
    ;(adminStatsService.getRecentOrders as jest.Mock).mockResolvedValue(mockOrders)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.meta.count).toBe(0)
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

    const serviceError: Error = new Error('Database connection failed')
    ;(adminStatsService.getRecentOrders as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to fetch recent orders. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_recent_orders',
      service: 'admin',
      endpoint: '/api/admin/recent-orders',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch recent orders', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })
})
