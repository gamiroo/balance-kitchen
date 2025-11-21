import { GET, PUT, DELETE } from './route'
import { getServerSession } from "next-auth"
import { adminMenuService } from "@/shared/lib/services/admin/menuService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { NextRequest } from "next/server"

// Types for our test data
interface MockUser {
  id: string
  email: string
  role: string
}

interface MockSession {
  user: MockUser
}

interface MockMenu {
  id: string
  week_start_date: string
  week_end_date: string
  created_by: string
  is_published: boolean
  status: string
}

interface UpdateMenuRequest {
  week_start_date?: string
  week_end_date?: string
  is_published?: boolean
}

interface MockParams {
  params: Promise<{ id: string }>
}

// Mock external dependencies
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})), // Mock NextAuth function
  getServerSession: jest.fn()
}))

jest.mock("@/shared/lib/services/admin/menuService", () => ({
  adminMenuService: {
    getMenuById: jest.fn(),
    updateMenu: jest.fn(),
    deleteMenu: jest.fn()
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
const createMockNextRequest = <T>(options: { 
  method?: string; 
  body?: T;
  url?: string;
} = {}): NextRequest => {
  return {
    method: options.method || 'GET',
    url: options.url || 'http://localhost:3000',
    json: options.body ? async () => options.body : undefined
  } as unknown as NextRequest
}

describe('GET /api/admin/menus/[id]', () => {
  const mockParams: MockParams = { params: Promise.resolve({ id: 'menu-123' }) }

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
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to menu details', { menuId: 'menu-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_MENU_DETAILS',
      'menus',
      'UNAUTHORIZED',
      { menuId: 'menu-123' }
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
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to menu details', { 
      userId: 'user-123',
      userRole: 'user',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_MENU_DETAILS',
      'menus',
      'FORBIDDEN',
      { userRole: 'user', menuId: 'menu-123' }
    )
  })

  it('should return 400 when menu ID is missing', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockParamsWithoutId: MockParams = { params: Promise.resolve({ id: '' }) }

    // ACT
    const response = await GET(createMockNextRequest(), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Menu ID is required" })
    expect(logger.warn).toHaveBeenCalledWith('Menu details request failed - missing menu ID')
  })

  it('should return menu details successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockMenu: MockMenu = {
      id: 'menu-123',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: true,
      status: 'Active'
    }

    ;(adminMenuService.getMenuById as jest.Mock).mockResolvedValue(mockMenu)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockMenu
    })
    expect(logger.info).toHaveBeenCalledWith('Admin accessing menu details', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Menu details fetched successfully', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_MENU_DETAILS',
      'menus',
      { menuId: 'menu-123' }
    )
  })

  it('should return 404 when menu is not found', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminMenuService.getMenuById as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: "Menu not found" })
    expect(logger.info).toHaveBeenCalledWith('Menu not found', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
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

    const serviceError = new Error('Service unavailable')
    ;(adminMenuService.getMenuById as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch menu details. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_menu_by_id',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch menu details', { 
      error: 'Error: Service unavailable',
      stack: serviceError.stack,
      menuId: 'menu-123'
    })
  })
})

