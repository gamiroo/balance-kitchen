// app/api/admin/orders/bulk-update/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { adminOrderService } from "../../../../../lib/services/admin/orderService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'
import { ApiResponse } from "lib/types/api"

// Define types
interface BulkUpdateBody {
  orderIds: string[];
  status: string;
}

interface UpdatedOrder {
  id: string;
  status: string;
  updated_at: string;
}

// POST /api/admin/orders/bulk-update - Bulk update orders
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to bulk update orders')
      AuditLogger.logFailedAction(
        undefined,
        'BULK_UPDATE_ORDERS',
        'orders',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to bulk update orders', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'BULK_UPDATE_ORDERS',
        'orders',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    const body: BulkUpdateBody = await request.json()
    const { orderIds, status } = body

    logger.info('Admin initiating bulk order update', { 
      userId: session.user.id,
      userEmail: session.user.email,
      orderCount: Array.isArray(orderIds) ? orderIds.length : 0
    })

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      logger.warn('Bulk update failed - no order IDs provided', { 
        userId: session.user.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Order IDs are required" 
      }, { status: 400 })
    }

    if (!status) {
      logger.warn('Bulk update failed - no status provided', { 
        userId: session.user.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Status is required" 
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      logger.warn('Bulk update failed - invalid status', { 
        userId: session.user.id,
        status 
      })
      return NextResponse.json({ 
        success: false,
        error: "Invalid status. Must be one of: pending, confirmed, delivered, cancelled" 
      }, { status: 400 })
    }

    logger.debug('Executing bulk order update', { 
      orderCount: orderIds.length,
      status,
      userId: session.user.id 
    })

    const orders = await adminOrderService.bulkUpdateOrders(orderIds, status)
    
    // Transform orders to match UpdatedOrder interface
    const updatedOrders: UpdatedOrder[] = orders.map(order => ({
      id: order.id,
      status: order.status,
      updated_at: order.updated_at.toISOString() // Convert Date to string
    }))
    
    logger.info('Bulk order update completed successfully', { 
      updatedCount: updatedOrders.length,
      requestedCount: orderIds.length,
      status,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'BULK_UPDATE_ORDERS',
      'orders',
      { 
        updatedCount: updatedOrders.length,
        status,
        orderIds: orderIds.slice(0, 5) // Log first 5 for security
      }
    )
    
    const response: ApiResponse<{ updatedOrders: UpdatedOrder[]; updatedCount: number }> = {
      success: true,
      message: `${updatedOrders.length} orders updated successfully`,
      data: {
        updatedOrders: updatedOrders,
        updatedCount: updatedOrders.length
      }
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_bulk_update_orders',
      service: 'admin',
      endpoint: '/api/admin/orders/bulk-update',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to bulk update orders', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to bulk update orders. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
