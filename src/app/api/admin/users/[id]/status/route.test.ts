// src/app/api/admin/users/[id]/status/route.test.ts
import { PUT } from './route'
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../../lib/auth/auth"
import { adminUserService } from "../../../../../../lib/services/admin/userService"
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

jest.mock("../../../../../../lib/services/admin/userService", () => ({
  adminUserService: {
    updateUserStatus: jest.fn()
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

// Define types for test data
interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

// Helper to create a mock NextRequest
const createMockNextRequest = (body: any = {}): NextRequest => {
  return {
    json: async () => body
  } as unknown as NextRequest
}

describe('PUT /api/admin/users/[id]/status', () => {
  const mockParams = { params: Promise.resolve({ id: 'user-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest({ is_active: false }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to update user status', { userId: 'user-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'UPDATE_USER_STATUS',
      'users',
      'UNAUTHORIZED',
      { targetUserId: 'user-123' }
    )
  })

  it('should return 403 when user is not admin', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'user-456',
        email: 'user@example.com',
        role: 'user'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // ACT
    const response = await PUT(createMockNextRequest({ is_active: false }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to update user status', { 
      userId: 'user-456',
      userRole: 'user',
      targetUserId: 'user-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-456',
      'UPDATE_USER_STATUS',
      'users',
      'FORBIDDEN',
      { userRole: 'user', targetUserId: 'user-123' }
    )
  })

  it('should return 400 when user ID is missing', async () => {
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
    const response = await PUT(createMockNextRequest({ is_active: false }), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "User ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User status update failed - missing user ID')
  })

  it('should return 400 when trying to deactivate self', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockParamsSelf = { params: Promise.resolve({ id: 'admin-123' }) }

    // ACT
    const response = await PUT(createMockNextRequest({ is_active: false }), mockParamsSelf)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Cannot deactivate yourself" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User status update attempt on self', { 
      userId: 'admin-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_USER_STATUS',
      'users',
      'CANNOT_DEACTIVATE_SELF',
      { targetUserId: 'admin-123' }
    )
  })

  it('should return 400 when is_active is missing', async () => {
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
      error: "is_active is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User status update failed - missing is_active', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
  })

  it('should return 400 when is_active is not a boolean', async () => {
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
    const response = await PUT(createMockNextRequest({ is_active: 'true' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "is_active must be a boolean value" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User status update failed - invalid is_active type', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      is_active: 'true' 
    })
  })

  it('should activate user successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { is_active: true }
    const updatedUser: User = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      is_active: true,
      role: 'user',
      created_at: '2023-01-01T10:00:00.000Z',
      updated_at: '2023-01-02T10:00:00.000Z'
    }

    ;(adminUserService.updateUserStatus as jest.Mock).mockResolvedValue(updatedUser)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: updatedUser
    })
    expect(adminUserService.updateUserStatus).toHaveBeenCalledWith('user-123', true)
    expect(logger.info).toHaveBeenCalledWith('Admin updating user status', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      newStatus: true 
    })
    expect(logger.debug).toHaveBeenCalledWith('Executing user status update', { 
      targetUserId: 'user-123',
      is_active: true,
      adminUserId: 'admin-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('User status updated successfully', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      oldStatus: true,
      newStatus: true 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_USER_STATUS',
      'users',
      { 
        targetUserId: 'user-123',
        oldStatus: true,
        newStatus: true 
      }
    )
  })

  it('should deactivate user successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { is_active: false }
    const updatedUser: User = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      is_active: false,
      role: 'user',
      created_at: '2023-01-01T10:00:00.000Z',
      updated_at: '2023-01-02T10:00:00.000Z'
    }

    ;(adminUserService.updateUserStatus as jest.Mock).mockResolvedValue(updatedUser)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: updatedUser
    })
    expect(adminUserService.updateUserStatus).toHaveBeenCalledWith('user-123', false)
    expect(logger.info).toHaveBeenCalledWith('Admin updating user status', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      newStatus: false 
    })
    expect(logger.debug).toHaveBeenCalledWith('Executing user status update', { 
      targetUserId: 'user-123',
      is_active: false,
      adminUserId: 'admin-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('User status updated successfully', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      oldStatus: false,
      newStatus: false 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_USER_STATUS',
      'users',
      { 
        targetUserId: 'user-123',
        oldStatus: false,
        newStatus: false 
      }
    )
  })

  it('should return 404 when user to update is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { is_active: false }
    ;(adminUserService.updateUserStatus as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "User not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('User status update failed - user not found', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
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

    const requestBody = { is_active: false }
    const serviceError = new Error('Database connection failed')
    ;(adminUserService.updateUserStatus as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to update user status. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_update_user_status',
      service: 'admin',
      endpoint: `/api/admin/users/user-123/status`,
      userId: 'admin-123',
      targetUserId: 'user-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to update user status', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack,
      targetUserId: 'user-123'
    })
  })
})
