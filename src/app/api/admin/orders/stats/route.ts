// app/api/admin/orders/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { adminOrderService } from "../../../../../lib/services/admin/orderService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'
import { ApiResponse } from "lib/types/api"

// Define types in camelCase for the API response
interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Define the interface for what the service actually returns
interface ServiceOrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value?: number; // Make this optional since it might be missing
}

// GET /api/admin/orders/stats - Order statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to order stats')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_ORDER_STATS',
        'orders',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to order stats', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_ORDER_STATS',
        'orders',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing order statistics', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const serviceStats: ServiceOrderStats = await adminOrderService.getOrderStats()
    
    // Transform snake_case to camelCase and handle missing values
    const stats: OrderStats = {
      totalOrders: serviceStats.total_orders || 0,
      pendingOrders: serviceStats.pending_orders || 0,
      confirmedOrders: serviceStats.confirmed_orders || 0,
      deliveredOrders: serviceStats.delivered_orders || 0,
      cancelledOrders: serviceStats.cancelled_orders || 0,
      totalRevenue: serviceStats.total_revenue || 0,
      averageOrderValue: serviceStats.average_order_value !== undefined 
        ? serviceStats.average_order_value 
        : 0 // Provide default value if missing
    }
    
    logger.debug('Order statistics fetched successfully', { 
      userId: session.user.id,
      stats 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_ORDER_STATS',
      'orders',
      { stats }
    )
    
    const response: ApiResponse<OrderStats> = {
      success: true,
      data: stats
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_order_stats',
      service: 'admin',
      endpoint: '/api/admin/orders/stats',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch order statistics', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to fetch order statistics. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
