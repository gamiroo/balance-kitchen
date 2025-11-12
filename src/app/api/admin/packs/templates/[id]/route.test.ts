import { GET, PUT, DELETE } from './route'
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../../lib/auth/auth"
import { adminPackService } from "../../../../../../lib/services/admin/packService"
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

jest.mock("../../../../../../lib/services/admin/packService", () => ({
  adminPackService: {
    getPackTemplateById: jest.fn(),
    updatePackTemplate: jest.fn(),
    deletePackTemplate: jest.fn()
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
  method?: string; 
  body?: any;
} = {}): NextRequest => {
  return {
    method: options.method || 'GET',
    json: options.body ? async () => options.body : undefined
  } as unknown as NextRequest
}

describe('GET /api/admin/packs/templates/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'template-123' }) }

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
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to pack template details', { templateId: 'template-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_PACK_TEMPLATE_DETAILS',
      'packs',
      'UNAUTHORIZED',
      { templateId: 'template-123' }
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
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to pack template details', { 
      userId: 'user-123',
      userRole: 'user',
      templateId: 'template-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_PACK_TEMPLATE_DETAILS',
      'packs',
      'FORBIDDEN',
      { userRole: 'user', templateId: 'template-123' }
    )
  })

  it('should return 400 when template ID is missing', async () => {
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
    const response = await GET(createMockNextRequest(), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Template ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Pack template details request failed - missing template ID')
  })

  it('should return pack template details successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // Create mock template with Date objects (as returned by database)
    const mockTemplate: PackTemplate = {
      id: 'template-123',
      name: 'Weekly Pack',
      size: 5,
      price: 45.00,
      description: '5 meals per week',
      is_active: true,
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-01T10:00:00Z')
    }

    ;(adminPackService.getPackTemplateById as jest.Mock).mockResolvedValue(mockTemplate)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    // Create expected response with ISO strings (as they appear after JSON serialization)
    const expectedResponse = {
      success: true,
      data: {
        ...mockTemplate,
        created_at: mockTemplate.created_at.toISOString(),
        updated_at: mockTemplate.updated_at.toISOString()
      }
    }
    expect(data).toEqual(expectedResponse)
    expect(logger.info).toHaveBeenCalledWith('Admin accessing pack template details', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Pack template details fetched successfully', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_PACK_TEMPLATE_DETAILS',
      'packs',
      { templateId: 'template-123' }
    )
  })

  it('should return 404 when pack template is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminPackService.getPackTemplateById as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "Pack template not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('Pack template not found', { 
      userId: 'admin-123',
      templateId: 'template-123' 
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

    const serviceError = new Error('Service unavailable')
    ;(adminPackService.getPackTemplateById as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await GET(createMockNextRequest(), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to fetch pack template details. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_pack_template_by_id',
      service: 'admin',
      endpoint: `/api/admin/packs/templates/template-123`,
      userId: 'admin-123',
      templateId: 'template-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack template details', { 
      error: 'Error: Service unavailable',
      stack: serviceError.stack,
      templateId: 'template-123'
    })
  })
})

