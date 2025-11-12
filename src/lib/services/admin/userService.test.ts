// lib/services/admin/userService.test.ts
import { adminUserService } from './userService'
import { db } from '../../../lib/database/client'
import { captureErrorSafe } from '../../../lib/utils/error-utils'
import { logger } from '../../../lib/logging/logger'
import { DatabaseError } from '../../../lib/errors/system-errors'
import { AuditLogger } from '../../../lib/logging/audit-logger'

// Mock dependencies
jest.mock('../../../lib/database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('../../../lib/utils/error-utils')
jest.mock('../../../lib/logging/logger')
jest.mock('../../../lib/logging/audit-logger')

describe('adminUserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllUsers', () => {
    const mockUserRows = [
      {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_active: true,
        created_at: new Date('2023-01-01'),
        last_login: new Date('2023-01-02'),
        total_orders: '5',
        total_spent: '0',
        meal_balance: '20'
      }
    ]

    const expectedUsers = [
      {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_active: true,
        created_at: new Date('2023-01-01'),
        last_login: new Date('2023-01-02'),
        total_orders: 5,
        total_spent: 0,
        meal_balance: 20
      }
    ]

    it('should return all users without filters', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockUserRows })

      // ACT
      const result = await adminUserService.getAllUsers()

      // ASSERT
      expect(result).toEqual(expectedUsers)
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('SELECT')
      expect(callArgs[0]).toContain('u.id')
      expect(callArgs[0]).toContain('u.name')
      expect(callArgs[0]).toContain('u.email')
      expect(Array.isArray(callArgs[1])).toBe(true)
      expect(logger.info).toHaveBeenCalledWith('Fetching all users for admin', { filters: undefined })
      expect(logger.info).toHaveBeenCalledWith('Users fetched successfully', { count: 1, filters: undefined })
    })

    it('should return filtered users by role', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockUserRows })

      // ACT
      const result = await adminUserService.getAllUsers({ role: 'admin' })

      // ASSERT
      expect(result).toEqual(expectedUsers)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND u.role = $1'),
        ['admin']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all users for admin', { filters: { role: 'admin' } })
    })

    it('should return filtered users by active status', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockUserRows })

      // ACT
      const result = await adminUserService.getAllUsers({ active: true })

      // ASSERT
      expect(result).toEqual(expectedUsers)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND u.is_active = $1'),
        [true]
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all users for admin', { filters: { active: true } })
    })

    it('should return filtered users by search term', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockUserRows })

      // ACT
      const result = await adminUserService.getAllUsers({ search: 'test' })

      // ASSERT
      expect(result).toEqual(expectedUsers)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND (u.name ILIKE $1 OR u.email ILIKE $1)'),
        ['%test%']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all users for admin', { filters: { search: 'test' } })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.getAllUsers()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_all_users',
        service: 'admin',
        filters: undefined
      })
    })
  })

  describe('getUserById', () => {
    const mockUserRow = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      is_active: true,
      created_at: new Date('2023-01-01'),
      last_login: new Date('2023-01-02'),
      total_orders: '5',
      total_spent: '0',
      meal_balance: '20'
    }

    const expectedUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      is_active: true,
      created_at: new Date('2023-01-01'),
      last_login: new Date('2023-01-02'),
      total_orders: 5,
      total_spent: 0,
      meal_balance: 20
    }

    it('should return user details when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUserRow] })

      // ACT
      const result = await adminUserService.getUserById('user-123')

      // ASSERT
      expect(result).toEqual(expectedUser)
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('SELECT')
      expect(callArgs[1]).toEqual(['user-123'])
      expect(logger.info).toHaveBeenCalledWith('Fetching user by ID for admin', { userId: 'user-123' })
      expect(logger.info).toHaveBeenCalledWith('User details fetched successfully', { userId: 'user-123' })
    })

    it('should return null when user not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminUserService.getUserById('user-999')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('User not found', { userId: 'user-999' })
    })

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.getUserById('')).rejects.toThrow('User ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.getUserById('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_user_by_id',
        service: 'admin',
        userId: 'user-123'
      })
    })
  })

  describe('updateUserRole', () => {
    const mockUserRow = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should update user role successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUserRow] })

      // ACT
      const result = await adminUserService.updateUserRole('user-123', 'admin')

      // ASSERT
      expect(result).toEqual(mockUserRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET role = $1'),
        ['admin', 'user-123']
      )
      expect(logger.info).toHaveBeenCalledWith('Updating user role', { userId: 'user-123', newRole: 'admin' })
      expect(logger.info).toHaveBeenCalledWith('User role updated successfully', {
        userId: 'user-123',
        oldRole: 'admin',
        newRole: 'admin'
      })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'UPDATE_USER_ROLE',
        'users',
        { userId: 'user-123', newRole: 'admin' }
      )
    })

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.updateUserRole('', 'admin')).rejects.toThrow('User ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when role is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.updateUserRole('user-123', '')).rejects.toThrow('Role is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when role is invalid', async () => {
      // ACT & ASSERT
      await expect(adminUserService.updateUserRole('user-123', 'invalid-role')).rejects.toThrow(
        'Invalid role. Must be one of: user, admin'
      )
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminUserService.updateUserRole('user-999', 'admin')).rejects.toThrow('User not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.updateUserRole('user-123', 'admin')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_user_role',
        service: 'admin',
        userId: 'user-123',
        role: 'admin'
      })
    })
  })

  describe('updateUserStatus', () => {
    const mockUserRow = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      is_active: false,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should update user status successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUserRow] })

      // ACT
      const result = await adminUserService.updateUserStatus('user-123', false)

      // ASSERT
      expect(result).toEqual(mockUserRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_active = $1'),
        [false, 'user-123']
      )
      expect(logger.info).toHaveBeenCalledWith('Updating user status', { userId: 'user-123', newStatus: false })
      expect(logger.info).toHaveBeenCalledWith('User status updated successfully', {
        userId: 'user-123',
        oldStatus: false,
        newStatus: false
      })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'UPDATE_USER_STATUS',
        'users',
        { userId: 'user-123', newStatus: false }
      )
    })

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.updateUserStatus('', true)).rejects.toThrow('User ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminUserService.updateUserStatus('user-999', true)).rejects.toThrow('User not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.updateUserStatus('user-123', true)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_user_status',
        service: 'admin',
        userId: 'user-123',
        is_active: true
      })
    })
  })

  describe('deleteUser', () => {
    const mockUserRow = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      is_active: true,
      created_at: new Date('2023-01-01')
    }

    it('should delete user successfully when no active orders or packs', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check orders
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check packs
        .mockResolvedValueOnce({ rows: [mockUserRow] }) // Delete user

      // ACT
      const result = await adminUserService.deleteUser('user-123')

      // ASSERT
      expect(result).toEqual(mockUserRow)
      expect(db.query).toHaveBeenCalledTimes(3)
      expect(logger.info).toHaveBeenCalledWith('Deleting user', { userId: 'user-123' })
      expect(logger.info).toHaveBeenCalledWith('User deleted successfully', { userId: 'user-123' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'DELETE_USER',
        'users',
        { userId: 'user-123' }
      )
    })

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.deleteUser('')).rejects.toThrow('User ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when user has active orders', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Check orders

      // ACT & ASSERT
      await expect(adminUserService.deleteUser('user-123')).rejects.toThrow('Cannot delete user with active orders')
      expect(logger.warn).toHaveBeenCalledWith('User deletion blocked due to active orders', { userId: 'user-123' })
    })

    it('should throw error when user has active meal packs', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check orders
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Check packs

      // ACT & ASSERT
      await expect(adminUserService.deleteUser('user-123')).rejects.toThrow('Cannot delete user with active meal packs')
      expect(logger.warn).toHaveBeenCalledWith('User deletion blocked due to active meal packs', { userId: 'user-123' })
    })

    it('should throw error when user not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check orders
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check packs
        .mockResolvedValueOnce({ rows: [] }) // Delete user

      // ACT & ASSERT
      await expect(adminUserService.deleteUser('user-999')).rejects.toThrow('User not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.deleteUser('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_delete_user',
        service: 'admin',
        userId: 'user-123'
      })
    })
  })

  describe('getUserStatistics', () => {
    const mockStatsRow = {
      delivered_orders: '5',
      pending_orders: '2',
      confirmed_orders: '3',
      meals_consumed: '25',
      total_spent: '0',
      total_packs_purchased: '3',
      total_meals_purchased: '60',
      current_meal_balance: '15'
    }

    const expectedStats = {
      delivered_orders: 5,
      pending_orders: 2,
      confirmed_orders: 3,
      meals_consumed: 25,
      total_spent: 0,
      total_packs_purchased: 3,
      total_meals_purchased: 60,
      current_meal_balance: 15
    }

    it('should return user statistics when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockStatsRow] })

      // ACT
      const result = await adminUserService.getUserStatistics('user-123')

      // ASSERT
      expect(result).toEqual(expectedStats)
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('SELECT')
      expect(callArgs[1]).toEqual(['user-123'])
      expect(logger.info).toHaveBeenCalledWith('Fetching user statistics', { userId: 'user-123' })
      expect(logger.info).toHaveBeenCalledWith('User statistics fetched successfully', { userId: 'user-123' })
    })

    it('should return null when user not found for statistics', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminUserService.getUserStatistics('user-999')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith('User not found for statistics', { userId: 'user-999' })
    })

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.getUserStatistics('')).rejects.toThrow('User ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.getUserStatistics('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_user_statistics',
        service: 'admin',
        userId: 'user-123'
      })
    })
  })

  describe('getUserOrderHistory', () => {
    const mockOrderRows = [
      {
        id: 'order-1',
        order_date: new Date('2023-01-01'),
        total_meals: '5',
        total_price: '0',
        status: 'delivered',
        items_count: '3',
        items: 'Dish 1, Dish 2, Dish 3'
      }
    ]

    const expectedOrders = [
      {
        id: 'order-1',
        order_date: new Date('2023-01-01'),
        total_meals: 5,
        total_price: 0,
        status: 'delivered',
        items_count: 3,
        items: 'Dish 1, Dish 2, Dish 3'
      }
    ]

    it('should return user order history with default limit', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminUserService.getUserOrderHistory('user-123')

      // ASSERT
      expect(result).toEqual(expectedOrders)
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('SELECT')
      expect(callArgs[1]).toEqual(['user-123', 50])
      expect(logger.info).toHaveBeenCalledWith('Fetching user order history', { userId: 'user-123', limit: 50 })
      expect(logger.info).toHaveBeenCalledWith('User order history fetched successfully', { userId: 'user-123', count: 1 })
    })

    it('should return user order history with custom limit', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockOrderRows })

      // ACT
      const result = await adminUserService.getUserOrderHistory('user-123', 10)

      // ASSERT
      expect(result).toEqual(expectedOrders)
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('SELECT')
      expect(callArgs[1]).toEqual(['user-123', 10])
      expect(logger.info).toHaveBeenCalledWith('Fetching user order history', { userId: 'user-123', limit: 10 })
    })

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminUserService.getUserOrderHistory('')).rejects.toThrow('User ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.getUserOrderHistory('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_user_order_history',
        service: 'admin',
        userId: 'user-123'
      })
    })
  })

  describe('bulkUpdateUserStatus', () => {
    const mockUpdatedRows = [
      {
        id: 'user-123',
        name: 'Test User 1',
        email: 'test1@example.com',
        is_active: false
      },
      {
        id: 'user-456',
        name: 'Test User 2',
        email: 'test2@example.com',
        is_active: false
      }
    ]

    const expectedUsers = [
      {
        id: 'user-123',
        name: 'Test User 1',
        email: 'test1@example.com',
        is_active: false
      },
      {
        id: 'user-456',
        name: 'Test User 2',
        email: 'test2@example.com',
        is_active: false
      }
    ]

    it('should bulk update user status successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockUpdatedRows })

      // ACT
      const result = await adminUserService.bulkUpdateUserStatus(['user-123', 'user-456'], false)

      // ASSERT
      expect(result).toEqual(expectedUsers)
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('UPDATE users')
      expect(callArgs[1]).toEqual([false, 'user-123', 'user-456'])
      expect(logger.info).toHaveBeenCalledWith('Bulk updating user status', {
        userIds: ['user-123', 'user-456'],
        newStatus: false
      })
      expect(logger.info).toHaveBeenCalledWith('Bulk user status update completed', {
        count: 2,
        userIds: ['user-123', 'user-456'],
        newStatus: false
      })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'BULK_UPDATE_USER_STATUS',
        'users',
        { userIds: ['user-123', 'user-456'], newStatus: false, updatedCount: 2 }
      )
    })

    it('should throw error when user IDs array is empty', async () => {
      // ACT & ASSERT
      await expect(adminUserService.bulkUpdateUserStatus([], true)).rejects.toThrow(
        'User IDs array is required and cannot be empty'
      )
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when user IDs array is not provided', async () => {
      // ACT & ASSERT
      await expect(adminUserService.bulkUpdateUserStatus(null as any, true)).rejects.toThrow(
        'User IDs array is required and cannot be empty'
      )
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminUserService.bulkUpdateUserStatus(['user-123'], true)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_bulk_update_user_status',
        service: 'admin',
        userIds: ['user-123'],
        is_active: true
      })
    })
  })
})
