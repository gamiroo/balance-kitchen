// app/api/admin/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminStatsService } from "@/shared/lib/services/admin/statsService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// GET /api/admin/stats - Dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to dashboard stats')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_DASHBOARD_STATS',
        'admin',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to dashboard stats', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_DASHBOARD_STATS',
        'admin',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing dashboard statistics', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const stats = await adminStatsService.getDashboardStats()
    
    logger.debug('Dashboard statistics fetched successfully', { 
      userId: session.user.id,
      statsKeys: Object.keys(stats)
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_DASHBOARD_STATS',
      'admin',
      { statsKeys: Object.keys(stats) }
    )
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_dashboard_stats',
      service: 'admin',
      endpoint: '/api/admin/stats',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch dashboard statistics', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch dashboard statistics. Please try again." 
    }, { status: 500 })
  }
}