describe('PUT /api/admin/packs/templates/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'template-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest({ body: {} }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to update pack template', { templateId: 'template-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'UPDATE_PACK_TEMPLATE',
      'packs',
      'UNAUTHORIZED',
      { templateId: 'template-123' }
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
    const response = await PUT(createMockNextRequest({ body: {} }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to update pack template', { 
      userId: 'user-123',
      userRole: 'user',
      templateId: 'template-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'UPDATE_PACK_TEMPLATE',
      'packs',
      'FORBIDDEN',
      { userRole: 'user', templateId: 'template-123' }
    )
  })

  it('should return 400 when template ID is missing', async () => {
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
    const response = await PUT(createMockNextRequest({ body: {} }), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Template ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Pack template update failed - missing template ID')
  })

  it('should update pack template successfully for admin user', async () => {
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
      name: 'Updated Weekly Pack',
      price: 50.00,
      is_active: false
    }

    // Create updated template with Date objects (as returned by database)
    const updatedTemplate: PackTemplate = {
      id: 'template-123',
      name: 'Updated Weekly Pack',
      size: 5,
      price: 50.00,
      description: '5 meals per week',
      is_active: false,
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-02T10:00:00Z')
    }

    ;(adminPackService.updatePackTemplate as jest.Mock).mockResolvedValue(updatedTemplate)

    // ACT
    const response = await PUT(createMockNextRequest({ body: requestBody }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    // Create expected response with ISO strings (as they appear after JSON serialization)
    const expectedResponse = {
      success: true,
      data: {
        ...updatedTemplate,
        created_at: updatedTemplate.created_at.toISOString(),
        updated_at: updatedTemplate.updated_at.toISOString()
      }
    }
    expect(data).toEqual(expectedResponse)
    expect(adminPackService.updatePackTemplate).toHaveBeenCalledWith('template-123', requestBody)
    expect(logger.info).toHaveBeenCalledWith('Admin updating pack template', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
    expect(logger.debug).toHaveBeenCalledWith('Updating pack template with data', { 
      templateId: 'template-123',
      updateFields: ['name', 'price', 'is_active']
    })
    expect(logger.info).toHaveBeenCalledWith('Pack template updated successfully', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'UPDATE_PACK_TEMPLATE',
      'packs',
      { templateId: 'template-123' }
    )
  })

  it('should return 404 when pack template to update is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { name: 'Updated Pack' }
    ;(adminPackService.updatePackTemplate as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await PUT(createMockNextRequest({ body: requestBody }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "Pack template not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('Pack template update failed - template not found', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
  })

  it('should handle service error during update gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const requestBody = { name: 'Updated Pack' }
    const serviceError = new Error('Update failed')
    ;(adminPackService.updatePackTemplate as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await PUT(createMockNextRequest({ body: requestBody }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to update pack template. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_update_pack_template',
      service: 'admin',
      endpoint: `/api/admin/packs/templates/template-123`,
      userId: 'admin-123',
      templateId: 'template-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to update pack template', { 
      error: 'Error: Update failed',
      stack: serviceError.stack,
      templateId: 'template-123'
    })
  })
})

describe('DELETE /api/admin/packs/templates/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'template-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(createMockNextRequest({ method: 'DELETE' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(401)
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to delete pack template', { templateId: 'template-123' })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'DELETE_PACK_TEMPLATE',
      'packs',
      'UNAUTHORIZED',
      { templateId: 'template-123' }
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
    const response = await DELETE(createMockNextRequest({ method: 'DELETE' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(403)
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to delete pack template', { 
      userId: 'user-123',
      userRole: 'user',
      templateId: 'template-123' 
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'DELETE_PACK_TEMPLATE',
      'packs',
      'FORBIDDEN',
      { userRole: 'user', templateId: 'template-123' }
    )
  })

  it('should return 400 when template ID is missing', async () => {
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
    const response = await DELETE(createMockNextRequest({ method: 'DELETE' }), mockParamsWithoutId)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data).toEqual({ 
      success: false,
      error: "Template ID is required" 
    })
    expect(logger.warn).toHaveBeenCalledWith('Pack template deletion failed - missing template ID')
  })

  it('should delete pack template successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // Create deleted template with Date objects (as returned by database)
    const deletedTemplate: PackTemplate = {
      id: 'template-123',
      name: 'Weekly Pack',
      size: 5,
      price: 45.00,
      description: '5 meals per week',
      is_active: true,
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-01T10:00:00Z')
    }

    ;(adminPackService.deletePackTemplate as jest.Mock).mockResolvedValue(deletedTemplate)

    // ACT
    const response = await DELETE(createMockNextRequest({ method: 'DELETE' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      message: "Pack template deleted successfully"
    })
    expect(adminPackService.deletePackTemplate).toHaveBeenCalledWith('template-123')
    expect(logger.info).toHaveBeenCalledWith('Admin deleting pack template', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
    expect(logger.info).toHaveBeenCalledWith('Pack template deleted successfully', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'DELETE_PACK_TEMPLATE',
      'packs',
      { templateId: 'template-123' }
    )
  })

  it('should return 404 when pack template to delete is not found', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    ;(adminPackService.deletePackTemplate as jest.Mock).mockResolvedValue(null)

    // ACT
    const response = await DELETE(createMockNextRequest({ method: 'DELETE' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(404)
    expect(data).toEqual({ 
      success: false,
      error: "Pack template not found" 
    })
    expect(logger.info).toHaveBeenCalledWith('Pack template deletion failed - template not found', { 
      userId: 'admin-123',
      templateId: 'template-123' 
    })
  })

  it('should handle service error during deletion gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const serviceError = new Error('Deletion failed')
    ;(adminPackService.deletePackTemplate as jest.Mock).mockRejectedValue(serviceError)

    // ACT
    const response = await DELETE(createMockNextRequest({ method: 'DELETE' }), mockParams)
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data).toEqual({ 
      success: false,
      error: "Failed to delete pack template. Please try again." 
    })
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_delete_pack_template',
      service: 'admin',
      endpoint: `/api/admin/packs/templates/template-123`,
      userId: 'admin-123',
      templateId: 'template-123'
    })
    expect(logger.error).toHaveBeenCalledWith('Failed to delete pack template', { 
      error: 'Error: Deletion failed',
      stack: serviceError.stack,
      templateId: 'template-123'
    })
  })
})
