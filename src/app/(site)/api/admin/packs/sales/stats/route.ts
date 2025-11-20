// app/api/admin/packs/sales/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminPackService } from "@/shared/lib/services/admin/packService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// GET /api/admin/packs/sales/stats - Pack sales statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to pack sales stats')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_PACK_SALES_STATS',
        'packs',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to pack sales stats', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_PACK_SALES_STATS',
        'packs',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing pack sales statistics', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const stats = await adminPackService.getPackSalesStats()
    
    logger.debug('Pack sales statistics fetched successfully', { 
      userId: session.user.id,
      stats 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_PACK_SALES_STATS',
      'packs',
      { stats }
    )
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_pack_sales_stats',
      service: 'admin',
      endpoint: '/api/admin/packs/sales/stats',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch pack sales statistics', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch pack sales statistics. Please try again." 
    }, { status: 500 })
  }
}
