// src/app/api/admin/users/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { db } from "@/shared/lib/database/client"
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

jest.mock("@/shared/lib/database/client", () => ({
  db: {
    query: jest.fn()
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
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface UserWithStats extends UserRow {
  total_orders: number;
  total_spent: number;
  meal_balance: number;
}

// Helper to create a mock Request with URL
const createMockRequest = (url: string = 'http://localhost:3000/api/admin/users'): Request => {
  return {
    url
  } as unknown as Request
}

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to users list')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_USERS_LIST',
      'users',
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
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to users list', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_USERS_LIST',
      'users',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return users list successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockUsers: UserRow[] = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        is_active: true,
        created_at: '2023-01-01T10:00:00.000Z'
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        is_active: false,
        created_at: '2023-01-02T10:00:00.000Z'
      }
    ]

    const expectedUsersWithStats: UserWithStats[] = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        is_active: true,
        created_at: '2023-01-01T10:00:00.000Z',
        total_orders: 0,
        total_spent: 0,
        meal_balance: 0
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        is_active: false,
        created_at: '2023-01-02T10:00:00.000Z',
        total_orders: 0,
        total_spent: 0,
        meal_balance: 0
      }
    ]

    ;(db.query as jest.Mock).mockResolvedValue({ rows: mockUsers })

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(expectedUsersWithStats)
    expect(data.meta.count).toBe(2)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing users list', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.info).toHaveBeenCalledWith('Users list fetched successfully', { 
      count: 2,
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_USERS_LIST',
      'users',
      { userCount: 2 }
    )
  })

  it('should filter users by search term in name', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockUsers: UserRow[] = []
    ;(db.query as jest.Mock).mockResolvedValue({ rows: mockUsers })

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/users?search=john'))
    await response.json()

    // ASSERT
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (name ILIKE $1 OR email ILIKE $1)'),
      ['%john%']
    )
    expect(logger.debug).toHaveBeenCalledWith('Fetching users with search filter', { 
      search: 'john', 
      userId: 'admin-123' 
    })
  })

  it('should filter users by search term in email', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockUsers: UserRow[] = []
    ;(db.query as jest.Mock).mockResolvedValue({ rows: mockUsers })

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/users?search=@example.com'))
    await response.json()

    // ASSERT
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (name ILIKE $1 OR email ILIKE $1)'),
      ['%@example.com%']
    )
  })

  it('should handle empty users list', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockUsers: UserRow[] = []
    ;(db.query as jest.Mock).mockResolvedValue({ rows: mockUsers })

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.meta.count).toBe(0)
  })

  it('should handle database error gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const dbError = new Error('Database connection failed')
    ;(db.query as jest.Mock).mockRejectedValue(dbError)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to fetch users list. Please try again.")
    expect(data.details).toBe("Database connection failed")
    expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
      action: 'admin_get_users',
      service: 'admin',
      endpoint: '/api/admin/users',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch users list', { 
      error: 'Error: Database connection failed',
      stack: dbError.stack
    })
  })
})
