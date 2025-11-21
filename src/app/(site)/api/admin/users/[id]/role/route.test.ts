// src/app/api/admin/users/[id]/role/route.test.ts
import { PUT } from './route'
import { getServerSession } from "next-auth"
import { adminUserService } from "@/shared/lib/services/admin/userService"
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

jest.mock("@/shared/lib/services/admin/userService", () => ({
  adminUserService: {
    updateUserRole: jest.fn()
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
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// Helper to create a mock NextRequest
const createMockNextRequest = (body: Record<string, unknown> = {}): NextRequest => {
  return {
    json: async () => body
  } as unknown as NextRequest
}

describe('PUT /api/admin/users/[id]/role', () => {
  const mockParams = { params: Promise.resolve({ id: 'user-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest({ role: 'admin' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to update user role', { userId: 'user-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'UPDATE_USER_ROLE',
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
    const response = await PUT(createMockNextRequest({ role: 'admin' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to update user role', { 
      userId: 'user-456',
      userRole: 'user',
      targetUserId: 'user-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-456',
      'UPDATE_USER_ROLE',
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
    const response = await PUT(createMockNextRequest({ role: 'admin' }), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "User ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User role update failed - missing user ID')
  })

  it('should return 400 when trying to change own role', async () => {
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
    const response = await PUT(createMockNextRequest({ role: 'user' }), mockParamsSelf)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Cannot change your own role" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User role update attempt on self', { 
      userId: 'admin-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_USER_ROLE',
      'users',
      'CANNOT_CHANGE_OWN_ROLE',
      { targetUserId: 'admin-123' }
    )
  })

  it('should return 400 when role is missing', async () => {
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
      error: "Role is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User role update failed - missing role', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
  })

  it('should return 400 when role is invalid', async () => {
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
    const response = await PUT(createMockNextRequest({ role: 'invalid-role' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Invalid role. Must be one of: user, admin" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User role update failed - invalid role', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      role: 'invalid-role' 
    })
  })

  it('should update user role successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { role: 'admin' }
    const updatedUser: User = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-02T10:00:00Z')
    }

    ;(adminUserService.updateUserRole as jest.Mock).mockResolvedValue(updatedUser)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    // Compare the data without Date objects since they get serialized to strings
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('user-123')
    expect(data.data.name).toBe('John Doe')
    expect(data.data.email).toBe('john@example.com')
    expect(data.data.role).toBe('admin')
    expect(data.data.created_at).toBe('2023-01-01T10:00:00.000Z')
    expect(data.data.updated_at).toBe('2023-01-02T10:00:00.000Z')
    
    expect(adminUserService.updateUserRole).toHaveBeenCalledWith('user-123', 'admin')
    expect(logger.info).toHaveBeenCalledWith('Admin updating user role', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      newRole: 'admin' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Executing user role update', { 
      targetUserId: 'user-123',
      role: 'admin',
      adminUserId: 'admin-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('User role updated successfully', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123',
      oldRole: 'admin',
      newRole: 'admin' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_USER_ROLE',
      'users',
      { 
        targetUserId: 'user-123',
        oldRole: 'admin',
        newRole: 'admin' 
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

    const requestBody = { role: 'user' }
    ;(adminUserService.updateUserRole as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "User not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('User role update failed - user not found', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
  })

  it('should handle service error with "Invalid role" message', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { role: 'admin' }
    const serviceError = new Error('Invalid role')
    ;(adminUserService.updateUserRole as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Invalid role" 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_update_user_role',
      service: 'admin',
      endpoint: `/api/admin/users/user-123/role`,
      userId: 'admin-123',
      targetUserId: 'user-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to update user role', { 
      error: 'Error: Invalid role',
      stack: serviceError.stack,
      targetUserId: 'user-123'
    })
  })

  it('should handle general service error gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { role: 'admin' }
    const serviceError = new Error('Database connection failed')
    ;(adminUserService.updateUserRole as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await PUT(createMockNextRequest(requestBody), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to update user role. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_update_user_role',
      service: 'admin',
      endpoint: `/api/admin/users/user-123/role`,
      userId: 'admin-123',
      targetUserId: 'user-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to update user role', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack,
      targetUserId: 'user-123'
    })
  })
})
