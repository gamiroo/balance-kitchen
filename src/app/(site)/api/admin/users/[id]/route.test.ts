// src/app/api/admin/users/[id]/route.test.ts
import { GET, DELETE } from './route'
import { getServerSession } from "next-auth"
import { adminUserService } from "@/shared/lib/services/admin/userService"
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

jest.mock("@/shared/lib/services/admin/userService", () => ({
  adminUserService: {
    getUserById: jest.fn(),
    deleteUser: jest.fn()
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
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

describe('GET /api/admin/users/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'user-123' }) }
  const mockResolvedParams = { params: { id: 'user-123' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated with promise params', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to user details', { userId: 'user-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_USER_DETAILS',
      'users',
      'UNAUTHORIZED',
      { targetUserId: 'user-123' }
    )
  })

  it('should return 401 when user is not authenticated with resolved params', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(new Request('http://localhost:3000'), mockResolvedParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to user details', { userId: 'user-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_USER_DETAILS',
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
    const response = await GET(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to user details', { 
      userId: 'user-456',
      userRole: 'user',
      targetUserId: 'user-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-456',
      'ACCESS_USER_DETAILS',
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
    const response = await GET(new Request('http://localhost:3000'), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "User ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User details request failed - missing user ID')
  })

  it('should return user details successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockUser: User = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      is_active: true,
      role: 'user',
      created_at: '2023-01-01T10:00:00.000Z',
      updated_at: '2023-01-01T10:00:00.000Z'
    }

    ;(adminUserService.getUserById as jest.Mock).mockResolvedValue(mockUser)

    // ACT
    const response = await GET(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockUser
    })
    expect(logger.info).toHaveBeenCalledWith('Admin accessing user details', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
    expect(logger.debug).toHaveBeenCalledWith('User details fetched successfully', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_USER_DETAILS',
      'users',
      { targetUserId: 'user-123' }
    )
  })

  it('should return 404 when user is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminUserService.getUserById as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "User not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('User details not found', { 
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

    const serviceError = new Error('Database connection failed')
    ;(adminUserService.getUserById as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch user details. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_user_by_id',
      service: 'admin',
      endpoint: `/api/admin/users/user-123`,
      userId: 'admin-123',
      targetUserId: 'user-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch user details', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack,
      targetUserId: 'user-123'
    })
  })
})

describe('DELETE /api/admin/users/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'user-123' }) }
  const mockResolvedParams = { params: { id: 'user-123' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated with promise params', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to delete user', { userId: 'user-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'DELETE_USER',
      'users',
      'UNAUTHORIZED',
      { targetUserId: 'user-123' }
    )
  })

  it('should return 401 when user is not authenticated with resolved params', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(new Request('http://localhost:3000'), mockResolvedParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to delete user', { userId: 'user-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'DELETE_USER',
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
    const response = await DELETE(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to delete user', { 
      userId: 'user-456',
      userRole: 'user',
      targetUserId: 'user-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-456',
      'DELETE_USER',
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
    const response = await DELETE(new Request('http://localhost:3000'), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "User ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User deletion failed - missing user ID')
  })

  it('should return 400 when trying to delete self', async () => {
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
    const response = await DELETE(new Request('http://localhost:3000'), mockParamsSelf)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Cannot delete yourself" 
    })
    expect(logger.warn).toHaveBeenCalledWith('User deletion attempt on self', { 
      userId: 'admin-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'admin-123',
      'DELETE_USER',
      'users',
      'CANNOT_DELETE_SELF',
      { targetUserId: 'admin-123' }
    )
  })

  it('should delete user successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const deletedUser: User = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      is_active: true,
      role: 'user',
      created_at: '2023-01-01T10:00:00.000Z',
      updated_at: '2023-01-01T10:00:00.000Z'
    }

    ;(adminUserService.deleteUser as jest.Mock).mockResolvedValue(deletedUser)

    // ACT
    const response = await DELETE(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      message: "User deleted successfully"
    })
    expect(adminUserService.deleteUser).toHaveBeenCalledWith('user-123')
    expect(logger.info).toHaveBeenCalledWith('Admin deleting user', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('User deleted successfully', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'DELETE_USER',
      'users',
      { deletedUserId: 'user-123' }
    )
  })

  it('should return 404 when user to delete is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminUserService.deleteUser as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "User not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('User deletion failed - user not found', { 
      adminUserId: 'admin-123',
      targetUserId: 'user-123' 
    })
  })

  it('should handle service error with "Cannot delete user with active orders" message', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const serviceError = new Error('Cannot delete user with active orders')
    ;(adminUserService.deleteUser as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await DELETE(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Cannot delete user with active orders" 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_delete_user',
      service: 'admin',
      endpoint: `/api/admin/users/user-123`,
      userId: 'admin-123',
      targetUserId: 'user-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to delete user', { 
      error: 'Error: Cannot delete user with active orders',
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

    const serviceError = new Error('Database connection failed')
    ;(adminUserService.deleteUser as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await DELETE(new Request('http://localhost:3000'), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to delete user. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_delete_user',
      service: 'admin',
      endpoint: `/api/admin/users/user-123`,
      userId: 'admin-123',
      targetUserId: 'user-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to delete user', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack,
      targetUserId: 'user-123'
    })
  })
})
