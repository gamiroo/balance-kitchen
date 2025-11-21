// app/api/admin/recent-orders/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminStatsService } from "@/shared/lib/services/admin/statsService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// GET /api/admin/recent-orders - Recent orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to recent orders')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_RECENT_ORDERS',
        'orders',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to recent orders', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_RECENT_ORDERS',
        'orders',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing recent orders', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 10

    // Validate limit
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      logger.warn('Invalid limit parameter for recent orders', { 
        userId: session.user.id,
        limitParam,
        parsedLimit: limit
      })
      return NextResponse.json({ 
        success: false,
        error: "Limit must be between 1 and 100" 
      }, { status: 400 })
    }

    logger.debug('Fetching recent orders', { limit, userId: session.user.id })

    const orders = await adminStatsService.getRecentOrders(limit)
    
    logger.info('Recent orders fetched successfully', { 
      count: orders.length,
      limit,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_RECENT_ORDERS',
      'orders',
      { orderCount: orders.length, limit }
    )
    
    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        count: orders.length,
        limit,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_recent_orders',
      service: 'admin',
      endpoint: '/api/admin/recent-orders',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch recent orders', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch recent orders. Please try again." 
    }, { status: 500 })
  }
}
