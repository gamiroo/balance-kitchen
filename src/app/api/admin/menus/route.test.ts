import { GET, POST } from './route'
import { getServerSession } from "next-auth"
import { db } from "../../../../lib/database/client"
import { captureErrorSafe } from '../../../../lib/utils/error-utils'
import { logger } from '../../../../lib/logging/logger'
import { AuditLogger } from '../../../../lib/logging/audit-logger'

// Types for our test data
interface MockUser {
  id: string
  email: string
  role: string
}

interface MockSession {
  user: MockUser
}

// Mock external dependencies
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
  getServerSession: jest.fn()
}))

jest.mock("../../../../lib/database/client", () => ({
  db: {
    query: jest.fn()
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

describe('GET /api/admin/menus', () => {
  const mockRequest = (url: string = 'http://localhost:3000/api/admin/menus') => ({
    url
  } as Request)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    (getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(mockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to menus list')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_MENUS_LIST',
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
    const response = await GET(mockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to menus list', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_MENUS_LIST',
      'menus',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return menus list successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockDbResult = {
      rows: [
        {
          id: 'menu-1',
          week_start_date: new Date('2023-01-01'),
          week_end_date: new Date('2023-01-07'),
          created_by: 'admin-123',
          created_by_name: 'Admin User',
          item_count: 5,
          is_published: true,
          status: 'Active'
        }
      ]
    }
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)

    // ACT
    const response = await GET(mockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([
      {
        id: 'menu-1',
        week_start_date: '2023-01-01T00:00:00.000Z',
        week_end_date: '2023-01-07T00:00:00.000Z',
        created_by: 'admin-123',
        created_by_name: 'Admin User',
        item_count: 5,
        is_published: true,
        status: 'Active'
      }
    ])
    expect(data.meta.count).toBe(1)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing menus list', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.info).toHaveBeenCalledWith('Menus list fetched successfully', { 
      count: 1,
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_MENUS_LIST',
      'menus',
      { menuCount: 1 }
    )
  })

  it('should filter menus by published status', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockDbResult = { rows: [] }
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)

    // ACT
    const response = await GET(mockRequest('http://localhost:3000/api/admin/menus?published=true'))
    await response.json()

    // ASSERT
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND m.is_published = $1'),
      [true]
    )
  })

  it('should filter menus by start date', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockDbResult = { rows: [] }
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)

    // ACT
    const response = await GET(mockRequest('http://localhost:3000/api/admin/menus?startDate=2023-01-01'))
    await response.json()

    // ASSERT
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND m.week_start_date >= $1'),
      ['2023-01-01']
    )
  })

  it('should filter menus by end date', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockDbResult = { rows: [] }
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)

    // ACT
    const response = await GET(mockRequest('http://localhost:3000/api/admin/menus?endDate=2023-01-31'))
    await response.json()

    // ASSERT
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND m.week_end_date <= $1'),
      ['2023-01-31']
    )
  })

  it('should handle database error gracefully', async () => {
    // ARRANGE
    const mockSession: MockSession = {
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
    const response = await GET(mockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to fetch menus. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
      action: 'admin_get_menus',
      service: 'admin',
      endpoint: '/api/admin/menus',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch menus list', { 
      error: 'Error: Database connection failed',
      stack: dbError.stack
    })
  })
})

describe('POST /api/admin/menus', () => {
  const mockRequest = <T>(body: T) => ({
    json: async () => body
  } as Request)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    (getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(mockRequest({}))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to create menu')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'CREATE_MENU',
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
    const response = await POST(mockRequest({}))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: "Forbidden" })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to create menu', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'CREATE_MENU',
      'menus',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return 400 when required dates are missing', async () => {
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
    const response = await POST(mockRequest({}))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Week start date and end date are required" })
    expect(logger.warn).toHaveBeenCalledWith('Menu creation failed - missing required dates', { 
      userId: 'admin-123' 
    })
  })

  it('should create menu successfully for admin user', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07'
    }

    const mockDbResult = {
      rows: [{
        id: 'new-menu-1',
        week_start_date: '2023-01-01',
        week_end_date: '2023-01-07',
        created_by: 'admin-123',
        is_published: false,
        is_active: true,
        created_at: '2023-01-01T10:00:00Z'
      }]
    }
    ;(db.query as jest.Mock).mockResolvedValue(mockDbResult)

    // ACT
    const response = await POST(mockRequest(requestBody))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      id: 'new-menu-1',
      week_start_date: '2023-01-01T00:00:00.000Z',
      week_end_date: '2023-01-07T00:00:00.000Z',
      created_by: 'admin-123',
      is_published: false,
      is_active: true,
      created_at: '2023-01-01T10:00:00.000Z'
    })
    expect(logger.info).toHaveBeenCalledWith('Admin creating new menu', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.info).toHaveBeenCalledWith('Menu created successfully', { 
      menuId: 'new-menu-1',
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'CREATE_MENU',
      'menus',
      { menuId: 'new-menu-1' }
    )
  })

  it('should handle database error during menu creation', async () => {
    // ARRANGE
    const mockSession: MockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07'
    }

    const dbError = new Error('Database insert failed')
    ;(db.query as jest.Mock).mockRejectedValue(dbError)

    // ACT
    const response = await POST(mockRequest(requestBody))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to create menu. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
      action: 'admin_create_menu',
      service: 'admin',
      endpoint: '/api/admin/menus',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to create menu', { 
      error: 'Error: Database insert failed',
      stack: dbError.stack
    })
  })
})
