// src/lib/services/admin/statsService.test.ts
import { adminStatsService, adminCache } from './statsService'
import { db } from "../../database/client"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { DatabaseError } from '@/shared/lib/errors/system-errors'

// Mock external dependencies
jest.mock("../../database/client", () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('@/shared/lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('@/shared/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

// Define test data interfaces
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

describe('adminStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    adminCache.clear()
  })

  describe('getDashboardStats', () => {
    it('should return cached dashboard stats when available', async () => {
      // ARRANGE
      const cachedStats: DashboardStats = {
        users: {
          total_users: 100,
          admin_count: 5,
          active_users: 90
        },
        orders: {
          total_orders: 50,
          total_revenue: 2500,
          pending_orders: 5,
          confirmed_orders: 30,
          delivered_orders: 15
        },
        menus: {
          total_menus: 20,
          published_menus: 15,
          active_menus: 10
        },
        packs: {
          total_pack_sales: 25,
          pack_revenue: 1250
        }
      }
      
      adminCache.set<DashboardStats>('dashboard_stats', cachedStats)

      // ACT
      const result = await adminStatsService.getDashboardStats()

      // ASSERT
      expect(result).toEqual(cachedStats)
      expect(logger.debug).toHaveBeenCalledWith('Returning cached dashboard stats')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should fetch and return dashboard stats successfully', async () => {
      // ARRANGE
      const mockUsersResult = {
        rows: [{
          total_users: '100',
          admin_count: '5',
          active_users: '90'
        }]
      }
      
      const mockOrdersResult = {
        rows: [{
          total_orders: '50',
          total_revenue: '2500.00',
          pending_orders: '5',
          confirmed_orders: '30',
          delivered_orders: '15'
        }]
      }
      
      const mockMenusResult = {
        rows: [{
          total_menus: '20',
          published_menus: '15',
          active_menus: '10'
        }]
      }
      
      const mockPacksResult = {
        rows: [{
          total_pack_sales: '25',
          pack_revenue: '1250.00'
        }]
      }

      ;(db.query as jest.Mock)
        .mockResolvedValueOnce(mockUsersResult)
        .mockResolvedValueOnce(mockOrdersResult)
        .mockResolvedValueOnce(mockMenusResult)
        .mockResolvedValueOnce(mockPacksResult)

      const expectedStats: DashboardStats = {
        users: {
          total_users: 100,
          admin_count: 5,
          active_users: 90
        },
        orders: {
          total_orders: 50,
          total_revenue: 2500,
          pending_orders: 5,
          confirmed_orders: 30,
          delivered_orders: 15
        },
        menus: {
          total_menus: 20,
          published_menus: 15,
          active_menus: 10
        },
        packs: {
          total_pack_sales: 25,
          pack_revenue: 1250
        }
      }

      // ACT
      const result = await adminStatsService.getDashboardStats()

      // ASSERT
      expect(result).toEqual(expectedStats)
      expect(logger.info).toHaveBeenCalledWith('Fetching dashboard statistics')
      expect(logger.info).toHaveBeenCalledWith('Dashboard statistics fetched and cached')
      expect(db.query).toHaveBeenCalledTimes(4)
    })

    it('should handle empty database results gracefully', async () => {
      // ARRANGE
      const mockEmptyResult = { rows: [{}] }
      
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult)

      const expectedStats: DashboardStats = {
        users: {
          total_users: 0,
          admin_count: 0,
          active_users: 0
        },
        orders: {
          total_orders: 0,
          total_revenue: 0,
          pending_orders: 0,
          confirmed_orders: 0,
          delivered_orders: 0
        },
        menus: {
          total_menus: 0,
          published_menus: 0,
          active_menus: 0
        },
        packs: {
          total_pack_sales: 0,
          pack_revenue: 0
        }
      }

      // ACT
      const result = await adminStatsService.getDashboardStats()

      // ASSERT
      expect(result).toEqual(expectedStats)
    })

    it('should throw DatabaseError and log error when database query fails', async () => {
      // ARRANGE
      const dbError = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(dbError)

      // ACT & ASSERT
      await expect(adminStatsService.getDashboardStats()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
        action: 'admin_get_dashboard_stats',
        service: 'admin'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch dashboard statistics', {
        error: 'Database connection failed',
        stack: dbError.stack
      })
    })
  })

  describe('getRecentOrders', () => {
    it('should return cached recent orders when available', async () => {
      // ARRANGE
      const cachedOrders: RecentOrder[] = [{
        id: 'order-1',
        user_id: 'user-123',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        order_date: new Date('2023-01-01'),
        total_meals: 5,
        total_price: 25.00,
        status: 'confirmed'
      }]
      
      adminCache.set<RecentOrder[]>('recent_orders_10', cachedOrders)

      // ACT
      const result = await adminStatsService.getRecentOrders()

      // ASSERT
      expect(result).toEqual(cachedOrders)
      expect(logger.debug).toHaveBeenCalledWith('Returning cached recent orders')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should fetch and return recent orders successfully', async () => {
      // ARRANGE
      const mockResult = {
        rows: [{
          id: 'order-1',
          user_id: 'user-123',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          order_date: '2023-01-01T10:00:00Z',
          total_meals: '5',
          total_price: '25.00',
          status: 'confirmed'
        }]
      }
      
      ;(db.query as jest.Mock).mockResolvedValue(mockResult)

      const expectedOrders: RecentOrder[] = [{
        id: 'order-1',
        user_id: 'user-123',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        order_date: new Date('2023-01-01T10:00:00Z'),
        total_meals: 5,
        total_price: 25.00,
        status: 'confirmed'
      }]

      // ACT
      const result = await adminStatsService.getRecentOrders()

      // ASSERT
      expect(result).toEqual(expectedOrders)
      expect(logger.info).toHaveBeenCalledWith('Fetching recent orders', { limit: 10 })
      expect(logger.info).toHaveBeenCalledWith('Recent orders fetched and cached', { count: 1 })
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [10]
      )
    })

    it('should use custom limit parameter', async () => {
      // ARRANGE
      const mockResult = { rows: [] }
      ;(db.query as jest.Mock).mockResolvedValue(mockResult)

      // ACT
      await adminStatsService.getRecentOrders(5)

      // ASSERT
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [5]
      )
    })

    it('should throw DatabaseError and log error when database query fails', async () => {
      // ARRANGE
      const dbError = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValue(dbError)

      // ACT & ASSERT
      await expect(adminStatsService.getRecentOrders()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
        action: 'admin_get_recent_orders',
        service: 'admin',
        limit: 10
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch recent orders', {
        error: 'Database connection failed',
        stack: dbError.stack,
        limit: 10
      })
    })
  })

  describe('getMenuStatus', () => {
    it('should return cached menu status when available', async () => {
      // ARRANGE
      const cachedMenuStatus: MenuStatus[] = [{
        id: 'menu-1',
        week_start_date: new Date('2023-01-01'),
        week_end_date: new Date('2023-01-07'),
        is_published: true,
        status: 'Active'
      }]
      
      adminCache.set<MenuStatus[]>('menu_status', cachedMenuStatus)

      // ACT
      const result = await adminStatsService.getMenuStatus()

      // ASSERT
      expect(result).toEqual(cachedMenuStatus)
      expect(logger.debug).toHaveBeenCalledWith('Returning cached menu status')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should fetch and return menu status successfully', async () => {
      // ARRANGE
      const mockResult = {
        rows: [{
          id: 'menu-1',
          week_start_date: '2023-01-01T00:00:00Z',
          week_end_date: '2023-01-07T00:00:00Z',
          is_published: true,
          status: 'Active'
        }]
      }
      
      ;(db.query as jest.Mock).mockResolvedValue(mockResult)

      const expectedMenuStatus: MenuStatus[] = [{
        id: 'menu-1',
        week_start_date: new Date('2023-01-01T00:00:00Z'),
        week_end_date: new Date('2023-01-07T00:00:00Z'),
        is_published: true,
        status: 'Active'
      }]

      // ACT
      const result = await adminStatsService.getMenuStatus()

      // ASSERT
      expect(result).toEqual(expectedMenuStatus)
      expect(logger.info).toHaveBeenCalledWith('Fetching menu status')
      expect(logger.info).toHaveBeenCalledWith('Menu status fetched and cached', { count: 1 })
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })

    it('should throw DatabaseError and log error when database query fails', async () => {
      // ARRANGE
      const dbError = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValue(dbError)

      // ACT & ASSERT
      await expect(adminStatsService.getMenuStatus()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, {
        action: 'admin_get_menu_status',
        service: 'admin'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch menu status', {
        error: 'Database connection failed',
        stack: dbError.stack
      })
    })
  })

  describe('clearCache', () => {
    it('should clear all admin cache entries', () => {
      // ARRANGE
      adminCache.set<DashboardStats>('dashboard_stats', { 
        users: { total_users: 0, admin_count: 0, active_users: 0 },
        orders: { total_orders: 0, total_revenue: 0, pending_orders: 0, confirmed_orders: 0, delivered_orders: 0 },
        menus: { total_menus: 0, published_menus: 0, active_menus: 0 },
        packs: { total_pack_sales: 0, pack_revenue: 0 }
      })
      adminCache.set<RecentOrder[]>('recent_orders_10', [])
      adminCache.set<MenuStatus[]>('menu_status', [])

      // ACT
      adminStatsService.clearCache()

      // ASSERT
      expect(adminCache.get<DashboardStats>('dashboard_stats')).toBeNull()
      expect(adminCache.get<RecentOrder[]>('recent_orders_10')).toBeNull()
      expect(adminCache.get<MenuStatus[]>('menu_status')).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('Admin cache cleared')
    })

    it('should handle clearing cache when some keys dont exist', () => {
      // ARRANGE
      adminCache.set<DashboardStats>('dashboard_stats', { 
        users: { total_users: 0, admin_count: 0, active_users: 0 },
        orders: { total_orders: 0, total_revenue: 0, pending_orders: 0, confirmed_orders: 0, delivered_orders: 0 },
        menus: { total_menus: 0, published_menus: 0, active_menus: 0 },
        packs: { total_pack_sales: 0, pack_revenue: 0 }
      })
      // recent_orders_10 and menu_status are not set

      // ACT
      adminStatsService.clearCache()

      // ASSERT
      expect(adminCache.get<DashboardStats>('dashboard_stats')).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('Admin cache cleared')
    })
  })

  describe('adminCache', () => {
    it('should set and get cache items', () => {
      // ARRANGE
      const testData = { test: 'data' }
      const key = 'test-key'

      // ACT
      adminCache.set(key, testData)
      const result = adminCache.get(key)

      // ASSERT
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent cache items', () => {
      // ACT
      const result = adminCache.get('non-existent-key')

      // ASSERT
      expect(result).toBeNull()
    })

    it('should return null for expired cache items', () => {
      // ARRANGE
      const testData = { test: 'data' }
      const key = 'expired-key'
      adminCache.set(key, testData)
      
      // Instead of accessing private cache directly, test expiration behavior
      // by manipulating the system time or using a more reliable approach
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + (6 * 60 * 1000)); // Move time forward 6 minutes
      
      // ACT
      const result = adminCache.get(key)
      
      // Restore original Date.now
      Date.now = originalDateNow;

      // ASSERT
      expect(result).toBeNull()
    })

    it('should delete specific cache items', () => {
      // ARRANGE
      const testData = { test: 'data' }
      const key = 'delete-key'
      adminCache.set(key, testData)

      // ACT
      const result = adminCache.delete(key)

      // ASSERT
      expect(result).toBe(true)
      expect(adminCache.get(key)).toBeNull()
    })

    it('should return false when deleting non-existent cache items', () => {
      // ACT
      const result = adminCache.delete('non-existent-key')

      // ASSERT
      expect(result).toBe(false)
    })

    it('should clear all cache items', () => {
      // ARRANGE
      adminCache.set('key1', { data: 'test1' })
      adminCache.set('key2', { data: 'test2' })
      adminCache.set('key3', { data: 'test3' })

      // ACT
      adminCache.clear()

      // ASSERT
      expect(adminCache.get('key1')).toBeNull()
      expect(adminCache.get('key2')).toBeNull()
      expect(adminCache.get('key3')).toBeNull()
    })
  })
})
