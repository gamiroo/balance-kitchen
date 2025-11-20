// src/app/api/admin/menus/[id]/publish/route.test.ts
import { POST } from './route'
import { getServerSession } from "next-auth"
import { adminMenuService } from "../../../../../../lib/services/admin/menuService"
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

jest.mock("../../../../../../lib/services/admin/menuService", () => ({
  adminMenuService: {
    getAllMenus: jest.fn(),
    unpublishMenu: jest.fn(),
    publishMenu: jest.fn()
  }
}))

jest.mock('../../../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('../../../../../../lib/logging/audit-logger', () => ({
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

// Define types for menu objects
interface MockMenu {
  id: string;
  is_published: boolean;
}

describe('POST /api/admin/menus/[id]/publish', () => {
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
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to publish menu', { menuId: 'menu-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'PUBLISH_MENU',
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
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to publish menu', { 
      userId: 'user-123',
      userRole: 'user',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'PUBLISH_MENU',
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
    expect(logger.warn).toHaveBeenCalledWith('Menu publish failed - missing menu ID')
  })

  it('should publish menu successfully and unpublish other menus', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockPublishedMenus: MockMenu[] = [
      { id: 'menu-123', is_published: true },
      { id: 'menu-456', is_published: true },
      { id: 'menu-789', is_published: true }
    ]

    const mockPublishedMenu = {
      id: 'menu-123',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: true,
      status: 'Active'
    }

    ;(adminMenuService.getAllMenus as jest.Mock).mockResolvedValue(mockPublishedMenus)
    ;(adminMenuService.unpublishMenu as jest.Mock).mockResolvedValue({})
    ;(adminMenuService.publishMenu as jest.Mock).mockResolvedValue(mockPublishedMenu)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockPublishedMenu
    })
    
    // Verify that unpublish was called for other menus but not the target menu
    expect(adminMenuService.unpublishMenu).toHaveBeenCalledTimes(2)
    expect(adminMenuService.unpublishMenu).toHaveBeenCalledWith('menu-456')
    expect(adminMenuService.unpublishMenu).toHaveBeenCalledWith('menu-789')
    expect(adminMenuService.unpublishMenu).not.toHaveBeenCalledWith('menu-123')
    
    expect(adminMenuService.publishMenu).toHaveBeenCalledWith('menu-123')
    
    expect(logger.info).toHaveBeenCalledWith('Admin publishing menu', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Menu published successfully', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'PUBLISH_MENU',
      'menus',
      { menuId: 'menu-123' }
    )
  })

  it('should handle case when no other menus are published', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockPublishedMenus: MockMenu[] = [
      { id: 'menu-123', is_published: true }
    ]

    const mockPublishedMenu = {
      id: 'menu-123',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: true,
      status: 'Active'
    }

    ;(adminMenuService.getAllMenus as jest.Mock).mockResolvedValue(mockPublishedMenus)
    ;(adminMenuService.unpublishMenu as jest.Mock).mockResolvedValue({})
    ;(adminMenuService.publishMenu as jest.Mock).mockResolvedValue(mockPublishedMenu)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockPublishedMenu
    })
    
    // Verify that unpublish was not called since no other menus need to be unpublished
    expect(adminMenuService.unpublishMenu).not.toHaveBeenCalled()
    expect(adminMenuService.publishMenu).toHaveBeenCalledWith('menu-123')
  })

  it('should return 404 when menu to publish is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockPublishedMenus: MockMenu[] = []

    ;(adminMenuService.getAllMenus as jest.Mock).mockResolvedValue(mockPublishedMenus)
    ;(adminMenuService.publishMenu as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: "Menu not found" })
    expect(logger.info).toHaveBeenCalledWith('Menu publish failed - menu not found', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
  })

  it('should handle service error during getAllMenus gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const serviceError = new Error('Failed to fetch menus')
    ;(adminMenuService.getAllMenus as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to publish menu. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_publish_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123/publish`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to publish menu', { 
      error: 'Error: Failed to fetch menus',
      stack: serviceError.stack,
      menuId: 'menu-123'
    })
  })

  it('should handle service error during unpublishMenu gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockPublishedMenus: MockMenu[] = [
      { id: 'menu-456', is_published: true }
    ]

    const unpublishError = new Error('Failed to unpublish menu')
    ;(adminMenuService.getAllMenus as jest.Mock).mockResolvedValue(mockPublishedMenus)
    ;(adminMenuService.unpublishMenu as jest.Mock).mockRejectedValue(unpublishError)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to publish menu. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(unpublishError, {
      action: 'admin_publish_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123/publish`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to publish menu', { 
      error: 'Error: Failed to unpublish menu',
      stack: unpublishError.stack,
      menuId: 'menu-123'
    })
  })

  it('should handle service error during publishMenu gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockPublishedMenus: MockMenu[] = []

    const publishError = new Error('Failed to publish menu')
    ;(adminMenuService.getAllMenus as jest.Mock).mockResolvedValue(mockPublishedMenus)
    ;(adminMenuService.publishMenu as jest.Mock).mockRejectedValue(publishError)

    // ACT
    const response = await POST(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to publish menu. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(publishError, {
      action: 'admin_publish_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123/publish`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to publish menu', { 
      error: 'Error: Failed to publish menu',
      stack: publishError.stack,
      menuId: 'menu-123'
    })
  })
})
