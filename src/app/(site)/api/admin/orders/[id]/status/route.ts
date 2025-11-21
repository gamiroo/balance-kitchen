// app/api/admin/orders/[id]/status/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminOrderService } from "@/shared/lib/services/admin/orderService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { NextRequest } from "next/server" // Add NextRequest import

// PUT /api/admin/orders/[id]/status - Update order status
export async function PUT(
  request: NextRequest, // Change to NextRequest
  { params }: { params: Promise<{ id: string }> } // Change to Promise<{ id: string }>
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params; // Resolve the promise
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to update order status', { orderId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'UPDATE_ORDER_STATUS',
        'orders',
        'UNAUTHORIZED',
        { orderId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to update order status', { 
        userId: session.user.id,
        userRole: session.user.role,
        orderId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_ORDER_STATUS',
        'orders',
        'FORBIDDEN',
        { userRole: session.user.role, orderId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Order status update failed - missing order ID')
      return NextResponse.json({ 
        success: false,
        error: "Order ID is required" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    logger.info('Admin updating order status', { 
      userId: session.user.id,
      orderId: resolvedParams.id,
      newStatus: status 
    })

    if (!status) {
      logger.warn('Order status update failed - no status provided', { 
        userId: session.user.id,
        orderId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Status is required" 
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      logger.warn('Order status update failed - invalid status', { 
        userId: session.user.id,
        orderId: resolvedParams.id,
        status 
      })
      return NextResponse.json({ 
        success: false,
        error: "Invalid status. Must be one of: pending, confirmed, delivered, cancelled" 
      }, { status: 400 })
    }

    logger.debug('Executing order status update', { 
      orderId: resolvedParams.id,
      status,
      userId: session.user.id 
    })

    const order = await adminOrderService.updateOrderStatus(resolvedParams.id, status)
    
    if (!order) {
      logger.info('Order status update failed - order not found', { 
        userId: session.user.id,
        orderId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }
    
    logger.info('Order status updated successfully', { 
      userId: session.user.id,
      orderId: resolvedParams.id,
      oldStatus: order.status,
      newStatus: status 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'UPDATE_ORDER_STATUS',
      'orders',
      { 
        orderId: resolvedParams.id,
        oldStatus: order.status,
        newStatus: status 
      }
    )
    
    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error: unknown) {
    const resolvedParams = await params; // Resolve params for error handling
    captureErrorSafe(error, {
      action: 'admin_update_order_status',
      service: 'admin',
      endpoint: `/api/admin/orders/${resolvedParams.id}/status`,
      userId: (await getServerSession(authOptions))?.user?.id,
      orderId: resolvedParams.id
    })
    
    logger.error('Failed to update order status', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      orderId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to update order status. Please try again." 
    }, { status: 500 })
  }
}
