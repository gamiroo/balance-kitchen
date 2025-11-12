// src/lib/services/admin/orderService.test.ts
import { adminOrderService } from './orderService'
import { db } from '../../database/client'
import { captureErrorSafe } from '../../utils/error-utils'
import { logger } from '../../logging/logger'
import { DatabaseError } from '../../errors/system-errors'
import { AuditLogger } from '../../logging/audit-logger'

// Mock dependencies
jest.mock('../../database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('../../utils/error-utils')
jest.mock('../../logging/logger')
jest.mock('../../logging/audit-logger')

describe('adminOrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllOrders', () => {
    const mockOrderRows = [
      {
        id: 'order-1',
        user_id: 'user-123',
        menu_id: 'menu-1',
        order_date: new Date('2023-01-01'),
        total_meals: 5,
        total_price: 0,
        status: 'confirmed',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        user_name: 'Test User',
        user_email: 'test@example.com',
        menu_week_start: new Date('2023-01-01'),
        item_count: 3
      }
    ]

    it('should return all orders without filters', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.getAllOrders()

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        []
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all orders for admin', { filters: undefined })
      expect(logger.info).toHaveBeenCalledWith('Admin orders fetched successfully', { count: 1, filters: undefined })
    })

    it('should return filtered orders by status', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.getAllOrders({ status: 'confirmed' })

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND o.status = $1'),
        ['confirmed']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all orders for admin', { filters: { status: 'confirmed' } })
    })

    it('should return filtered orders by userId', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.getAllOrders({ userId: 'user-123' })

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND o.user_id = $1'),
        ['user-123']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all orders for admin', { filters: { userId: 'user-123' } })
    })

    it('should return filtered orders by startDate', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.getAllOrders({ startDate: '2023-01-01' })

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND o.order_date >= $1'),
        ['2023-01-01']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all orders for admin', { filters: { startDate: '2023-01-01' } })
    })

    it('should return filtered orders by endDate', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.getAllOrders({ endDate: '2023-01-31' })

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND o.order_date <= $1'),
        ['2023-01-31']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all orders for admin', { filters: { endDate: '2023-01-31' } })
    })

    it('should return filtered orders by multiple criteria', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.getAllOrders({
        status: 'confirmed',
        userId: 'user-123',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      })

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND o.status = $1 AND o.user_id = $2 AND o.order_date >= $3 AND o.order_date <= $4'),
        ['confirmed', 'user-123', '2023-01-01', '2023-01-31']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all orders for admin', {
        filters: {
          status: 'confirmed',
          userId: 'user-123',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      })
    })

    it('should handle empty results', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminOrderService.getAllOrders()

      // ASSERT
      expect(result).toEqual([])
      expect(logger.info).toHaveBeenCalledWith('Admin orders fetched successfully', { count: 0, filters: undefined })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.getAllOrders()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_all_orders',
        filters: undefined,
        service: 'admin'
      })
    })
  })

  describe('getOrderById', () => {
    const mockOrderRow = {
      id: 'order-1',
      user_id: 'user-123',
      menu_id: 'menu-1',
      order_date: new Date('2023-01-01'),
      total_meals: 5,
      total_price: 0,
      status: 'confirmed',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      user_name: 'Test User',
      user_email: 'test@example.com'
    }

    const mockItemRows = [
      {
        id: 'item-1',
        order_id: 'order-1',
        menu_item_id: 'dish-1',
        quantity: 2,
        price: 0,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        menu_item_name: 'Test Dish'
      }
    ]

    it('should return order with items when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderRow] })
        .mockResolvedValueOnce({ rows: mockItemRows })

      // ACT
      const result = await adminOrderService.getOrderById('order-1')

      // ASSERT
      expect(result).toEqual({
        ...mockOrderRow,
        items: mockItemRows
      })
      expect(db.query).toHaveBeenCalledTimes(2)
      expect(db.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT o.*, u.name as user_name, u.email as user_email'),
        ['order-1']
      )
      expect(db.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('SELECT oi.*, mi.name as menu_item_name'),
        ['order-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching order by ID for admin', { orderId: 'order-1' })
      expect(logger.info).toHaveBeenCalledWith('Order details fetched for admin', { orderId: 'order-1' })
    })

    it('should return null when order not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminOrderService.getOrderById('order-999')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('Order not found for admin', { orderId: 'order-999' })
    })

    it('should handle order with no items', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderRow] })
        .mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminOrderService.getOrderById('order-1')

      // ASSERT
      expect(result).toEqual({
        ...mockOrderRow,
        items: []
      })
      expect(db.query).toHaveBeenCalledTimes(2)
      expect(logger.info).toHaveBeenCalledWith('Order details fetched for admin', { orderId: 'order-1' })
    })

    it('should throw DatabaseError when database query fails on order fetch', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.getOrderById('order-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_order_by_id',
        orderId: 'order-1',
        service: 'admin'
      })
    })

    it('should throw DatabaseError when database query fails on items fetch', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderRow] })
        .mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.getOrderById('order-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_order_by_id',
        orderId: 'order-1',
        service: 'admin'
      })
    })
  })

  describe('updateOrderStatus', () => {
    const mockOrderRow = {
      id: 'order-1',
      user_id: 'user-123',
      menu_id: 'menu-1',
      order_date: new Date('2023-01-01'),
      total_meals: 5,
      total_price: 0,
      status: 'pending',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    }

    it('should update and return order with new status', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockOrderRow] })

      // ACT
      const result = await adminOrderService.updateOrderStatus('order-1', 'confirmed')

      // ASSERT
      expect(result).toEqual(mockOrderRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status = $1'),
        ['confirmed', 'order-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Updating order status', { orderId: 'order-1', newStatus: 'confirmed' })
      expect(logger.info).toHaveBeenCalledWith('Order status updated successfully', {
        orderId: 'order-1',
        oldStatus: 'pending',
        newStatus: 'confirmed'
      })
      expect(AuditLogger.log).toHaveBeenCalledWith({
        action: 'UPDATE_ORDER_STATUS',
        resource: 'orders',
        resourceId: 'order-1',
        details: {
          oldStatus: 'pending',
          newStatus: 'confirmed',
          orderId: 'order-1'
        },
        success: true
      })
    })

    it('should throw DatabaseError when order not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminOrderService.updateOrderStatus('order-999', 'confirmed')).rejects.toThrow(DatabaseError)
      expect(logger.info).toHaveBeenCalledWith('Updating order status', { orderId: 'order-999', newStatus: 'confirmed' })
      expect(captureErrorSafe).toHaveBeenCalledWith(
        expect.any(DatabaseError),
        {
          action: 'admin_update_order_status',
          orderId: 'order-999',
          status: 'confirmed',
          service: 'admin'
        }
      )
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.updateOrderStatus('order-1', 'confirmed')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_order_status',
        orderId: 'order-1',
        status: 'confirmed',
        service: 'admin'
      })
    })

    it('should re-throw DatabaseError as-is', async () => {
      // ARRANGE
      const dbError = new DatabaseError('Custom database error')
      ;(db.query as jest.Mock).mockRejectedValueOnce(dbError)

      // ACT & ASSERT
      await expect(adminOrderService.updateOrderStatus('order-1', 'confirmed')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, expect.any(Object))
    })
  })

  describe('bulkUpdateOrders', () => {
    const mockOrderRows = [
      {
        id: 'order-1',
        user_id: 'user-123',
        menu_id: 'menu-1',
        order_date: new Date('2023-01-01'),
        total_meals: 5,
        total_price: 0,
        status: 'confirmed',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01')
      },
      {
        id: 'order-2',
        user_id: 'user-456',
        menu_id: 'menu-2',
        order_date: new Date('2023-01-02'),
        total_meals: 3,
        total_price: 0,
        status: 'confirmed',
        created_at: new Date('2023-01-02'),
        updated_at: new Date('2023-01-02')
      }
    ]

    it('should update multiple orders successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminOrderService.bulkUpdateOrders(['order-1', 'order-2'], 'delivered')

      // ASSERT
      expect(result).toEqual(mockOrderRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status = $1'),
        ['delivered', 'order-1', 'order-2']
      )
      expect(logger.info).toHaveBeenCalledWith('Bulk updating order statuses', { 
        orderCount: 2, 
        newStatus: 'delivered' 
      })
      expect(logger.info).toHaveBeenCalledWith('Bulk order status update completed', { 
        updatedCount: 2,
        requestedCount: 2,
        status: 'delivered' 
      })
      expect(AuditLogger.log).toHaveBeenCalledWith({
        action: 'BULK_UPDATE_ORDER_STATUSES',
        resource: 'orders',
        details: { 
          updatedCount: 2,
          status: 'delivered',
          orderIds: ['order-1', 'order-2']
        },
        success: true
      })
    })

    it('should handle empty orderIds array', async () => {
      // ACT
      const result = await adminOrderService.bulkUpdateOrders([], 'delivered')

      // ASSERT
      expect(result).toEqual([])
      expect(db.query).not.toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('No orders to update in bulk')
    })

    it('should handle partial updates when some orders are not found', async () => {
      // ARRANGE
      const partialResults = [mockOrderRows[0]] // Only one order found
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: partialResults })

      // ACT
      const result = await adminOrderService.bulkUpdateOrders(['order-1', 'order-999'], 'delivered')

      // ASSERT
      expect(result).toEqual(partialResults)
      expect(logger.info).toHaveBeenCalledWith('Bulk order status update completed', { 
        updatedCount: 1,
        requestedCount: 2,
        status: 'delivered' 
      })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.bulkUpdateOrders(['order-1'], 'delivered')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_bulk_update_orders',
        orderIds: ['order-1'],
        status: 'delivered',
        service: 'admin'
      })
    })
  })

  describe('getOrderStats', () => {
    const mockStatsRow = {
      total_orders: 100,
      total_revenue: 0,
      pending_orders: 10,
      confirmed_orders: 70,
      delivered_orders: 15,
      cancelled_orders: 5
    }

    it('should return order statistics', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockStatsRow] })

      // ACT
      const result = await adminOrderService.getOrderStats()

      // ASSERT
      expect(result).toEqual(mockStatsRow)
      expect(db.query).toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('Fetching order statistics for admin dashboard')
      expect(logger.debug).toHaveBeenCalledWith('Order statistics fetched', { stats: mockStatsRow })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.getOrderStats()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_order_stats',
        service: 'admin'
      })
    })
  })

  describe('getOrderItemsByOrderId', () => {
    const mockItemRows = [
      {
        id: 'item-1',
        order_id: 'order-1',
        menu_item_id: 'dish-1',
        quantity: 2,
        price: 0,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        menu_item_name: 'Test Dish'
      }
    ]

    it('should return order items when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockItemRows })

      // ACT
      const result = await adminOrderService.getOrderItemsByOrderId('order-1')

      // ASSERT
      expect(result).toEqual(mockItemRows)
      expect(db.query).toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('Fetching order items for admin', { orderId: 'order-1' })
      expect(logger.debug).toHaveBeenCalledWith('Order items fetched', { orderId: 'order-1', count: 1 })
    })

    it('should return empty array when no items found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminOrderService.getOrderItemsByOrderId('order-999')

      // ASSERT
      expect(result).toEqual([])
      expect(logger.debug).toHaveBeenCalledWith('Order items fetched', { orderId: 'order-999', count: 0 })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminOrderService.getOrderItemsByOrderId('order-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_order_items',
        orderId: 'order-1',
        service: 'admin'
      })
    })
  })
})
