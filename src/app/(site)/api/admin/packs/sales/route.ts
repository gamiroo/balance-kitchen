// app/api/admin/packs/sales/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminPackService } from "@/shared/lib/services/admin/packService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

interface PackSalesFilters {
  templateId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// GET /api/admin/packs/sales - List pack sales
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to pack sales list')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_PACK_SALES_LIST',
        'packs',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to pack sales list', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_PACK_SALES_LIST',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing pack sales list', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: PackSalesFilters = {}
    if (templateId) filters.templateId = templateId
    if (status) filters.status = status
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    logger.debug('Fetching pack sales with filters', { filters })

    const sales = await adminPackService.getAllPackSales(filters)
    
    logger.info('Pack sales list fetched successfully', { 
      count: sales.length,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_PACK_SALES_LIST',
      'packs',
      { salesCount: sales.length, filters }
    )
    
    return NextResponse.json({
      success: true,
      data: sales,
      meta: {
        count: sales.length,
        filters,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_pack_sales',
      service: 'admin',
      endpoint: '/api/admin/packs/sales',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch pack sales list', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch pack sales. Please try again." 
    }, { status: 500 })
  }
}
