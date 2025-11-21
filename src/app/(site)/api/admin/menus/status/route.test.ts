import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminStatsService } from "@/shared/lib/services/admin/statsService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// Types for our test data
interface MockUser {
  id: string
  email: string
  role: string
}

interface MockSession {
  user: MockUser
}

interface MenuStatusItem {
  id: string
  is_published: boolean
  status: string
}

// Mock external dependencies
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
  getServerSession: jest.fn()
}))

jest.mock("@/shared/lib/services/admin/statsService", () => ({
  adminStatsService: {
    getMenuStatus: jest.fn()
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

describe('GET /api/admin/menus/status', () => {
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
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to menu status')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_MENU_STATUS',
      'menus',
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
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to menu status', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_MENU_STATUS',
      'menus',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return menu status successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockMenuStatusItems: MenuStatusItem[] = [
      { id: 'menu-1', is_published: true, status: 'Active' },
      { id: 'menu-2', is_published: true, status: 'Active' },
      { id: 'menu-3', is_published: false, status: 'Draft' },
      { id: 'menu-4', is_published: true, status: 'Expired' },
      { id: 'menu-5', is_published: true, status: 'Expired' }
    ]

    ;(adminStatsService.getMenuStatus as jest.Mock).mockResolvedValue(mockMenuStatusItems)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: {
        total: 5,
        published: 4,
        draft: 1,
        active: 2,
        expired: 2
      }
    })
    expect(logger.info).toHaveBeenCalledWith('Admin accessing menu status', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Menu status fetched successfully', { 
      userId: 'admin-123',
      status: {
        total: 5,
        published: 4,
        draft: 1,
        active: 2,
        expired: 2
      }
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_MENU_STATUS',
      'menus',
      { 
        status: {
          total: 5,
          published: 4,
          draft: 1,
          active: 2,
          expired: 2
        }
      }
    )
  })

  it('should handle empty menu status', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockMenuStatusItems: MenuStatusItem[] = []

    ;(adminStatsService.getMenuStatus as jest.Mock).mockResolvedValue(mockMenuStatusItems)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: {
        total: 0,
        published: 0,
        draft: 0,
        active: 0,
        expired: 0
      }
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

    const serviceError = new Error('Failed to fetch menu status')
    ;(adminStatsService.getMenuStatus as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET()
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch menu status. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_menu_status',
      service: 'admin',
      endpoint: '/api/admin/menus/status',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch menu status', { 
      error: 'Error: Failed to fetch menu status',
      stack: serviceError.stack
    })
  })
})
