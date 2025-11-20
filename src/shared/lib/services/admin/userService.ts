// lib/services/admin/userService.ts
import { db } from "@/shared/lib/database/client";
import { captureErrorSafe } from '@/shared/lib/utils/error-utils';
import { logger } from '@/shared/lib/logging/logger';
import { DatabaseError } from '@/shared/lib/errors/system-errors';
import { AuditLogger } from '@/shared/lib/logging/audit-logger';

interface UserFilters {
  role?: string;
  active?: boolean;
  search?: string;
}

interface UserStatistics {
  delivered_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  meals_consumed: number;
  total_spent: number;
  total_packs_purchased: number;
  total_meals_purchased: number;
  current_meal_balance: number;
}

interface UserOrderHistory {
  id: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string;
  items_count: number;
  items: string;
}

interface BulkUserUpdateResult {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

// Add this interface for the getAllUsers return type
interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
  total_orders: number;
  total_spent: number;
  meal_balance: number;
}

// Add this interface for getUserById return type
interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
  total_orders: number;
  total_spent: number;
  meal_balance: number;
  [key: string]: string | number | boolean | Date | null | undefined; // For additional properties
}

export const adminUserService = {
  async getAllUsers(filters?: UserFilters): Promise<UserListItem[]> {
    try {
      logger.info('Fetching all users for admin', { filters });
      
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.is_active,
          u.created_at,
          u.last_login,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          COALESCE(ps.pack_size, 0) as meal_balance
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'delivered'
        LEFT JOIN (
          SELECT user_id, SUM(pack_size) as pack_size 
          FROM pack_sales 
          WHERE status = 'active' 
          GROUP BY user_id
        ) ps ON u.id = ps.user_id
        WHERE 1=1
      `;
      
      const params: unknown[] = [];
      let paramIndex = 1;

      if (filters?.role) {
        query += ` AND u.role = $${paramIndex}`;
        params.push(filters.role);
        paramIndex++;
      }

      if (filters?.active !== undefined) {
        query += ` AND u.is_active = $${paramIndex}`;
        params.push(filters.active);
        paramIndex++;
      }

      if (filters?.search) {
        query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.last_login, ps.pack_size ORDER BY u.created_at DESC`;

      const result = await db.query(query, params);
      
      // Explicitly map the result to ensure type safety
      const users: UserListItem[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        is_active: row.is_active,
        created_at: new Date(row.created_at),
        last_login: row.last_login ? new Date(row.last_login) : null,
        total_orders: parseInt(row.total_orders || '0'),
        total_spent: parseFloat(row.total_spent || '0'),
        meal_balance: parseInt(row.meal_balance || '0')
      }));
      
      logger.info('Users fetched successfully', { count: users.length, filters });
      return users;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_all_users',
        service: 'admin',
        filters
      });
      
      logger.error('Failed to fetch users', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      
      throw new DatabaseError('Failed to fetch users', { filters });
    }
  },

  async getUserById(id: string): Promise<UserDetails | null> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('User ID is required');
    }
    
    try {
      logger.info('Fetching user by ID for admin', { userId: id });
      
      const result = await db.query(
        `SELECT 
          u.*,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          COALESCE(ps.pack_size, 0) as meal_balance
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'delivered'
        LEFT JOIN (
          SELECT user_id, SUM(pack_size) as pack_size 
          FROM pack_sales 
          WHERE status = 'active' 
          GROUP BY user_id
        ) ps ON u.id = ps.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.last_login, ps.pack_size`,
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.info('User not found', { userId: id });
        return null;
      }
      
      const row = result.rows[0];
      // FIX: Remove the problematic spread operator that was overriding converted values
      const user: UserDetails = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        is_active: row.is_active,
        created_at: new Date(row.created_at),
        last_login: row.last_login ? new Date(row.last_login) : null,
        total_orders: parseInt(row.total_orders || '0'),
        total_spent: parseFloat(row.total_spent || '0'),
        meal_balance: parseInt(row.meal_balance || '0')
        // REMOVED: ...row - This was causing the bug!
      };
      
      logger.info('User details fetched successfully', { userId: id });
      return user;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_user_by_id',
        service: 'admin',
        userId: id
      });
      
      logger.error('Failed to fetch user details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message === 'User ID is required') {
        throw error;
      }
      
      throw new DatabaseError('Failed to fetch user details', { userId: id });
    }
  },


  async updateUserRole(id: string, role: string) {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('User ID is required');
    }
    
    if (!role) {
      throw new Error('Role is required');
    }
    
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    try {
      logger.info('Updating user role', { userId: id, newRole: role });
      
      const result = await db.query(
        `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [role, id]
      );
      
      if (result.rows.length === 0) {
        logger.warn('User not found for role update', { userId: id, role });
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      logger.info('User role updated successfully', { 
        userId: id, 
        oldRole: user.role,
        newRole: role 
      });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'UPDATE_USER_ROLE',
        'users',
        { userId: id, newRole: role }
      );
      
      return user;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_user_role',
        service: 'admin',
        userId: id,
        role
      });
      
      logger.error('Failed to update user role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: id,
        role
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'User ID is required' || 
           error.message === 'Role is required' ||
           error.message === 'Invalid role. Must be one of: user, admin' ||
           error.message === 'User not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update user role', { userId: id });
    }
  },

  async updateUserStatus(id: string, is_active: boolean) {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('User ID is required');
    }
    
    try {
      logger.info('Updating user status', { userId: id, newStatus: is_active });
      
      const result = await db.query(
        `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [is_active, id]
      );
      
      if (result.rows.length === 0) {
        logger.warn('User not found for status update', { userId: id, is_active });
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      logger.info('User status updated successfully', { 
        userId: id, 
        oldStatus: user.is_active,
        newStatus: is_active 
      });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'UPDATE_USER_STATUS',
        'users',
        { userId: id, newStatus: is_active }
      );
      
      return user;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_user_status',
        service: 'admin',
        userId: id,
        is_active
      });
      
      logger.error('Failed to update user status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: id,
        is_active
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'User ID is required' || 
           error.message === 'User not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update user status', { userId: id });
    }
  },

  async deleteUser(id: string) {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('User ID is required');
    }
    
    try {
      logger.info('Deleting user', { userId: id });
      
      // Check if user has active orders or packs
      const ordersResult = await db.query(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status IN ($2, $3)',
        [id, 'pending', 'confirmed']
      );
      
      if (parseInt(ordersResult.rows[0].count) > 0) {
        const error = new Error('Cannot delete user with active orders');
        logger.warn('User deletion blocked due to active orders', { userId: id });
        throw error;
      }

      // Check if user has active meal packs
      const packsResult = await db.query(
        'SELECT COUNT(*) as count FROM meal_packs WHERE user_id = $1 AND is_active = true AND remaining_balance > 0',
        [id]
      );
      
      if (parseInt(packsResult.rows[0].count) > 0) {
        const error = new Error('Cannot delete user with active meal packs');
        logger.warn('User deletion blocked due to active meal packs', { userId: id });
        throw error;
      }

      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        logger.warn('User not found for deletion', { userId: id });
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      logger.info('User deleted successfully', { userId: id });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'DELETE_USER',
        'users',
        { userId: id }
      );
      
      return user;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_delete_user',
        service: 'admin',
        userId: id
      });
      
      logger.error('Failed to delete user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'User ID is required' || 
           error.message === 'Cannot delete user with active orders' ||
           error.message === 'Cannot delete user with active meal packs' ||
           error.message === 'User not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete user', { userId: id });
    }
  },

  // Additional helper methods for admin functionality
  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    // Move validation BEFORE try/catch
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      logger.info('Fetching user statistics', { userId });

      const statsQuery = `
        SELECT 
          COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END) as confirmed_orders,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_meals ELSE 0 END), 0) as meals_consumed,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_price ELSE 0 END), 0) as total_spent,
          COUNT(ps.id) as total_packs_purchased,
          COALESCE(SUM(ps.pack_size), 0) as total_meals_purchased,
          COALESCE(SUM(ps.remaining_balance), 0) as current_meal_balance
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN meal_packs ps ON u.id = ps.user_id
        WHERE u.id = $1
      `;

      const result = await db.query(statsQuery, [userId]);
      
      if (result.rows.length === 0) {
        logger.warn('User not found for statistics', { userId });
        return null;
      }

      const row = result.rows[0];
      const stats: UserStatistics = {
        delivered_orders: parseInt(row.delivered_orders || '0'),
        pending_orders: parseInt(row.pending_orders || '0'),
        confirmed_orders: parseInt(row.confirmed_orders || '0'),
        meals_consumed: parseInt(row.meals_consumed || '0'),
        total_spent: parseFloat(row.total_spent || '0'),
        total_packs_purchased: parseInt(row.total_packs_purchased || '0'),
        total_meals_purchased: parseInt(row.total_meals_purchased || '0'),
        current_meal_balance: parseInt(row.current_meal_balance || '0')
      };

      logger.info('User statistics fetched successfully', { userId });
      return stats;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_user_statistics',
        service: 'admin',
        userId
      });
      
      logger.error('Failed to fetch user statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message === 'User ID is required') {
        throw error;
      }
      
      throw new DatabaseError('Failed to fetch user statistics', { userId });
    }
  },

  async getUserOrderHistory(userId: string, limit: number = 50): Promise<UserOrderHistory[]> {
    // Move validation BEFORE try/catch
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      logger.info('Fetching user order history', { userId, limit });

      const orderQuery = `
        SELECT 
          o.id,
          o.order_date,
          o.total_meals,
          o.total_price,
          o.status,
          COUNT(oi.id) as items_count,
          STRING_AGG(mi.name, ', ') as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.user_id = $1
        GROUP BY o.id, o.order_date, o.total_meals, o.total_price, o.status
        ORDER BY o.order_date DESC
        LIMIT $2
      `;

      const result = await db.query(orderQuery, [userId, limit]);
      
      // Explicitly map the result to ensure type safety
      const orders: UserOrderHistory[] = result.rows.map(row => ({
        id: row.id,
        order_date: new Date(row.order_date),
        total_meals: parseInt(row.total_meals),
        total_price: parseFloat(row.total_price),
        status: row.status,
        items_count: parseInt(row.items_count || '0'),
        items: row.items || ''
      }));
      
      logger.info('User order history fetched successfully', { userId, count: orders.length });
      return orders;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_user_order_history',
        service: 'admin',
        userId
      });
      
      logger.error('Failed to fetch user order history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message === 'User ID is required') {
        throw error;
      }
      
      throw new DatabaseError('Failed to fetch user order history', { userId });
    }
  },

  async bulkUpdateUserStatus(userIds: string[], is_active: boolean): Promise<BulkUserUpdateResult[]> {
    // Move validation BEFORE try/catch
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required and cannot be empty');
    }

    try {
      logger.info('Bulk updating user status', { userIds, newStatus: is_active });

      const placeholders = userIds.map((_, index) => `$${index + 2}`).join(',');
      const query = `
        UPDATE users 
        SET is_active = $1, updated_at = NOW() 
        WHERE id IN (${placeholders})
        RETURNING id, name, email, is_active
      `;

      const result = await db.query(query, [is_active, ...userIds]);
      
      // Explicitly map the result to ensure type safety
      const updatedUsers: BulkUserUpdateResult[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        is_active: row.is_active
      }));
      
      logger.info('Bulk user status update completed', { 
        count: updatedUsers.length, 
        userIds,
        newStatus: is_active 
      });

      AuditLogger.logUserAction(
        'unknown',
        'BULK_UPDATE_USER_STATUS',
        'users',
        { userIds, newStatus: is_active, updatedCount: updatedUsers.length }
      );

      return updatedUsers;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_bulk_update_user_status',
        service: 'admin',
        userIds,
        is_active
      });
      
      logger.error('Failed to bulk update user status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userIds,
        is_active
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message === 'User IDs array is required and cannot be empty') {
        throw error;
      }
      
      throw new DatabaseError('Failed to bulk update user status', { userIds });
    }
  }
};
