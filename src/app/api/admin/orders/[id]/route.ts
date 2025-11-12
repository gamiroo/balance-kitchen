// app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { adminOrderService } from "../../../../../lib/services/admin/orderService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'
// Removed unused ValidationError import
import { NextRequest } from "next/server"

// GET /api/admin/orders/[id] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to order details', { orderId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_ORDER_DETAILS',
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
      logger.warn('Forbidden access attempt to order details', { 
        userId: session.user.id,
        userRole: session.user.role,
        orderId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_ORDER_DETAILS',
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
      logger.warn('Order details request failed - missing order ID')
      return NextResponse.json({ 
        success: false,
        error: "Order ID is required" 
      }, { status: 400 })
    }

    logger.info('Admin accessing order details', { 
      userId: session.user.id,
      orderId: resolvedParams.id 
    })

    const order = await adminOrderService.getOrderById(resolvedParams.id)
    
    if (!order) {
      logger.info('Order details not found', { 
        userId: session.user.id,
        orderId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }
    
    logger.debug('Order details fetched successfully', { 
      userId: session.user.id,
      orderId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_ORDER_DETAILS',
      'orders',
      { orderId: resolvedParams.id }
    )
    
    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_get_order_by_id',
      service: 'admin',
      endpoint: `/api/admin/orders/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      orderId: resolvedParams.id
    })
    
    logger.error('Failed to fetch order details', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      orderId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch order details. Please try again." 
    }, { status: 500 })
  }
}
