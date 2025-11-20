// lib/services/database.test.ts
import { dbService } from './database'
import { db } from '../database/client'
import { User, MealPack } from '../types/database'
import { captureErrorSafe } from '../utils/error-utils'
import { logger } from '../logging/logger'
import { AuditLogger } from '../logging/audit-logger'
import { DatabaseError } from '../errors/system-errors'

// Mock dependencies
jest.mock('../database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('../utils/error-utils')
jest.mock('../logging/logger')
jest.mock('../logging/audit-logger', () => ({
  AuditLogger: {
    logUserAction: jest.fn(),
    logFailedAction: jest.fn(),
    log: jest.fn() // Add this missing method
  }
}))

describe('dbService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserById', () => {
    const mockUserRow: object = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed-password',
      created_at: new Date('2023-01-01')
    }

    const expectedUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed-password',
      created_at: new Date('2023-01-01')
    }

    it('should return user when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUserRow] })

      // ACT
      const result = await dbService.getUserById('user-123')

      // ASSERT
      expect(result).toEqual(expectedUser)
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-123']
      )
      expect(logger.debug).toHaveBeenCalledWith('Fetching user by ID', { userId: 'user-123' })
      expect(logger.debug).toHaveBeenCalledWith('User fetch completed', { userId: 'user-123', found: true })
    })

    it('should return null when user not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await dbService.getUserById('user-456')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.debug).toHaveBeenCalledWith('User not found', { userId: 'user-456' })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.getUserById('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'get_user_by_id',
        userId: 'user-123',
        service: 'database'
      })
    })
  })

  describe('getUserByEmail', () => {
    const mockUserRow = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed-password',
      created_at: new Date('2023-01-01')
    }

    const expectedUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed-password',
      created_at: new Date('2023-01-01')
    }

    it('should return user when found by email', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUserRow] })

      // ACT
      const result = await dbService.getUserByEmail('test@example.com')

      // ASSERT
      expect(result).toEqual(expectedUser)
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      )
      expect(logger.debug).toHaveBeenCalledWith('Fetching user by email', { email: 'test@example.com' })
      expect(logger.debug).toHaveBeenCalledWith('User fetch by email completed', { email: 'test@example.com', found: true })
    })

    it('should return null when user not found by email', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await dbService.getUserByEmail('nonexistent@example.com')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.debug).toHaveBeenCalledWith('User not found by email', { email: 'nonexistent@example.com' })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.getUserByEmail('test@example.com')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'get_user_by_email',
        email: 'test@example.com',
        service: 'database'
      })
    })
  })

  describe('createUser', () => {
    const userData = {
      email: 'newuser@example.com',
      name: 'New User',
      password_hash: 'hashed-password'
    }

    const mockUserRow = {
      id: 'user-456',
      email: 'newuser@example.com',
      name: 'New User',
      password_hash: 'hashed-password',
      created_at: new Date('2023-01-02')
    }

    const expectedUser: User = {
      id: 'user-456',
      email: 'newuser@example.com',
      name: 'New User',
      password_hash: 'hashed-password',
      created_at: new Date('2023-01-02')
    }

    it('should create and return new user', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUserRow] })

      // ACT
      const result = await dbService.createUser(userData)

      // ASSERT
      expect(result).toEqual(expectedUser)
      expect(db.query).toHaveBeenCalledWith(
        `INSERT INTO users (email, name, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        ['newuser@example.com', 'New User', 'hashed-password', 'user']
      )
      expect(logger.info).toHaveBeenCalledWith('User created successfully', {
        userId: 'user-456',
        email: 'newuser@example.com'
      })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'user-456',
        'CREATE_USER',
        'users',
        { email: 'newuser@example.com' }
      )
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.createUser(userData)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'create_user',
        email: 'newuser@example.com',
        service: 'database'
      })
    })
  })

  describe('getUserMealPacks', () => {
    const mockPackRows = [
      {
        id: 'pack-1',
        user_id: 'user-123',
        pack_size: '20',
        remaining_balance: '15',
        purchase_date: new Date('2023-01-01'),
        expiry_date: new Date('2023-12-31'),
        is_active: true,
        created_at: new Date('2023-01-01')
      },
      {
        id: 'pack-2',
        user_id: 'user-123',
        pack_size: '10',
        remaining_balance: '3',
        purchase_date: new Date('2023-01-15'),
        expiry_date: null,
        is_active: true,
        created_at: new Date('2023-01-15')
      }
    ]

    const expectedPacks: MealPack[] = [
      {
        id: 'pack-1',
        user_id: 'user-123',
        pack_size: 20,
        remaining_balance: 15,
        purchase_date: new Date('2023-01-01'),
        expiry_date: new Date('2023-12-31'),
        is_active: true,
        created_at: new Date('2023-01-01')
      },
      {
        id: 'pack-2',
        user_id: 'user-123',
        pack_size: 10,
        remaining_balance: 3,
        purchase_date: new Date('2023-01-15'),
        expiry_date: undefined,
        is_active: true,
        created_at: new Date('2023-01-15')
      }
    ]

    it('should return user meal packs ordered by purchase date descending', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackRows })

      // ACT
      const result = await dbService.getUserMealPacks('user-123')

      // ASSERT
      expect(result).toEqual(expectedPacks)
      expect(db.query).toHaveBeenCalledWith(
        `SELECT * FROM meal_packs 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY purchase_date DESC`,
        ['user-123']
      )
      expect(logger.debug).toHaveBeenCalledWith('Fetching user meal packs', { userId: 'user-123' })
      expect(logger.debug).toHaveBeenCalledWith('User meal packs fetched', { userId: 'user-123', count: 2 })
    })

    it('should return empty array when no meal packs found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await dbService.getUserMealPacks('user-123')

      // ASSERT
      expect(result).toEqual([])
      expect(logger.debug).toHaveBeenCalledWith('User meal packs fetched', { userId: 'user-123', count: 0 })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.getUserMealPacks('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'get_user_meal_packs',
        userId: 'user-123',
        service: 'database'
      })
    })
  })

  describe('getActiveMealPacks', () => {
    const mockPackRows = [
      {
        id: 'pack-1',
        user_id: 'user-123',
        pack_size: '20',
        remaining_balance: '15',
        purchase_date: new Date('2023-01-01'),
        expiry_date: new Date('2023-12-31'),
        is_active: true,
        created_at: new Date('2023-01-01')
      }
    ]

    const expectedPacks: MealPack[] = [
      {
        id: 'pack-1',
        user_id: 'user-123',
        pack_size: 20,
        remaining_balance: 15,
        purchase_date: new Date('2023-01-01'),
        expiry_date: new Date('2023-12-31'),
        is_active: true,
        created_at: new Date('2023-01-01')
      }
    ]

    it('should return active meal packs ordered by purchase date ascending', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackRows })

      // ACT
      const result = await dbService.getActiveMealPacks('user-123')

      // ASSERT
      expect(result).toEqual(expectedPacks)
      expect(db.query).toHaveBeenCalledWith(
        `SELECT * FROM meal_packs 
         WHERE user_id = $1 AND is_active = true AND remaining_balance > 0
         ORDER BY purchase_date ASC`,
        ['user-123']
      )
      expect(logger.debug).toHaveBeenCalledWith('Fetching active meal packs', { userId: 'user-123' })
      expect(logger.debug).toHaveBeenCalledWith('Active meal packs fetched', { userId: 'user-123', count: 1 })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.getActiveMealPacks('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'get_active_meal_packs',
        userId: 'user-123',
        service: 'database'
      })
    })
  })

  describe('createMealPack', () => {
    const packData = {
      user_id: 'user-123',
      pack_size: 20,
      remaining_balance: 20,
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-12-31'),
      is_active: true
    }

    const mockPackRow = {
      id: 'pack-123',
      user_id: 'user-123',
      pack_size: '20',
      remaining_balance: '20',
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-12-31'),
      is_active: true,
      created_at: new Date('2023-01-01')
    }

    const expectedPack: MealPack = {
      id: 'pack-123',
      user_id: 'user-123',
      pack_size: 20,
      remaining_balance: 20,
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-12-31'),
      is_active: true,
      created_at: new Date('2023-01-01')
    }

    it('should create and return new meal pack', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPackRow] })

      // ACT
      const result = await dbService.createMealPack(packData)

      // ASSERT
      expect(result).toEqual(expectedPack)
      expect(db.query).toHaveBeenCalledWith(
        `INSERT INTO meal_packs (user_id, pack_size, remaining_balance, purchase_date, expiry_date, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          'user-123',
          20,
          20,
          new Date('2023-01-01'),
          new Date('2023-12-31'),
          true
        ]
      )
      expect(logger.info).toHaveBeenCalledWith('Meal pack created successfully', {
        packId: 'pack-123',
        userId: 'user-123'
      })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'user-123',
        'CREATE_MEAL_PACK',
        'meal_packs',
        { packSize: 20, packId: 'pack-123' }
      )
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.createMealPack(packData)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'create_meal_pack',
        userId: 'user-123',
        packSize: 20,
        service: 'database'
      })
    })
  })

  describe('updateMealPackBalance', () => {
    const mockPackRow = {
      id: 'pack-123',
      user_id: 'user-123',
      pack_size: '20',
      remaining_balance: '15',
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-12-31'),
      is_active: true,
      created_at: new Date('2023-01-01')
    }

    const expectedPack: MealPack = {
      id: 'pack-123',
      user_id: 'user-123',
      pack_size: 20,
      remaining_balance: 15,
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-12-31'),
      is_active: true,
      created_at: new Date('2023-01-01')
    }

    it('should update and return meal pack with new balance', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPackRow] })

      // ACT
      const result = await dbService.updateMealPackBalance('pack-123', 15)

      // ASSERT
      expect(result).toEqual(expectedPack)
      expect(db.query).toHaveBeenCalledWith(
        `UPDATE meal_packs 
         SET remaining_balance = $1 
         WHERE id = $2 
         RETURNING *`,
        [15, 'pack-123']
      )
      expect(logger.info).toHaveBeenCalledWith('Meal pack balance updated', {
        packId: 'pack-123',
        newBalance: 15,
        oldBalance: 15
      })
    })

    it('should throw DatabaseError when meal pack not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(dbService.updateMealPackBalance('pack-456', 10)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(
        expect.any(DatabaseError),
        {
          action: 'update_meal_pack_balance',
          packId: 'pack-456',
          newBalance: 10,
          service: 'database'
        }
      )
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.updateMealPackBalance('pack-123', 15)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'update_meal_pack_balance',
        packId: 'pack-123',
        newBalance: 15,
        service: 'database'
      })
    })
  })

  describe('deactivateExpiredPacks', () => {
    it('should deactivate expired packs and log audit when packs are deactivated', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rowCount: 3 })

      // ACT
      await dbService.deactivateExpiredPacks()

      // ASSERT
      // Just check it was called with the right query pattern and empty params
      expect(db.query).toHaveBeenCalled()
      const callArgs = (db.query as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toEqual(expect.stringContaining('UPDATE meal_packs'))
      expect(callArgs[1]).toEqual([])
      
      expect(logger.info).toHaveBeenCalledWith('Expired meal packs deactivated', { count: 3 })
      expect(AuditLogger.log).toHaveBeenCalledWith({
        action: 'DEACTIVATE_EXPIRED_PACKS',
        resource: 'meal_packs',
        details: { deactivatedCount: 3 },
        success: true
      })
    })

    it('should not log audit when no packs are deactivated', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 })

      // ACT
      await dbService.deactivateExpiredPacks()

      // ASSERT
      expect(logger.info).toHaveBeenCalledWith('Expired meal packs deactivated', { count: 0 })
      expect(AuditLogger.log).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.deactivateExpiredPacks()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'deactivate_expired_packs',
        service: 'database'
      })
    })
  })

  describe('getUserAvailableMeals', () => {
    it('should return total available meals for user', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_meals: '25' }] })

      // ACT
      const result = await dbService.getUserAvailableMeals('user-123')

      // ASSERT
      expect(result).toBe(25)
      expect(db.query).toHaveBeenCalledWith(
        `SELECT COALESCE(SUM(remaining_balance), 0) as total_meals
         FROM meal_packs 
         WHERE user_id = $1 AND is_active = true AND remaining_balance > 0`,
        ['user-123']
      )
      expect(logger.debug).toHaveBeenCalledWith('Calculating user available meals', { userId: 'user-123' })
      expect(logger.debug).toHaveBeenCalledWith('User meal balance calculated', { userId: 'user-123', balance: 25 })
    })

    it('should return 0 when user has no available meals', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_meals: '0' }] })

      // ACT
      const result = await dbService.getUserAvailableMeals('user-123')

      // ASSERT
      expect(result).toBe(0)
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(dbService.getUserAvailableMeals('user-123')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'get_user_available_meals',
        userId: 'user-123',
        service: 'database'
      })
    })
  })
})
