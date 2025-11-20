// lib/services/database.ts
import { db } from '../database/client'
import { User, MealPack } from '../types/database'
import { captureErrorSafe } from '../utils/error-utils'
import { logger } from '../logging/logger'
import { AuditLogger } from '../logging/audit-logger'
import { DatabaseError } from '../errors/system-errors'


export const dbService = {
  // User operations
  async getUserById(userId: string): Promise<User | null> {
    try {
      logger.debug('Fetching user by ID', { userId })
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      )
      
      if (result.rows.length === 0) {
        logger.debug('User not found', { userId })
        return null
      }
      
      // Explicitly map the result to match User interface
      const row = result.rows[0]
      const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        password_hash: row.password_hash,
        created_at: new Date(row.created_at)
      } as User
      
      logger.debug('User fetch completed', { userId, found: true })
      return user
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'get_user_by_id',
        userId,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to fetch user by ID', { userId })
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      logger.debug('Fetching user by email', { email })
      
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )
      
      if (result.rows.length === 0) {
        logger.debug('User not found by email', { email })
        return null
      }
      
      // Explicitly map the result to match User interface
      const row = result.rows[0]
      const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        password_hash: row.password_hash,
        created_at: new Date(row.created_at)
      } as User
      
      logger.debug('User fetch by email completed', { email, found: true })
      return user
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'get_user_by_email',
        email,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to fetch user by email', { email })
    }
  },

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    try {
      logger.info('Creating new user', { email: userData.email })
      
      const result = await db.query(
        `INSERT INTO users (email, name, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userData.email, userData.name, userData.password_hash, 'user']
      )
      
      // Explicitly map the result to match User interface
      const row = result.rows[0]
      const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        password_hash: row.password_hash,
        created_at: new Date(row.created_at)
      } as User
      
      logger.info('User created successfully', { userId: user.id, email: user.email })
      
      AuditLogger.logUserAction(
        user.id,
        'CREATE_USER',
        'users',
        { email: user.email }
      )
      
      return user
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'create_user',
        email: userData.email,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to create user', { email: userData.email })
    }
  },

  // Meal pack operations
  async getUserMealPacks(userId: string): Promise<MealPack[]> {
    try {
      logger.debug('Fetching user meal packs', { userId })
      
      const result = await db.query(
        `SELECT * FROM meal_packs 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY purchase_date DESC`,
        [userId]
      )
      
      // Explicitly map the results to match MealPack interface
      const mealPacks: MealPack[] = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        pack_size: parseInt(row.pack_size),
        remaining_balance: parseInt(row.remaining_balance),
        purchase_date: new Date(row.purchase_date),
        expiry_date: row.expiry_date ? new Date(row.expiry_date) : undefined,
        is_active: row.is_active,
        created_at: new Date(row.created_at)
      }))
      
      logger.debug('User meal packs fetched', { userId, count: mealPacks.length })
      return mealPacks
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'get_user_meal_packs',
        userId,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to fetch user meal packs', { userId })
    }
  },

  async getActiveMealPacks(userId: string): Promise<MealPack[]> {
    try {
      logger.debug('Fetching active meal packs', { userId })
      
      const result = await db.query(
        `SELECT * FROM meal_packs 
         WHERE user_id = $1 AND is_active = true AND remaining_balance > 0
         ORDER BY purchase_date ASC`,
        [userId]
      )
      
      // Explicitly map the results to match MealPack interface
      const mealPacks: MealPack[] = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        pack_size: parseInt(row.pack_size),
        remaining_balance: parseInt(row.remaining_balance),
        purchase_date: new Date(row.purchase_date),
        expiry_date: row.expiry_date ? new Date(row.expiry_date) : undefined,
        is_active: row.is_active,
        created_at: new Date(row.created_at)
      }))
      
      logger.debug('Active meal packs fetched', { userId, count: mealPacks.length })
      return mealPacks
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'get_active_meal_packs',
        userId,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to fetch active meal packs', { userId })
    }
  },

  async createMealPack(packData: Omit<MealPack, 'id' | 'created_at'>): Promise<MealPack> {
    try {
      logger.info('Creating meal pack', { 
        userId: packData.user_id, 
        packSize: packData.pack_size 
      })
      
      const result = await db.query(
        `INSERT INTO meal_packs (user_id, pack_size, remaining_balance, purchase_date, expiry_date, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          packData.user_id,
          packData.pack_size,
          packData.remaining_balance,
          packData.purchase_date,
          packData.expiry_date,
          packData.is_active
        ]
      )
      
      // Explicitly map the result to match MealPack interface
      const row = result.rows[0]
      const mealPack: MealPack = {
        id: row.id,
        user_id: row.user_id,
        pack_size: parseInt(row.pack_size),
        remaining_balance: parseInt(row.remaining_balance),
        purchase_date: new Date(row.purchase_date),
        expiry_date: row.expiry_date ? new Date(row.expiry_date) : undefined,
        is_active: row.is_active,
        created_at: new Date(row.created_at)
      }
      
      logger.info('Meal pack created successfully', { 
        packId: mealPack.id, 
        userId: mealPack.user_id 
      })
      
      AuditLogger.logUserAction(
        packData.user_id,
        'CREATE_MEAL_PACK',
        'meal_packs',
        { packSize: packData.pack_size, packId: mealPack.id }
      )
      
      return mealPack
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'create_meal_pack',
        userId: packData.user_id,
        packSize: packData.pack_size,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to create meal pack', { 
        userId: packData.user_id, 
        packSize: packData.pack_size 
      })
    }
  },

  async updateMealPackBalance(packId: string, newBalance: number): Promise<MealPack> {
    try {
      logger.info('Updating meal pack balance', { packId, newBalance })
      
      const result = await db.query(
        `UPDATE meal_packs 
         SET remaining_balance = $1 
         WHERE id = $2 
         RETURNING *`,
        [newBalance, packId]
      )
      
      if (result.rows.length === 0) {
        throw new DatabaseError('Meal pack not found', { packId })
      }
      
      // Explicitly map the result to match MealPack interface
      const row = result.rows[0]
      const updatedPack: MealPack = {
        id: row.id,
        user_id: row.user_id,
        pack_size: parseInt(row.pack_size),
        remaining_balance: parseInt(row.remaining_balance),
        purchase_date: new Date(row.purchase_date),
        expiry_date: row.expiry_date ? new Date(row.expiry_date) : undefined,
        is_active: row.is_active,
        created_at: new Date(row.created_at)
      }
      
      logger.info('Meal pack balance updated', { 
        packId, 
        newBalance, 
        oldBalance: updatedPack.remaining_balance 
      })
      
      return updatedPack
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'update_meal_pack_balance',
        packId,
        newBalance,
        service: 'database'
      })
      
      if (error instanceof DatabaseError) throw error
      
      throw new DatabaseError('Failed to update meal pack balance', { 
        packId, 
        newBalance 
      })
    }
  },

  async deactivateExpiredPacks(): Promise<void> {
    try {
      logger.info('Deactivating expired meal packs')
      
      const result = await db.query(
        `UPDATE meal_packs 
         SET is_active = false 
         WHERE expiry_date < NOW() AND is_active = true
         RETURNING id`,
         []
      )
      
      const deactivatedCount = result.rowCount ?? 0
      
      logger.info('Expired meal packs deactivated', { 
        count: deactivatedCount 
      })
      
      // Log audit for batch operation
      if (deactivatedCount > 0) {
        AuditLogger.log({
          action: 'DEACTIVATE_EXPIRED_PACKS',
          resource: 'meal_packs',
          details: { deactivatedCount },
          success: true
        })
      }
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'deactivate_expired_packs',
        service: 'database'
      })
      
      throw new DatabaseError('Failed to deactivate expired meal packs')
    }
  },

  // Order operations
  async createOrder(orderData: {
    user_id: string;
    menu_id: string;
    order_date: Date;
    total_meals: number;
    total_price: number;
    status: string;
  }) {
    try {
      logger.info('Creating order', { 
        userId: orderData.user_id, 
        totalMeals: orderData.total_meals 
      })
      
      const result = await db.query(
        `INSERT INTO orders (user_id, menu_id, order_date, total_meals, total_price, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          orderData.user_id,
          orderData.menu_id,
          orderData.order_date,
          orderData.total_meals,
          orderData.total_price,
          orderData.status
        ]
      )
      
      // Explicitly map the result
      const row = result.rows[0]
      const order = {
        id: row.id,
        user_id: row.user_id,
        menu_id: row.menu_id,
        order_date: new Date(row.order_date),
        total_meals: parseInt(row.total_meals),
        total_price: parseFloat(row.total_price),
        status: row.status,
        created_at: new Date(row.created_at)
      }
      
      logger.info('Order created successfully', { 
        orderId: order.id, 
        userId: order.user_id 
      })
      
      AuditLogger.logUserAction(
        orderData.user_id,
        'CREATE_ORDER',
        'orders',
        { orderId: order.id, totalMeals: orderData.total_meals }
      )
      
      return order
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'create_order',
        userId: orderData.user_id,
        totalMeals: orderData.total_meals,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to create order', { 
        userId: orderData.user_id, 
        totalMeals: orderData.total_meals 
      })
    }
  },

  async getUserOrders(userId: string) {
    try {
      logger.debug('Fetching user orders', { userId })
      
      const result = await db.query(
        `SELECT o.*, 
                json_agg(oi.*) as order_items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = $1
         GROUP BY o.id
         ORDER BY o.order_date DESC`,
        [userId]
      )
      
      // Map the results (keeping the original structure for now since it's used elsewhere)
      const orders = result.rows.map(row => ({
        ...row,
        order_date: new Date(row.order_date),
        total_meals: parseInt(row.total_meals),
        total_price: parseFloat(row.total_price),
        created_at: new Date(row.created_at)
      }))
      
      logger.debug('User orders fetched', { userId, count: orders.length })
      return orders
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'get_user_orders',
        userId,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to fetch user orders', { userId })
    }
  },

  // Get user's total available meals
  async getUserAvailableMeals(userId: string): Promise<number> {
    try {
      logger.debug('Calculating user available meals', { userId })
      
      const result = await db.query(
        `SELECT COALESCE(SUM(remaining_balance), 0) as total_meals
         FROM meal_packs 
         WHERE user_id = $1 AND is_active = true AND remaining_balance > 0`,
        [userId]
      )
      
      const balance = parseInt(result.rows[0]?.total_meals || '0')
      logger.debug('User meal balance calculated', { userId, balance })
      
      return balance
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'get_user_available_meals',
        userId,
        service: 'database'
      })
      
      throw new DatabaseError('Failed to calculate user meal balance', { userId })
    }
  }
}
