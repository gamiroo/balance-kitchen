// lib/services/admin/menuService.test.ts
import { adminMenuService } from './menuService'
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

describe('adminMenuService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllMenus', () => {
    const mockMenuRows = [
      {
        id: 'menu-1',
        week_start_date: new Date('2023-01-01'),
        week_end_date: new Date('2023-01-07'),
        created_by: 'admin-123',
        is_published: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        created_by_name: 'Admin User',
        item_count: 5
      }
    ]

    it('should return all menus without filters', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockMenuRows })

      // ACT
      const result = await adminMenuService.getAllMenus()

      // ASSERT
      expect(result).toEqual(mockMenuRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array)
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all menus for admin', { filters: undefined })
      expect(logger.info).toHaveBeenCalledWith('Menus fetched successfully', { count: 1, filters: undefined })
    })

    it('should return filtered published menus', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockMenuRows })

      // ACT
      const result = await adminMenuService.getAllMenus({ published: true })

      // ASSERT
      expect(result).toEqual(mockMenuRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND m.is_published = $1'),
        [true]
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all menus for admin', { filters: { published: true } })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.getAllMenus()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_all_menus',
        service: 'admin',
        filters: undefined
      })
    })
  })

  describe('getMenuById', () => {
    const mockMenuRow = {
      id: 'menu-1',
      week_start_date: new Date('2023-01-01'),
      week_end_date: new Date('2023-01-07'),
      created_by: 'admin-123',
      is_published: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      created_by_name: 'Admin User'
    }

    const mockItemRows = [
      {
        id: 'item-1',
        menu_id: 'menu-1',
        name: 'Test Dish',
        description: 'Test description',
        price: 0,
        category: 'main',
        is_available: true,
        created_by: 'admin-123',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01')
      }
    ]

    it('should return menu with items when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockMenuRow] })
        .mockResolvedValueOnce({ rows: mockItemRows })

      // ACT
      const result = await adminMenuService.getMenuById('menu-1')

      // ASSERT
      expect(result).toEqual({
        ...mockMenuRow,
        items: mockItemRows
      })
      expect(db.query).toHaveBeenCalledTimes(2)
      expect(logger.info).toHaveBeenCalledWith('Fetching menu by ID for admin', { menuId: 'menu-1' })
      expect(logger.info).toHaveBeenCalledWith('Menu details fetched successfully', { menuId: 'menu-1' })
    })

    it('should return null when menu not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminMenuService.getMenuById('menu-999')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('Menu not found', { menuId: 'menu-999' })
    })

    it('should throw error when menu ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.getMenuById('')).rejects.toThrow('Menu ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.getMenuById('menu-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_menu_by_id',
        service: 'admin',
        menuId: 'menu-1'
      })
    })
  })

  describe('createMenu', () => {
    const validMenuData = {
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      created_by: 'admin-123'
    }

    const mockMenuRow = {
      id: 'menu-2',
      week_start_date: new Date('2023-01-01'),
      week_end_date: new Date('2023-01-07'),
      created_by: 'admin-123',
      is_published: false,
      created_at: new Date('2023-01-02'),
      updated_at: new Date('2023-01-02')
    }

    it('should create and return new menu with valid data', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuRow] })

      // ACT
      const result = await adminMenuService.createMenu(validMenuData)

      // ASSERT
      expect(result).toEqual(mockMenuRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO menus'),
        expect.arrayContaining(['2023-01-01', '2023-01-07', 'admin-123'])
      )
      expect(logger.info).toHaveBeenCalledWith('Creating new menu', {
        createdBy: 'admin-123',
        startDate: '2023-01-01',
        endDate: '2023-01-07'
      })
      expect(logger.info).toHaveBeenCalledWith('Menu created successfully', { menuId: 'menu-2' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'admin-123',
        'CREATE_MENU',
        'menus',
        { menuId: 'menu-2' }
      )
    })

    it('should throw error when required fields are missing', async () => {
      // ARRANGE
      const invalidData = {
        week_start_date: '2023-01-01'
        // missing week_end_date and created_by
      }

      // ACT & ASSERT
      await expect(adminMenuService.createMenu(invalidData as any)).rejects.toThrow()
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.createMenu(validMenuData)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_create_menu',
        service: 'admin',
        menuData: validMenuData
      })
    })
  })

  describe('updateMenu', () => {
    const mockMenuRow = {
      id: 'menu-1',
      week_start_date: new Date('2023-01-01'),
      week_end_date: new Date('2023-01-07'),
      created_by: 'admin-123',
      is_published: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should update and return menu with valid data', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuRow] })

      // ACT
      const result = await adminMenuService.updateMenu('menu-1', {
        is_published: true,
        updated_by: 'admin-456'
      })

      // ASSERT
      expect(result).toEqual(mockMenuRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE menus SET'),
        expect.arrayContaining(['menu-1', true, 'admin-456'])
      )
      expect(logger.info).toHaveBeenCalledWith('Updating menu', {
        menuId: 'menu-1',
        updateFields: ['is_published', 'updated_by']
      })
      expect(logger.info).toHaveBeenCalledWith('Menu updated successfully', { menuId: 'menu-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'admin-456',
        'UPDATE_MENU',
        'menus',
        { menuId: 'menu-1' }
      )
    })

    it('should throw error when menu ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.updateMenu('', { is_published: true })).rejects.toThrow('Menu ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when no data provided for update', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.updateMenu('menu-1', {})).rejects.toThrow('No data provided for update')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when menu not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminMenuService.updateMenu('menu-999', { is_published: true })).rejects.toThrow('Menu not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.updateMenu('menu-1', { is_published: true })).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_menu',
        service: 'admin',
        menuId: 'menu-1',
        updateFields: ['is_published']
      })
    })
  })

  describe('deleteMenu', () => {
    const mockMenuRow = {
      id: 'menu-1',
      week_start_date: new Date('2023-01-01'),
      week_end_date: new Date('2023-01-07'),
      created_by: 'admin-123',
      is_published: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    }

    it('should delete menu and its items', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 3 }) // Delete menu items
        .mockResolvedValueOnce({ rows: [mockMenuRow] }) // Delete menu

      // ACT
      const result = await adminMenuService.deleteMenu('menu-1')

      // ASSERT
      expect(result).toEqual(mockMenuRow)
      expect(db.query).toHaveBeenCalledTimes(2)
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM menu_items'), ['menu-1'])
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM menus'), ['menu-1'])
      expect(logger.info).toHaveBeenCalledWith('Deleting menu', { menuId: 'menu-1' })
      expect(logger.info).toHaveBeenCalledWith('Menu deleted successfully', { menuId: 'menu-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'DELETE_MENU',
        'menus',
        { menuId: 'menu-1', deletedItems: 3 }
      )
    })

    it('should throw error when menu ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.deleteMenu('')).rejects.toThrow('Menu ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when menu not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 0 }) // Delete menu items
        .mockResolvedValueOnce({ rows: [] }) // Delete menu

      // ACT & ASSERT
      await expect(adminMenuService.deleteMenu('menu-999')).rejects.toThrow('Menu not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.deleteMenu('menu-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_delete_menu',
        service: 'admin',
        menuId: 'menu-1'
      })
    })
  })

  describe('publishMenu', () => {
    const mockMenuRow = {
      id: 'menu-1',
      week_start_date: new Date('2023-01-01'),
      week_end_date: new Date('2023-01-07'),
      created_by: 'admin-123',
      is_published: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should publish menu successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuRow] })

      // ACT
      const result = await adminMenuService.publishMenu('menu-1')

      // ASSERT
      expect(result).toEqual(mockMenuRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE menus SET is_published = true'),
        ['menu-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Publishing menu', { menuId: 'menu-1' })
      expect(logger.info).toHaveBeenCalledWith('Menu published successfully', { menuId: 'menu-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'PUBLISH_MENU',
        'menus',
        { menuId: 'menu-1' }
      )
    })

    it('should throw error when menu ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.publishMenu('')).rejects.toThrow('Menu ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when menu not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminMenuService.publishMenu('menu-999')).rejects.toThrow('Menu not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.publishMenu('menu-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_publish_menu',
        service: 'admin',
        menuId: 'menu-1'
      })
    })
  })

  describe('unpublishMenu', () => {
    const mockMenuRow = {
      id: 'menu-1',
      week_start_date: new Date('2023-01-01'),
      week_end_date: new Date('2023-01-07'),
      created_by: 'admin-123',
      is_published: false,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should unpublish menu successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuRow] })

      // ACT
      const result = await adminMenuService.unpublishMenu('menu-1')

      // ASSERT
      expect(result).toEqual(mockMenuRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE menus SET is_published = false'),
        ['menu-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Unpublishing menu', { menuId: 'menu-1' })
      expect(logger.info).toHaveBeenCalledWith('Menu unpublished successfully', { menuId: 'menu-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'UNPUBLISH_MENU',
        'menus',
        { menuId: 'menu-1' }
      )
    })

    it('should throw error when menu ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.unpublishMenu('')).rejects.toThrow('Menu ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when menu not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminMenuService.unpublishMenu('menu-999')).rejects.toThrow('Menu not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.unpublishMenu('menu-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_unpublish_menu',
        service: 'admin',
        menuId: 'menu-1'
      })
    })
  })

  describe('createMenuItem', () => {
    const validMenuItemData = {
      id: 'item-1',
      menu_id: 'menu-1',
      name: 'Test Dish',
      description: 'Test description',
      price: 0,
      category: 'main',
      is_available: true,
      created_by: 'admin-123'
    }

    const mockMenuItemRow = {
      id: 'item-1',
      menu_id: 'menu-1',
      name: 'Test Dish',
      description: 'Test description',
      price: 0,
      category: 'main',
      is_available: true,
      created_by: 'admin-123',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    }

    it('should create and return new menu item with valid data', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuItemRow] })

      // ACT
      const result = await adminMenuService.createMenuItem('item-1', validMenuItemData)

      // ASSERT
      expect(result).toEqual(mockMenuItemRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO menu_items'),
        expect.any(Array)
      )
      expect(logger.info).toHaveBeenCalledWith('Creating menu item', {
        menuItemId: 'item-1',
        menuId: 'menu-1',
        name: 'Test Dish'
      })
      expect(logger.info).toHaveBeenCalledWith('Menu item created successfully', { menuItemId: 'item-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'admin-123',
        'CREATE_MENU_ITEM',
        'menu_items',
        { menuItemId: 'item-1', menuId: 'menu-1' }
      )
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.createMenuItem('item-1', validMenuItemData)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_create_menu_item',
        service: 'admin',
        menuItemId: 'item-1',
        itemData: {
          menuId: 'menu-1',
          name: 'Test Dish',
          category: 'main'
        }
      })
    })
  })

  describe('updateMenuItem', () => {
    const mockMenuItemRow = {
      id: 'item-1',
      menu_id: 'menu-1',
      name: 'Updated Dish',
      description: 'Updated description',
      price: 0,
      category: 'main',
      is_available: true,
      created_by: 'admin-123',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should update and return menu item with valid data', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuItemRow] })

      // ACT
      const result = await adminMenuService.updateMenuItem('item-1', {
        name: 'Updated Dish',
        updated_by: 'admin-456'
      })

      // ASSERT
      expect(result).toEqual(mockMenuItemRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE menu_items SET'),
        expect.any(Array)
      )
      expect(logger.info).toHaveBeenCalledWith('Updating menu item', {
        menuItemId: 'item-1',
        updateFields: ['name', 'updated_by']
      })
      expect(logger.info).toHaveBeenCalledWith('Menu item updated successfully', { menuItemId: 'item-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'admin-456',
        'UPDATE_MENU_ITEM',
        'menu_items',
        { menuItemId: 'item-1' }
      )
    })

    it('should throw error when menu item ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.updateMenuItem('', { name: 'Updated Dish' })).rejects.toThrow('Menu item ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when no data provided for update', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.updateMenuItem('item-1', {})).rejects.toThrow('No data provided for update')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when menu item not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminMenuService.updateMenuItem('item-999', { name: 'Updated Dish' })).rejects.toThrow('Menu item not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.updateMenuItem('item-1', { name: 'Updated Dish' })).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_menu_item',
        service: 'admin',
        menuItemId: 'item-1',
        updateFields: ['name']
      })
    })
  })

  describe('deleteMenuItem', () => {
    const mockMenuItemRow = {
      id: 'item-1',
      menu_id: 'menu-1',
      name: 'Test Dish',
      description: 'Test description',
      price: 0,
      category: 'main',
      is_available: true,
      created_by: 'admin-123',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    }

    it('should delete menu item successfully', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMenuItemRow] })

      // ACT
      const result = await adminMenuService.deleteMenuItem('item-1')

      // ASSERT
      expect(result).toEqual(mockMenuItemRow)
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM menu_items'), ['item-1'])
      expect(logger.info).toHaveBeenCalledWith('Deleting menu item', { menuItemId: 'item-1' })
      expect(logger.info).toHaveBeenCalledWith('Menu item deleted successfully', { menuItemId: 'item-1' })
      expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
        'unknown',
        'DELETE_MENU_ITEM',
        'menu_items',
        { menuItemId: 'item-1' }
      )
    })

    it('should throw error when menu item ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminMenuService.deleteMenuItem('')).rejects.toThrow('Menu item ID is required')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when menu item not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminMenuService.deleteMenuItem('item-999')).rejects.toThrow('Menu item not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminMenuService.deleteMenuItem('item-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_delete_menu_item',
        service: 'admin',
        menuItemId: 'item-1'
      })
    })
  })
})
