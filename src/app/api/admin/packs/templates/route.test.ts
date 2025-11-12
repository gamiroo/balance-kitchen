import { GET, POST } from './route'
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { adminPackService } from "../../../../../lib/services/admin/packService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'
import { NextRequest } from "next/server"

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("../../../../../lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("../../../../../lib/services/admin/packService", () => ({
  adminPackService: {
    getAllPackTemplates: jest.fn(),
    createPackTemplate: jest.fn()
  }
}))

jest.mock('../../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

// Define types for test data
interface PackTemplate {
  id: string;
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Helper to create a mock NextRequest
const createMockNextRequest = (options: { 
  url?: string;
  body?: any;
  method?: string;
} = {}): NextRequest => {
  return {
    url: options.url || 'http://localhost:3000/api/admin/packs/templates',
    method: options.method || 'GET',
    json: options.body ? async () => options.body : undefined
  } as unknown as NextRequest
}

describe('GET /api/admin/packs/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to pack templates list')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_PACK_TEMPLATES_LIST',
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
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to pack templates list', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_PACK_TEMPLATES_LIST',
      'packs',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return pack templates list successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // Create mock templates with Date objects (as returned by database)
    const mockTemplates: PackTemplate[] = [
      {
        id: 'template-1',
        name: 'Weekly Pack',
        size: 5,
        price: 45.00,
        description: '5 meals per week',
        is_active: true,
        created_at: new Date('2023-01-01T10:00:00Z'),
        updated_at: new Date('2023-01-01T10:00:00Z')
      },
      {
        id: 'template-2',
        name: 'Bi-Weekly Pack',
        size: 10,
        price: 85.00,
        description: '10 meals every two weeks',
        is_active: false,
        created_at: new Date('2023-01-02T10:00:00Z'),
        updated_at: new Date('2023-01-02T10:00:00Z')
      }
    ]

    ;(adminPackService.getAllPackTemplates as jest.Mock).mockResolvedValue(mockTemplates)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    
    // Create expected response with ISO strings (as they appear after JSON serialization)
    const expectedTemplates = mockTemplates.map(template => ({
      ...template,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString()
    }))
    
    expect(data.data).toEqual(expectedTemplates)
    expect(data.meta.count).toBe(2)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing pack templates list', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.info).toHaveBeenCalledWith('Pack templates list fetched successfully', { 
      count: 2,
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_PACK_TEMPLATES_LIST',
      'packs',
      { templateCount: 2, filters: {} }
    )
  })

  it('should filter pack templates by active status true', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockTemplates: PackTemplate[] = []
    ;(adminPackService.getAllPackTemplates as jest.Mock).mockResolvedValue(mockTemplates)

    // ACT
    const response = await GET(createMockNextRequest({ url: 'http://localhost:3000/api/admin/packs/templates?active=true' }))
    await response.json()

    // ASSERT
    expect(adminPackService.getAllPackTemplates).toHaveBeenCalledWith({ active: true })
    expect(logger.debug).toHaveBeenCalledWith('Fetching pack templates with filters', { 
      filters: { active: true } 
    })
  })

  it('should filter pack templates by active status false', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockTemplates: PackTemplate[] = []
    ;(adminPackService.getAllPackTemplates as jest.Mock).mockResolvedValue(mockTemplates)

    // ACT
    const response = await GET(createMockNextRequest({ url: 'http://localhost:3000/api/admin/packs/templates?active=false' }))
    await response.json()

    // ASSERT
    expect(adminPackService.getAllPackTemplates).toHaveBeenCalledWith({ active: false })
  })

  it('should handle empty pack templates list', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const mockTemplates: PackTemplate[] = []
    ;(adminPackService.getAllPackTemplates as jest.Mock).mockResolvedValue(mockTemplates)

    // ACT
    const response = await GET(createMockNextRequest())
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
    ;(adminPackService.getAllPackTemplates as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockNextRequest())
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Failed to fetch pack templates. Please try again.")
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_pack_templates',
      service: 'admin',
      endpoint: '/api/admin/packs/templates',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack templates list', { 
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    })
  })
})

