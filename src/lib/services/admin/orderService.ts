// lib/services/admin/orderService.ts
import { db } from "../../database/client"
import { captureErrorSafe } from '../../utils/error-utils'
import { logger } from '../../logging/logger'
import { DatabaseError } from '../../errors/system-errors'
import { AuditLogger } from '../../logging/audit-logger'

// Define database row interfaces
interface OrderRow {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  user_name: string;
  user_email: string;
  menu_week_start: Date;
  item_count: number;
  [key: string]: unknown;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: Date;
  updated_at: Date;
  menu_item_name: string;
  [key: string]: unknown;
}

interface OrderStatsRow {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  [key: string]: unknown;
}

// Define business logic interfaces
interface OrderFilters {
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

interface Order {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  user_name: string;
  user_email: string;
  menu_week_start: Date;
  item_count: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: Date;
  updated_at: Date;
  menu_item_name: string;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

export const adminOrderService = {
  async getAllOrders(filters?: OrderFilters): Promise<Order[]> {
    try {
      logger.info('Fetching all orders for admin', { filters })
      
      let query = `
        SELECT 
          o.*,
          u.name as user_name,
          u.email as user_email,
          m.week_start_date as menu_week_start,
          COUNT(oi.id) as item_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN menus m ON o.menu_id = m.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1
      `;
      
      const params: unknown[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND o.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.userId) {
        query += ` AND o.user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND o.order_date >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND o.order_date <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` GROUP BY o.id, u.name, u.email, m.week_start_date ORDER BY o.order_date DESC`;

      const result = await db.query<OrderRow>(query, params);
      
      logger.info('Admin orders fetched successfully', { 
        count: result.rows.length,
        filters 
      })
      
      return result.rows as Order[]; // Type assertion
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_all_orders',
        filters,
        service: 'admin'
      })
      
      throw new DatabaseError('Failed to fetch orders for admin', { filters })
    }
  },

  async getOrderById(id: string): Promise<Order & { items: OrderItem[] } | null> {
    try {
      logger.info('Fetching order by ID for admin', { orderId: id })
      
      const orderResult = await db.query<OrderRow>(
        `SELECT o.*, u.name as user_name, u.email as user_email 
         FROM orders o 
         JOIN users u ON o.user_id = u.id 
         WHERE o.id = $1`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        logger.info('Order not found for admin', { orderId: id })
        return null;
      }

      const itemsResult = await db.query<OrderItemRow>(
        `SELECT oi.*, mi.name as menu_item_name 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = $1`,
        [id]
      );

      const order = {
        ...orderResult.rows[0],
        items: itemsResult.rows as OrderItem[] // Type assertion
      };
      
      logger.info('Order details fetched for admin', { orderId: id })
      
      return order as Order & { items: OrderItem[] };
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_order_by_id',
        orderId: id,
        service: 'admin'
      })
      
      throw new DatabaseError('Failed to fetch order details', { orderId: id })
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      logger.info('Updating order status', { orderId: id, newStatus: status })
      
      const result = await db.query<OrderRow>(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      
      if (result.rows.length === 0) {
        throw new DatabaseError('Order not found', { orderId: id, status })
      }
      
      const updatedOrder: Order = result.rows[0] as Order; // Type assertion
      logger.info('Order status updated successfully', { 
        orderId: id, 
        oldStatus: updatedOrder.status,
        newStatus: status 
      })
      
      AuditLogger.log({
        action: 'UPDATE_ORDER_STATUS',
        resource: 'orders',
        resourceId: id,
        details: { 
          oldStatus: updatedOrder.status, 
          newStatus: status,
          orderId: id 
        },
        success: true
      })
      
      return updatedOrder;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_order_status',
        orderId: id,
        status,
        service: 'admin'
      })
      
      if (error instanceof DatabaseError) throw error
      
      throw new DatabaseError('Failed to update order status', { orderId: id, status })
    }
  },

  async bulkUpdateOrders(orderIds: string[], status: string): Promise<Order[]> {
    try {
      if (orderIds.length === 0) {
        logger.debug('No orders to update in bulk')
        return [];
      }
      
      logger.info('Bulk updating order statuses', { 
        orderCount: orderIds.length, 
        newStatus: status 
      })
      
      const placeholders = orderIds.map((_, index) => `$${index + 2}`).join(', ');
      const result = await db.query<OrderRow>(
        `UPDATE orders SET status = $1, updated_at = NOW() 
         WHERE id IN (${placeholders}) 
         RETURNING *`,
        [status, ...orderIds]
      );
      
      logger.info('Bulk order status update completed', { 
        updatedCount: result.rows.length,
        requestedCount: orderIds.length,
        status 
      })
      
      AuditLogger.log({
        action: 'BULK_UPDATE_ORDER_STATUSES',
        resource: 'orders',
        details: { 
          updatedCount: result.rows.length,
          status,
          orderIds: orderIds.slice(0, 5) // Log first 5 for security
        },
        success: true
      })
      
      return result.rows as Order[]; // Type assertion
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_bulk_update_orders',
        orderIds: orderIds.slice(0, 5), // Log first 5 for security
        status,
        service: 'admin'
      })
      
      throw new DatabaseError('Failed to bulk update order statuses', { 
        orderCount: orderIds.length, 
        status 
      })
    }
  },

  async getOrderStats(): Promise<OrderStats> {
    try {
      logger.debug('Fetching order statistics for admin dashboard')
      
      const result = await db.query<OrderStatsRow>(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_price), 0) as total_revenue,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders
      `);
      
      const stats: OrderStats = result.rows[0] as OrderStats; // Type assertion
      logger.debug('Order statistics fetched', { stats })
      
      return stats;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_order_stats',
        service: 'admin'
      })
      
      throw new DatabaseError('Failed to fetch order statistics')
    }
  },

  async getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    try {
      logger.debug('Fetching order items for admin', { orderId })
      
      const result = await db.query<OrderItemRow>(
        `SELECT oi.*, mi.name as menu_item_name 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = $1`,
        [orderId]
      );
      
      logger.debug('Order items fetched', { orderId, count: result.rows.length })
      
      return result.rows as OrderItem[]; // Type assertion
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_order_items',
        orderId,
        service: 'admin'
      })
      
      throw new DatabaseError('Failed to fetch order items', { orderId })
    }
  }
}
