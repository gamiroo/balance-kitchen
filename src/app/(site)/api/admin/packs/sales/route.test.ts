// src/app/api/admin/packs/sales/route.test.ts
import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminPackService } from "@/shared/lib/services/admin/packService"
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

jest.mock("@/shared/lib/services/admin/packService", () => ({
  adminPackService: {
    getAllPackSales: jest.fn()
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
interface PackSale {
  id: string;
  user_id: string;
  pack_template_id: string;
  purchase_date: string;
  expiry_date: string;
  status: string;
  price: number;
  user_name?: string;
  user_email?: string;
  pack_template_name?: string;
}

// Create a mock Request object
const createMockRequest = (url: string = 'http://localhost:3000/api/admin/packs/sales') => {
  return {
    url
  } as Request
}

describe('GET /api/admin/packs/sales', () => {
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
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to pack sales list')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_PACK_SALES_LIST',
      'packs',
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
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to pack sales list', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_PACK_SALES_LIST',
      'packs',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return pack sales list successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockSales: PackSale[] = [
      {
        id: 'sale-1',
        user_id: 'user-456',
        pack_template_id: 'template-789',
        purchase_date: '2023-01-01T10:00:00.000Z',
        expiry_date: '2023-02-01T10:00:00.000Z',
        status: 'active',
        price: 50.00,
        user_name: 'John Doe',
        user_email: 'john@example.com',
        pack_template_name: 'Weekly Pack'
      }
    ]

    ;(adminPackService.getAllPackSales as jest.Mock).mockResolvedValue(mockSales)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockSales)
    expect(data.meta.count).toBe(1)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing pack sales list', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.info).toHaveBeenCalledWith('Pack sales list fetched successfully', { 
      count: 1,
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_PACK_SALES_LIST',
      'packs',
      { salesCount: 1, filters: {} }
    )
  })

  it('should filter pack sales by template ID', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockSales: PackSale[] = []
    ;(adminPackService.getAllPackSales as jest.Mock).mockResolvedValue(mockSales)

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/packs/sales?templateId=template-123'))
    await response.json()

    // ASSERT
    expect(adminPackService.getAllPackSales).toHaveBeenCalledWith({ templateId: 'template-123' })
    expect(logger.debug).toHaveBeenCalledWith('Fetching pack sales with filters', { 
      filters: { templateId: 'template-123' } 
    })
  })

  it('should filter pack sales by status', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockSales: PackSale[] = []
    ;(adminPackService.getAllPackSales as jest.Mock).mockResolvedValue(mockSales)

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/packs/sales?status=active'))
    await response.json()

    // ASSERT
    expect(adminPackService.getAllPackSales).toHaveBeenCalledWith({ status: 'active' })
  })

  it('should filter pack sales by date range', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockSales: PackSale[] = []
    ;(adminPackService.getAllPackSales as jest.Mock).mockResolvedValue(mockSales)

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/packs/sales?startDate=2023-01-01&endDate=2023-01-31'))
    await response.json()

    // ASSERT
    expect(adminPackService.getAllPackSales).toHaveBeenCalledWith({ 
      startDate: '2023-01-01', 
      endDate: '2023-01-31' 
    })
  })

  it('should handle multiple filters', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockSales: PackSale[] = []
    ;(adminPackService.getAllPackSales as jest.Mock).mockResolvedValue(mockSales)

    // ACT
    const response = await GET(createMockRequest('http://localhost:3000/api/admin/packs/sales?templateId=template-123&status=active&startDate=2023-01-01&endDate=2023-01-31'))
    await response.json()

    // ASSERT
    expect(adminPackService.getAllPackSales).toHaveBeenCalledWith({ 
      templateId: 'template-123',
      status: 'active',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    })
    expect(logger.debug).toHaveBeenCalledWith('Fetching pack sales with filters', { 
      filters: { 
        templateId: 'template-123',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      } 
    })
  })

  it('should handle empty pack sales list', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockSales: PackSale[] = []
    ;(adminPackService.getAllPackSales as jest.Mock).mockResolvedValue(mockSales)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.meta.count).toBe(0)
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
    ;(adminPackService.getAllPackSales as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to fetch pack sales. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_pack_sales',
      service: 'admin',
      endpoint: '/api/admin/packs/sales',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack sales list', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })
})
