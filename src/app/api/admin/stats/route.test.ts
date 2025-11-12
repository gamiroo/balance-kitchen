// src/app/api/admin/stats/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth/auth"
import { adminStatsService } from "../../../../lib/services/admin/statsService"
import { captureErrorSafe } from '../../../../lib/utils/error-utils'
import { logger } from '../../../../lib/logging/logger'
import { AuditLogger } from '../../../../lib/logging/audit-logger'

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("../../../../lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("../../../../lib/services/admin/statsService", () => ({
  adminStatsService: {
    getDashboardStats: jest.fn()
  }
}))

jest.mock('../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

// Define types for test data
interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeMenus: number;
  activePacks: number;
  [key: string]: number;
}

describe('GET /api/admin/stats', () => {
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
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to dashboard stats')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_DASHBOARD_STATS',
      'admin',
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
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to dashboard stats', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_DASHBOARD_STATS',
      'admin',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return dashboard statistics successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockStats: DashboardStats = {
      totalUsers: 150,
      totalOrders: 320,
      totalRevenue: 12800.50,
      pendingOrders: 12,
      activeMenus: 4,
      activePacks: 3
    }

    ;(adminStatsService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockStats
    })
    expect(logger.info).toHaveBeenCalledWith('Admin accessing dashboard statistics', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Dashboard statistics fetched successfully', { 
      userId: 'admin-123',
      statsKeys: ['totalUsers', 'totalOrders', 'totalRevenue', 'pendingOrders', 'activeMenus', 'activePacks']
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_DASHBOARD_STATS',
      'admin',
      { statsKeys: ['totalUsers', 'totalOrders', 'totalRevenue', 'pendingOrders', 'activeMenus', 'activePacks'] }
    )
  })

  it('should handle empty statistics object', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockStats = {}
    ;(adminStatsService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: {}
    })
    expect(logger.debug).toHaveBeenCalledWith('Dashboard statistics fetched successfully', { 
      userId: 'admin-123',
      statsKeys: []
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

    const serviceError = new Error('Database connection failed')
    ;(adminStatsService.getDashboardStats as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch dashboard statistics. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_dashboard_stats',
      service: 'admin',
      endpoint: '/api/admin/stats',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch dashboard statistics', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })
})
