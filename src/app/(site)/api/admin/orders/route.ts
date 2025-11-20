// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminOrderService } from "@/shared/lib/services/admin/orderService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { ApiResponse, PaginatedApiResponse } from '@/shared/lib/types/api'

// Define proper types
interface OrderFilters {
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// Service order interface (what comes from the service - more flexible status)
interface ServiceOrder {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string; // More flexible than the database type
  created_at: Date;
  user_name?: string;
  user_email?: string;
  [key: string]: string | number | boolean | Date | object | null | undefined;
}

// API response order interface (converts Date to string for JSON serialization)
interface ApiOrder {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: string; // ISO string
  total_meals: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string; // ISO string
  user_name?: string;
  user_email?: string;
}

// Helper function to validate status
const isValidStatus = (status: string): status is 'pending' | 'confirmed' | 'delivered' | 'cancelled' => {
  return ['pending', 'confirmed', 'delivered', 'cancelled'].includes(status);
};

// Helper functions for type conversion
const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  return new Date(); // fallback
};

const toString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0; // fallback
};

// Type guard for order objects
const isOrderLike = (obj: unknown): obj is Record<string, unknown> => {
  return obj !== null && typeof obj === 'object' && 
    'id' in obj && 'user_id' in obj && 'menu_id' in obj;
};

// GET /api/admin/orders - List orders with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to orders list')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_ORDERS_LIST',
        'orders',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to orders list', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_ORDERS_LIST',
        'orders',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing orders list', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Define proper type for filters
    const filters: OrderFilters = {}
    if (status) filters.status = status
    if (userId) filters.userId = userId
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    logger.debug('Fetching orders with filters', { filters })

    // Get orders from service (unknown type initially)
    const rawOrders: unknown = await adminOrderService.getAllOrders(filters)
    
    // Validate and transform raw orders
    let serviceOrders: ServiceOrder[] = [];
    
    if (Array.isArray(rawOrders)) {
      serviceOrders = rawOrders
        .filter(isOrderLike)
        .map(order => {
          // Safely extract and convert properties
          const orderRecord = order as Record<string, unknown>;
          
          return {
            id: toString(orderRecord.id),
            user_id: toString(orderRecord.user_id),
            menu_id: toString(orderRecord.menu_id),
            order_date: toDate(orderRecord.order_date),
            total_meals: toNumber(orderRecord.total_meals),
            total_price: toNumber(orderRecord.total_price),
            status: toString(orderRecord.status),
            created_at: toDate(orderRecord.created_at),
            user_name: typeof orderRecord.user_name === 'string' ? orderRecord.user_name : undefined,
            user_email: typeof orderRecord.user_email === 'string' ? orderRecord.user_email : undefined,
            ...orderRecord // Include any additional properties
          };
        });
    }
    
    // Transform ServiceOrder[] to ApiOrder[] (convert Date to string and validate status)
    const orders: ApiOrder[] = serviceOrders.map(order => {
      // Validate and normalize status
      const normalizedStatus: 'pending' | 'confirmed' | 'delivered' | 'cancelled' = 
        isValidStatus(order.status) ? order.status : 'pending';
      
      const apiOrder: ApiOrder = {
        id: order.id,
        user_id: order.user_id,
        menu_id: order.menu_id,
        order_date: order.order_date.toISOString(),
        total_meals: order.total_meals,
        total_price: order.total_price,
        status: normalizedStatus,
        created_at: order.created_at.toISOString(),
        user_name: order.user_name,
        user_email: order.user_email
      };
      
      return apiOrder;
    });
    
    logger.info('Orders list fetched successfully', { 
      count: orders.length,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_ORDERS_LIST',
      'orders',
      { orderCount: orders.length, filters }
    )
    
    // Use PaginatedApiResponse since we have metadata with filters
    const response: PaginatedApiResponse<ApiOrder[]> = {
      success: true,
      data: orders,
      meta: {
        count: orders.length,
        filters,
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_orders',
      service: 'admin',
      endpoint: '/api/admin/orders',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch orders list', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Use ApiResponse for error responses
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to fetch orders. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