describe('POST /api/admin/packs/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await POST(createMockNextRequest({ body: {} }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to create pack template')
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'CREATE_PACK_TEMPLATE',
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
    const response = await POST(createMockNextRequest({ body: {} }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to create pack template', { 
      userId: 'user-123',
      userRole: 'user' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'CREATE_PACK_TEMPLATE',
      'packs',
      'FORBIDDEN',
      { userRole: 'user' }
    )
  })

  it('should return 400 when required fields are missing', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      name: '',
      size: 0,
      price: undefined
    }

    // ACT
    const response = await POST(createMockNextRequest({ body: requestBody }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Name, size, and price are required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Pack template creation failed - missing required fields', { 
      userId: 'admin-123',
      hasName: false,
      hasSize: false,
      hasPrice: false
    })
  })

  it('should return 400 when size is invalid', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      name: 'Weekly Pack',
      size: -5,
      price: 45.00
    }

    // ACT
    const response = await POST(createMockNextRequest({ body: requestBody }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Size must be positive and price must be non-negative" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Pack template creation failed - invalid values', { 
      userId: 'admin-123',
      size: -5,
      price: 45.00
    })
  })

  it('should return 400 when price is invalid', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      name: 'Weekly Pack',
      size: 5,
      price: -10.00
    }

    // ACT
    const response = await POST(createMockNextRequest({ body: requestBody }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Size must be positive and price must be non-negative" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Pack template creation failed - invalid values', { 
      userId: 'admin-123',
      size: 5,
      price: -10.00
    })
  })

  it('should create pack template successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      name: 'Weekly Pack',
      size: 5,
      price: 45.00,
      description: '5 meals per week',
      is_active: true
    }

    // Create created template with Date objects (as returned by database)
    const createdTemplate: PackTemplate = {
      id: 'new-template-1',
      name: 'Weekly Pack',
      size: 5,
      price: 45.00,
      description: '5 meals per week',
      is_active: true,
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-01T10:00:00Z')
    }

    ;(adminPackService.createPackTemplate as jest.Mock).mockResolvedValue(createdTemplate)

    // ACT
    const response = await POST(createMockNextRequest({ body: requestBody }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(201)
    
    // Create expected response with ISO strings (as they appear after JSON serialization)
    const expectedResponse = {
      success: true,
      data: {
        ...createdTemplate,
        created_at: createdTemplate.created_at.toISOString(),
        updated_at: createdTemplate.updated_at.toISOString()
      }
    }
    
    expect(data).toEqual(expectedResponse)
    expect(adminPackService.createPackTemplate).toHaveBeenCalledWith({
      name: 'Weekly Pack',
      size: 5,
      price: 45.00,
      description: '5 meals per week',
      is_active: true
    })
    expect(logger.info).toHaveBeenCalledWith('Admin creating new pack template', { 
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Creating pack template with data', { 
      templateData: {
        name: 'Weekly Pack',
        size: 5,
        price: 45.00,
        description: '5 meals per week',
        is_active: true
      }
    })
    expect(logger.info).toHaveBeenCalledWith('Pack template created successfully', { 
      templateId: 'new-template-1',
      userId: 'admin-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'CREATE_PACK_TEMPLATE',
      'packs',
      { templateId: 'new-template-1' }
    )
  })

  it('should create pack template with default values when optional fields are missing', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      name: 'Basic Pack',
      size: 3,
      price: 30.00
      // description and is_active are missing
    }

    // Create created template with Date objects (as returned by database)
    const createdTemplate: PackTemplate = {
      id: 'new-template-2',
      name: 'Basic Pack',
      size: 3,
      price: 30.00,
      description: '',
      is_active: true,
      created_at: new Date('2023-01-01T11:00:00Z'),
      updated_at: new Date('2023-01-01T11:00:00Z')
    }

    ;(adminPackService.createPackTemplate as jest.Mock).mockResolvedValue(createdTemplate)

    // ACT
    const response = await POST(createMockNextRequest({ body: requestBody }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(201)
    
    // Create expected response with ISO strings (as they appear after JSON serialization)
    const expectedResponse = {
      success: true,
      data: {
        ...createdTemplate,
        created_at: createdTemplate.created_at.toISOString(),
        updated_at: createdTemplate.updated_at.toISOString()
      }
    }
    
    expect(data).toEqual(expectedResponse)
    expect(adminPackService.createPackTemplate).toHaveBeenCalledWith({
      name: 'Basic Pack',
      size: 3,
      price: 30.00,
      description: '',
      is_active: true
    })
  })

  it('should handle service error during creation gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = {
      name: 'Weekly Pack',
      size: 5,
      price: 45.00
    }

    const serviceError = new Error('Creation failed')
    ;(adminPackService.createPackTemplate as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await POST(createMockNextRequest({ body: requestBody }))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to create pack template. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_create_pack_template',
      service: 'admin',
      endpoint: '/api/admin/packs/templates',
      userId: 'admin-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to create pack template', { 
      error: 'Error: Creation failed',
      stack: serviceError.stack
    })
  })
})
