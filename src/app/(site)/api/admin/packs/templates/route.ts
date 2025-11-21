// app/api/admin/packs/templates/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminPackService } from "@/shared/lib/services/admin/packService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { ApiResponse } from "lib/types/api"
import { NextRequest } from "next/server" // Add NextRequest import

// Define API response types (these match what the database returns)
interface PackTemplate {
  id: string;
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
  created_at: Date; // Database returns Date objects
  updated_at: Date; // Database returns Date objects
  // Removed index signature to match service return types
}

interface PackTemplateFilters {
  active?: boolean;
}

// GET /api/admin/packs/templates - List pack templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to pack templates list')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_PACK_TEMPLATES_LIST',
        'packs',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to pack templates list', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_PACK_TEMPLATES_LIST',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing pack templates list', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const filters: PackTemplateFilters = {}
    if (active !== null) {
      filters.active = active === 'true'
    }

    logger.debug('Fetching pack templates with filters', { filters })

    const templates = await adminPackService.getAllPackTemplates(filters)
    
    logger.info('Pack templates list fetched successfully', { 
      count: templates.length,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_PACK_TEMPLATES_LIST',
      'packs',
      { templateCount: templates.length, filters }
    )
    
    const response: ApiResponse<PackTemplate[]> = {
      success: true,
      data: templates,
      meta: {
        count: templates.length,
        filters,
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_pack_templates',
      service: 'admin',
      endpoint: '/api/admin/packs/templates',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch pack templates list', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to fetch pack templates. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

interface CreatePackTemplateBody {
  name: string;
  size: number;
  price: number;
  description?: string;
  is_active?: boolean;
}

// POST /api/admin/packs/templates - Create pack template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to create pack template')
      AuditLogger.logFailedAction(
        undefined,
        'CREATE_PACK_TEMPLATE',
        'packs',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to create pack template', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'CREATE_PACK_TEMPLATE',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    const body: CreatePackTemplateBody = await request.json()
    logger.info('Admin creating new pack template', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    // Validate required fields
    if (!body.name || !body.size || body.price === undefined) {
      logger.warn('Pack template creation failed - missing required fields', { 
        userId: session.user.id,
        hasName: !!body.name,
        hasSize: !!body.size,
        hasPrice: body.price !== undefined
      })
      return NextResponse.json({ 
        success: false,
        error: "Name, size, and price are required" 
      }, { status: 400 })
    }

    if (body.size <= 0 || body.price < 0) {
      logger.warn('Pack template creation failed - invalid values', { 
        userId: session.user.id,
        size: body.size,
        price: body.price
      })
      return NextResponse.json({ 
        success: false,
        error: "Size must be positive and price must be non-negative" 
      }, { status: 400 })
    }

    // Prepare data for service call with default values
    const templateData = {
      name: body.name,
      size: body.size,
      price: body.price,
      description: body.description || '',
      is_active: body.is_active !== undefined ? body.is_active : true
    };

    logger.debug('Creating pack template with data', { 
      templateData 
    })

    const template = await adminPackService.createPackTemplate(templateData)
    
    logger.info('Pack template created successfully', { 
      templateId: template.id,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'CREATE_PACK_TEMPLATE',
      'packs',
      { templateId: template.id }
    )
    
    const response: ApiResponse<typeof template> = {
      success: true,
      data: template
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_create_pack_template',
      service: 'admin',
      endpoint: '/api/admin/packs/templates',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to create pack template', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to create pack template. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