describe('PUT /api/admin/menus/[id]', () => {
  const mockParams: MockParams = { params: Promise.resolve({ id: 'menu-123' }) }
  const mockRequest = <T>(body: T) => ({
    json: async () => body
  } as NextRequest)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(mockRequest({}), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to update menu', { menuId: 'menu-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'UPDATE_MENU',
      'menus',
      'UNAUTHORIZED',
      { menuId: 'menu-123' }
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
    const response = await PUT(mockRequest({}), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to update menu', { 
      userId: 'user-123',
      userRole: 'user',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'UPDATE_MENU',
      'menus',
      'FORBIDDEN',
      { userRole: 'user', menuId: 'menu-123' }
    )
  })

  it('should return 400 when menu ID is missing', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockParamsWithoutId: MockParams = { params: Promise.resolve({ id: '' }) }

    // ACT
    const response = await PUT(mockRequest({}), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Menu ID is required" })
    expect(logger.warn).toHaveBeenCalledWith('Menu update failed - missing menu ID')
  })

  it('should update menu successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: UpdateMenuRequest = {
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      is_published: true
    }

    const updatedMenu: MockMenu = {
      id: 'menu-123',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: true,
      status: 'Active'
    }

    ;(adminMenuService.updateMenu as jest.Mock).mockResolvedValue(updatedMenu)

    // ACT
    const response = await PUT(mockRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: updatedMenu
    })
    expect(logger.info).toHaveBeenCalledWith('Admin updating menu', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Updating menu with data', { 
      menuId: 'menu-123',
      updateFields: ['week_start_date', 'week_end_date', 'is_published']
    })
    expect(logger.info).toHaveBeenCalledWith('Menu updated successfully', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_MENU',
      'menus',
      { menuId: 'menu-123' }
    )
  })

  it('should return 404 when menu to update is not found', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: UpdateMenuRequest = { is_published: true }
    ;(adminMenuService.updateMenu as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(mockRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: "Menu not found" })
    expect(logger.info).toHaveBeenCalledWith('Menu update failed - menu not found', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
  })

  it('should handle service error during update gracefully', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody: UpdateMenuRequest = { is_published: true }
    const serviceError = new Error('Update failed')
    ;(adminMenuService.updateMenu as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await PUT(mockRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to update menu. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_update_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to update menu', { 
      error: 'Error: Update failed',
      stack: serviceError.stack,
      menuId: 'menu-123'
    })
  })
})

describe('DELETE /api/admin/menus/[id]', () => {
  const mockParams: MockParams = { params: Promise.resolve({ id: 'menu-123' }) }
  const mockRequest = () => ({ method: 'DELETE' } as NextRequest)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(mockRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to delete menu', { menuId: 'menu-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'DELETE_MENU',
      'menus',
      'UNAUTHORIZED',
      { menuId: 'menu-123' }
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
    const response = await DELETE(mockRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to delete menu', { 
      userId: 'user-123',
      userRole: 'user',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'DELETE_MENU',
      'menus',
      'FORBIDDEN',
      { userRole: 'user', menuId: 'menu-123' }
    )
  })

  it('should return 400 when menu ID is missing', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockParamsWithoutId: MockParams = { params: Promise.resolve({ id: '' }) }

    // ACT
    const response = await DELETE(mockRequest(), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Menu ID is required" })
    expect(logger.warn).toHaveBeenCalledWith('Menu deletion failed - missing menu ID')
  })

  it('should delete menu successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const deletedMenu: MockMenu = {
      id: 'menu-123',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: true,
      status: 'Active'
    }

    ;(adminMenuService.deleteMenu as jest.Mock).mockResolvedValue(deletedMenu)

    // ACT
    const response = await DELETE(mockRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      message: "Menu deleted successfully"
    })
    expect(logger.info).toHaveBeenCalledWith('Admin deleting menu', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Menu deleted successfully', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'DELETE_MENU',
      'menus',
      { menuId: 'menu-123' }
    )
  })

  it('should return 404 when menu to delete is not found', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminMenuService.deleteMenu as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(mockRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: "Menu not found" })
    expect(logger.info).toHaveBeenCalledWith('Menu deletion failed - menu not found', { 
      userId: 'admin-123',
      menuId: 'menu-123' 
    })
  })

  it('should handle service error during deletion gracefully', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const serviceError = new Error('Deletion failed')
    ;(adminMenuService.deleteMenu as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await DELETE(mockRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to delete menu. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_delete_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/menu-123`,
      userId: 'admin-123',
      menuId: 'menu-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to delete menu', { 
      error: 'Error: Deletion failed',
      stack: serviceError.stack,
      menuId: 'menu-123'
    })
  })
})
