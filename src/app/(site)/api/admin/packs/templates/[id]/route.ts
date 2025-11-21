// app/api/admin/packs/templates/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminPackService } from "@/shared/lib/services/admin/packService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { ApiResponse } from "lib/types/api"
import { NextRequest } from "next/server"

// Define types to match what the database actually returns
interface PackTemplate {
  id: string;
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
  created_at: Date; // Database returns Date objects, not strings
  updated_at: Date; // Database returns Date objects
}

// GET /api/admin/packs/templates/[id] - Get specific pack template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to pack template details', { templateId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_PACK_TEMPLATE_DETAILS',
        'packs',
        'UNAUTHORIZED',
        { templateId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to pack template details', { 
        userId: session.user.id,
        userRole: session.user.role,
        templateId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_PACK_TEMPLATE_DETAILS',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role, templateId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Pack template details request failed - missing template ID')
      return NextResponse.json({ 
        success: false,
        error: "Template ID is required" 
      }, { status: 400 })
    }

    logger.info('Admin accessing pack template details', { 
      userId: session.user.id,
      templateId: resolvedParams.id 
    })

    const template = await adminPackService.getPackTemplateById(resolvedParams.id)
    
    if (!template) {
      logger.info('Pack template not found', { 
        userId: session.user.id,
        templateId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Pack template not found" 
      }, { status: 404 })
    }
    
    logger.debug('Pack template details fetched successfully', { 
      userId: session.user.id,
      templateId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_PACK_TEMPLATE_DETAILS',
      'packs',
      { templateId: resolvedParams.id }
    )
    
    const response: ApiResponse<PackTemplate> = {
      success: true,
      data: template
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_get_pack_template_by_id',
      service: 'admin',
      endpoint: `/api/admin/packs/templates/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      templateId: resolvedParams.id
    })
    
    logger.error('Failed to fetch pack template details', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      templateId: resolvedParams.id
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to fetch pack template details. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

interface UpdatePackTemplateBody {
  name?: string;
  size?: number;
  price?: number;
  description?: string;
  is_active?: boolean;
}

// PUT /api/admin/packs/templates/[id] - Update pack template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to update pack template', { templateId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'UPDATE_PACK_TEMPLATE',
        'packs',
        'UNAUTHORIZED',
        { templateId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to update pack template', { 
        userId: session.user.id,
        userRole: session.user.role,
        templateId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_PACK_TEMPLATE',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role, templateId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Pack template update failed - missing template ID')
      return NextResponse.json({ 
        success: false,
        error: "Template ID is required" 
      }, { status: 400 })
    }

    const body: UpdatePackTemplateBody = await request.json()
    logger.info('Admin updating pack template', { 
      userId: session.user.id,
      templateId: resolvedParams.id 
    })

    logger.debug('Updating pack template with data', { 
      templateId: resolvedParams.id,
      updateFields: Object.keys(body)
    })

    const template = await adminPackService.updatePackTemplate(resolvedParams.id, body)
    
    if (!template) {
      logger.info('Pack template update failed - template not found', { 
        userId: session.user.id,
        templateId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Pack template not found" 
      }, { status: 404 })
    }
    
    logger.info('Pack template updated successfully', { 
      userId: session.user.id,
      templateId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'UPDATE_PACK_TEMPLATE',
      'packs',
      { templateId: resolvedParams.id }
    )
    
    const response: ApiResponse<PackTemplate> = {
      success: true,
      data: template
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_update_pack_template',
      service: 'admin',
      endpoint: `/api/admin/packs/templates/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      templateId: resolvedParams.id
    })
    
    logger.error('Failed to update pack template', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      templateId: resolvedParams.id
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to update pack template. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/admin/packs/templates/[id] - Delete pack template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to delete pack template', { templateId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'DELETE_PACK_TEMPLATE',
        'packs',
        'UNAUTHORIZED',
        { templateId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to delete pack template', { 
        userId: session.user.id,
        userRole: session.user.role,
        templateId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'DELETE_PACK_TEMPLATE',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role, templateId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Pack template deletion failed - missing template ID')
      return NextResponse.json({ 
        success: false,
        error: "Template ID is required" 
      }, { status: 400 })
    }

    logger.info('Admin deleting pack template', { 
      userId: session.user.id,
      templateId: resolvedParams.id 
    })

    const template = await adminPackService.deletePackTemplate(resolvedParams.id)
    
    if (!template) {
      logger.info('Pack template deletion failed - template not found', { 
        userId: session.user.id,
        templateId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Pack template not found" 
      }, { status: 404 })
    }
    
    logger.info('Pack template deleted successfully', { 
      userId: session.user.id,
      templateId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'DELETE_PACK_TEMPLATE',
      'packs',
      { templateId: resolvedParams.id }
    )
    
    const response: ApiResponse<never> = {
      success: true,
      message: "Pack template deleted successfully"
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_delete_pack_template',
      service: 'admin',
      endpoint: `/api/admin/packs/templates/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      templateId: resolvedParams.id
    })
    
    logger.error('Failed to delete pack template', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      templateId: resolvedParams.id
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to delete pack template. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
