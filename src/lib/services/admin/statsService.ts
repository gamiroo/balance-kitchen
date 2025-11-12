// lib/services/admin/statsService.ts
import { db } from "../../database/client";
import { captureErrorSafe } from '../../../lib/utils/error-utils';
import { logger } from '../../../lib/logging/logger';
import { DatabaseError } from '../../../lib/errors/system-errors';

// Define interfaces for data structures
interface UserStats {
  total_users: number;
  admin_count: number;
  active_users: number;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
}

interface MenuStats {
  total_menus: number;
  published_menus: number;
  active_menus: number;
}

interface PackStats {
  total_pack_sales: number;
  pack_revenue: number;
}

interface DashboardStats {
  users: UserStats;
  orders: OrderStats;
  menus: MenuStats;
  packs: PackStats;
}

interface RecentOrder {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string;
}

interface MenuStatus {
  id: string;
  week_start_date: Date;
  week_end_date: Date;
  is_published: boolean;
  status: string;
}

// Simple in-memory cache (use Redis in production)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const adminCache = {
  get<T>(key: string): T | null {
    const item = cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    
    return item.data as T;
  },
  
  set<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  },
  
  clear(): void {
    cache.clear();
  },
  
  delete(key: string): boolean {
    return cache.delete(key);
  }
};

export const adminStatsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = "dashboard_stats";
    const cached = adminCache.get<DashboardStats>(cacheKey);
    if (cached) {
      logger.debug('Returning cached dashboard stats');
      return cached;
    }

    try {
      logger.info('Fetching dashboard statistics');
      
      // Get user statistics
      const usersResult = await db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
        FROM users
      `);

      // Get order statistics
      const ordersResult = await db.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_price), 0) as total_revenue,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
        FROM orders
      `);

      // Get menu statistics
      const menusResult = await db.query(`
        SELECT 
          COUNT(*) as total_menus,
          COUNT(CASE WHEN is_published = true THEN 1 END) as published_menus,
          COUNT(CASE WHEN is_published = true AND week_end_date >= NOW() THEN 1 END) as active_menus
        FROM menus
      `);

      // Get pack sales statistics
      const packsResult = await db.query(`
        SELECT 
          COUNT(*) as total_pack_sales,
          COALESCE(SUM(price_paid), 0) as pack_revenue
        FROM pack_sales
        WHERE status IN ('active', 'used')
      `);

      // Explicitly map the result rows to ensure type safety
      const stats: DashboardStats = {
        users: {
          total_users: parseInt(usersResult.rows[0]?.total_users || '0'),
          admin_count: parseInt(usersResult.rows[0]?.admin_count || '0'),
          active_users: parseInt(usersResult.rows[0]?.active_users || '0')
        },
        orders: {
          total_orders: parseInt(ordersResult.rows[0]?.total_orders || '0'),
          total_revenue: parseFloat(ordersResult.rows[0]?.total_revenue || '0'),
          pending_orders: parseInt(ordersResult.rows[0]?.pending_orders || '0'),
          confirmed_orders: parseInt(ordersResult.rows[0]?.confirmed_orders || '0'),
          delivered_orders: parseInt(ordersResult.rows[0]?.delivered_orders || '0')
        },
        menus: {
          total_menus: parseInt(menusResult.rows[0]?.total_menus || '0'),
          published_menus: parseInt(menusResult.rows[0]?.published_menus || '0'),
          active_menus: parseInt(menusResult.rows[0]?.active_menus || '0')
        },
        packs: {
          total_pack_sales: parseInt(packsResult.rows[0]?.total_pack_sales || '0'),
          pack_revenue: parseFloat(packsResult.rows[0]?.pack_revenue || '0')
        }
      };

      adminCache.set<DashboardStats>(cacheKey, stats);
      logger.info('Dashboard statistics fetched and cached');
      return stats;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_dashboard_stats',
        service: 'admin'
      });
      
      logger.error('Failed to fetch dashboard statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new DatabaseError('Failed to fetch dashboard statistics');
    }
  },

  async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    const cacheKey = `recent_orders_${limit}`;
    const cached = adminCache.get<RecentOrder[]>(cacheKey);
    if (cached) {
      logger.debug('Returning cached recent orders');
      return cached;
    }

    try {
      logger.info('Fetching recent orders', { limit });
      
      const result = await db.query(`
        SELECT 
          o.id,
          o.user_id,
          u.name as user_name,
          u.email as user_email,
          o.order_date,
          o.total_meals,
          o.total_price,
          o.status
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.order_date DESC
        LIMIT $1
      `, [limit]);

      const orders: RecentOrder[] = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        user_name: row.user_name,
        user_email: row.user_email,
        order_date: new Date(row.order_date),
        total_meals: parseInt(row.total_meals),
        total_price: parseFloat(row.total_price),
        status: row.status
      }));
      
      adminCache.set<RecentOrder[]>(cacheKey, orders);
      logger.info('Recent orders fetched and cached', { count: orders.length });
      return orders;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_recent_orders',
        service: 'admin',
        limit
      });
      
      logger.error('Failed to fetch recent orders', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        limit
      });
      
      throw new DatabaseError('Failed to fetch recent orders', { limit });
    }
  },

  async getMenuStatus(): Promise<MenuStatus[]> {
    const cacheKey = "menu_status";
    const cached = adminCache.get<MenuStatus[]>(cacheKey);
    if (cached) {
      logger.debug('Returning cached menu status');
      return cached;
    }

    try {
      logger.info('Fetching menu status');
      
      const result = await db.query(`
        SELECT 
          id,
          week_start_date,
          week_end_date,
          is_published,
          CASE 
            WHEN is_published = false THEN 'Draft'
            WHEN week_end_date < NOW() THEN 'Expired'
            WHEN week_start_date <= NOW() AND week_end_date >= NOW() THEN 'Active'
            WHEN week_start_date > NOW() THEN 'Scheduled'
          END as status
        FROM menus
        ORDER BY week_start_date DESC
        LIMIT 10
      `);

      // Explicitly map the result rows to MenuStatus interface
      const menuStatus: MenuStatus[] = result.rows.map(row => ({
        id: row.id,
        week_start_date: new Date(row.week_start_date),
        week_end_date: new Date(row.week_end_date),
        is_published: row.is_published,
        status: row.status
      }));
      
      adminCache.set<MenuStatus[]>(cacheKey, menuStatus);
      logger.info('Menu status fetched and cached', { count: menuStatus.length });
      return menuStatus;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_menu_status',
        service: 'admin'
      });
      
      logger.error('Failed to fetch menu status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new DatabaseError('Failed to fetch menu status');
    }
  },

  // Clear cache when data is updated
  clearCache(): void {
    const cacheKeys = ['dashboard_stats', 'recent_orders_10', 'menu_status'];
    cacheKeys.forEach(key => adminCache.delete(key));
    logger.info('Admin cache cleared');
  }
};
