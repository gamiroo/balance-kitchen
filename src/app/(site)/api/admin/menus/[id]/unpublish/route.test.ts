// src/app/api/admin/menus/[id]/unpublish/route.test.ts
import { POST } from './route'
import { getServerSession } from "next-auth"
import { adminMenuService } from "@/shared/lib/services/admin/menuService"
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

jest.mock("@/shared/lib/services/admin/menuService", () => ({
  adminMenuService: {
    unpublishMenu: jest.fn()
  }
}))

jest.mock('@/shared/lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('@/shared/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('@/shared/lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

// Helper to create a mock NextRequest
const createMockNextRequest = (): NextRequest => {
  return {
    method: 'POST'
  } as unknown as NextRequest
}

describe('POST /api/admin/menus/[id]/unpublish', () => {
  const mockParams = { params: Promise.resolve({ id: 'menu-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to unpublish menu', { menuId: 'menu-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'UNPUBLISH_MENU',
      'menus',
      'UNAUTHORIZED',
      { menuId: 'menu-123' }
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
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to unpublish menu', { 
      userId: 'user-123',
      userRole: 'user',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'UNPUBLISH_MENU',
      'menus',
      'FORBIDDEN',
      { userRole: 'user', menuId: 'menu-123' }
    )
  })

  it('should return 400 when menu ID is missing', async () => {
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
    const response = await POST(createMockNextRequest(), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Menu ID is required" })
    expect(logger.warn).toHaveBeenCalledWith('Menu unpublish failed - missing menu ID')
  })

  it('should unpublish menu successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockUnpublishedMenu = {
      id: 'menu-123',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: false,
      status: 'Draft'
    }

    ;(adminMenuService.unpublishMenu as jest.Mock).mockResolvedValue(mockUnpublishedMenu)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockUnpublishedMenu
    })
    expect(adminMenuService.unpublishMenu).toHaveBeenCalledWith('menu-123')
    expect(logger.info).toHaveBeenCalledWith('Admin unpublishing menu', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Menu unpublished successfully', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UNPUBLISH_MENU',
      'menus',
      { menuId: 'menu-123' }
    )
  })

  it('should return 404 when menu to unpublish is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminMenuService.unpublishMenu as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: "Menu not found" })
    expect(logger.info).toHaveBeenCalledWith('Menu unpublish failed - menu not found', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
  })

  it('should handle service error during unpublish gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const serviceError = new Error('Failed to unpublish menu')
    ;(adminMenuService.unpublishMenu as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to unpublish menu. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_unpublish_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123/unpublish`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to unpublish menu', { 
      error: 'Error: Failed to unpublish menu',
      stack: serviceError.stack,
      menuId: 'menu-123'
    })
  })
})
