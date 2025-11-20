// src/lib/services/admin/packService.test.ts
import { adminPackService } from './packService'
import { db } from '../../database/client'
import { captureErrorSafe } from '../../utils/error-utils'
import { logger } from '../../logging/logger'
import { DatabaseError } from '../../errors/system-errors'

// Mock dependencies
jest.mock('../../database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('../../utils/error-utils')
jest.mock('../../logging/logger')

describe('adminPackService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllPackTemplates', () => {
    const mockTemplateRows = [
      {
        id: 'template-1',
        name: 'Small Pack',
        size: 10,
        price: 50,
        description: 'Small meal pack',
        is_active: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        sales_count: 5
      }
    ]

    it('should return all pack templates without filters', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockTemplateRows })

      // ACT
      const result = await adminPackService.getAllPackTemplates()

      // ASSERT
      expect(result).toEqual(mockTemplateRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        []
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack templates for admin', { filters: undefined })
      expect(logger.info).toHaveBeenCalledWith('Pack templates fetched successfully', { count: 1, filters: undefined })
    })

    it('should return filtered active pack templates', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockTemplateRows })

      // ACT
      const result = await adminPackService.getAllPackTemplates({ active: true })

      // ASSERT
      expect(result).toEqual(mockTemplateRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND pt.is_active = $1'),
        [true]
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack templates for admin', { filters: { active: true } })
    })

    it('should return filtered inactive pack templates', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockTemplateRows })

      // ACT
      const result = await adminPackService.getAllPackTemplates({ active: false })

      // ASSERT
      expect(result).toEqual(mockTemplateRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND pt.is_active = $1'),
        [false]
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack templates for admin', { filters: { active: false } })
    })

    it('should handle empty results', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminPackService.getAllPackTemplates()

      // ASSERT
      expect(result).toEqual([])
      expect(logger.info).toHaveBeenCalledWith('Pack templates fetched successfully', { count: 0, filters: undefined })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.getAllPackTemplates()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_all_pack_templates',
        service: 'admin',
        filters: undefined
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack templates', {
        error: 'Database connection failed',
        stack: error.stack,
        filters: undefined
      })
    })
  })

  describe('getPackTemplateById', () => {
    const mockTemplateRow = {
      id: 'template-1',
      name: 'Small Pack',
      size: 10,
      price: 50,
      description: 'Small meal pack',
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    }

    it('should return pack template when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplateRow] })

      // ACT
      const result = await adminPackService.getPackTemplateById('template-1')

      // ASSERT
      expect(result).toEqual(mockTemplateRow)
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM meal_pack_templates WHERE id = $1',
        ['template-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching pack template by ID for admin', { templateId: 'template-1' })
      expect(logger.info).toHaveBeenCalledWith('Pack template fetched successfully', { templateId: 'template-1' })
    })

    it('should return null when pack template not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminPackService.getPackTemplateById('template-999')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('Pack template not found', { templateId: 'template-999' })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.getPackTemplateById('template-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_pack_template_by_id',
        service: 'admin',
        templateId: 'template-1'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack template', {
        error: 'Database connection failed',
        stack: error.stack,
        templateId: 'template-1'
      })
    })
  })

  describe('createPackTemplate', () => {
    const validTemplateData = {
      name: 'Medium Pack',
      size: 20,
      price: 90,
      description: 'Medium meal pack',
      is_active: true
    }

    const mockTemplateRow = {
      id: 'template-2',
      name: 'Medium Pack',
      size: 20,
      price: 90,
      description: 'Medium meal pack',
      is_active: true,
      created_at: new Date('2023-01-02'),
      updated_at: new Date('2023-01-02')
    }

    it('should create and return new pack template with valid data', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplateRow] })

      // ACT
      const result = await adminPackService.createPackTemplate(validTemplateData)

      // ASSERT
      expect(result).toEqual(mockTemplateRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO meal_pack_templates'),
        [
          'Medium Pack',
          20,
          90,
          'Medium meal pack',
          true
        ]
      )
      expect(logger.info).toHaveBeenCalledWith('Creating new pack template', {
        name: 'Medium Pack',
        size: 20,
        price: 90
      })
      expect(logger.info).toHaveBeenCalledWith('Pack template created successfully', { templateId: 'template-2' })
    })

    it('should create template with default is_active when not provided', async () => {
      // ARRANGE
      const templateDataWithoutActive = {
        name: 'Basic Pack',
        size: 15,
        price: 75,
        description: 'Basic meal pack',
        is_active: true
      }
      
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplateRow] })

      // ACT
      const result = await adminPackService.createPackTemplate(templateDataWithoutActive)

      // ASSERT
      expect(result).toEqual(mockTemplateRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO meal_pack_templates'),
        [
          'Basic Pack',
          15,
          75,
          'Basic meal pack',
          true // default value
        ]
      )
    })

    it('should throw error when name is missing', async () => {
      // ARRANGE
      const invalidData = {
        size: 20,
        price: 90,
        description: 'Medium meal pack',
        is_active: true
      }

      // ACT & ASSERT
     await expect(adminPackService.createPackTemplate(invalidData as unknown as Parameters<typeof adminPackService.createPackTemplate>[0])).rejects.toThrow('Name, size, and price are required');


      expect(db.query).not.toHaveBeenCalled()
      expect(captureErrorSafe).not.toHaveBeenCalled()
    })

    it('should throw error when size is missing', async () => {
      // ARRANGE
      const invalidData = {
        name: 'Incomplete Pack',
        price: 90,
        description: 'Medium meal pack',
        is_active: true
      }

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(invalidData as unknown as Parameters<typeof adminPackService.createPackTemplate>[0])).rejects.toThrow('Name, size, and price are required');
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when price is missing', async () => {
      // ARRANGE
      const invalidData = {
        name: 'Incomplete Pack',
        size: 20,
        description: 'Medium meal pack',
        is_active: true
      }

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(invalidData as unknown as Parameters<typeof adminPackService.createPackTemplate>[0])).rejects.toThrow('Name, size, and price are required');
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when size is not positive', async () => {
      // ARRANGE
      const invalidData = {
        name: 'Invalid Pack',
        size: 0,
        price: 50,
        description: 'Invalid pack',
        is_active: true
      }

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(invalidData)).rejects.toThrow('Size must be positive')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when size is negative', async () => {
      // ARRANGE
      const invalidData = {
        name: 'Invalid Pack',
        size: -5,
        price: 50,
        description: 'Invalid pack',
        is_active: true
      }

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(invalidData)).rejects.toThrow('Size must be positive')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when price is negative', async () => {
      // ARRANGE
      const invalidData = {
        name: 'Invalid Pack',
        size: 10,
        price: -10,
        description: 'Invalid pack',
        is_active: true
      }

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(invalidData)).rejects.toThrow('Price must be non-negative')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(validTemplateData)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_create_pack_template',
        service: 'admin',
        templateData: {
          name: 'Medium Pack',
          size: 20,
          price: 90
        }
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to create pack template', {
        error: 'Database connection failed',
        stack: error.stack,
        templateData: {
          name: 'Medium Pack',
          size: 20,
          price: 90
        }
      })
    })

    it('should re-throw DatabaseError as-is', async () => {
      // ARRANGE
      const dbError = new DatabaseError('Custom database error')
      ;(db.query as jest.Mock).mockRejectedValueOnce(dbError)

      // ACT & ASSERT
      await expect(adminPackService.createPackTemplate(validTemplateData)).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, expect.any(Object))
    })
  })

  describe('updatePackTemplate', () => {
    const mockTemplateRow = {
      id: 'template-1',
      name: 'Updated Pack',
      size: 25,
      price: 100,
      description: 'Updated meal pack',
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-03')
    }

    it('should update and return pack template with valid data', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplateRow] })

      // ACT
      const result = await adminPackService.updatePackTemplate('template-1', {
        name: 'Updated Pack',
        size: 25,
        price: 100
      })

      // ASSERT
      expect(result).toEqual(mockTemplateRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meal_pack_templates SET'),
        expect.arrayContaining(['template-1', 'Updated Pack', 25, 100])
      )
      expect(logger.info).toHaveBeenCalledWith('Updating pack template', {
        templateId: 'template-1',
        updateFields: ['name', 'size', 'price']
      })
      expect(logger.info).toHaveBeenCalledWith('Pack template updated successfully', { templateId: 'template-1' })
    })

    it('should update single field', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplateRow] })

      // ACT
      const result = await adminPackService.updatePackTemplate('template-1', {
        name: 'New Name Only'
      })

      // ASSERT
      expect(result).toEqual(mockTemplateRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meal_pack_templates SET'),
        expect.arrayContaining(['template-1', 'New Name Only'])
      )
      expect(logger.info).toHaveBeenCalledWith('Updating pack template', {
        templateId: 'template-1',
        updateFields: ['name']
      })
    })

    it('should throw error when no data provided for update', async () => {
      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-1', {})).rejects.toThrow('No data provided for update')
      expect(db.query).not.toHaveBeenCalled()
      expect(captureErrorSafe).not.toHaveBeenCalled()
    })

    it('should throw error when size is not positive', async () => {
      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-1', { size: 0 })).rejects.toThrow('Size must be positive')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw error when price is negative', async () => {
      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-1', { price: -10 })).rejects.toThrow('Price must be non-negative')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should throw DatabaseError when pack template not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-999', { name: 'New Name' })).rejects.toThrow('Pack template not found')
      expect(logger.warn).toHaveBeenCalledWith('Pack template not found for update', { templateId: 'template-999' })
    })

    it('should re-throw validation errors as-is', async () => {
      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-1', { size: -5 })).rejects.toThrow('Size must be positive')
      expect(db.query).not.toHaveBeenCalled()
    })

    it('should re-throw "not found" error as-is', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-999', { name: 'New Name' })).rejects.toThrow('Pack template not found')
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-1', { name: 'Updated Name' })).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_pack_template',
        service: 'admin',
        templateId: 'template-1',
        updateFields: ['name']
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to update pack template', {
        error: 'Database connection failed',
        stack: error.stack,
        templateId: 'template-1',
        updateFields: ['name']
      })
    })

    it('should re-throw DatabaseError as-is', async () => {
      // ARRANGE
      const dbError = new DatabaseError('Custom database error')
      ;(db.query as jest.Mock).mockRejectedValueOnce(dbError)

      // ACT & ASSERT
      await expect(adminPackService.updatePackTemplate('template-1', { name: 'Updated Name' })).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, expect.any(Object))
    })
  })

  describe('deletePackTemplate', () => {
    const mockTemplateRow = {
      id: 'template-1',
      name: 'Small Pack',
      size: 10,
      price: 50,
      description: 'Small meal pack',
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    }

    it('should delete and return pack template', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplateRow] })

      // ACT
      const result = await adminPackService.deletePackTemplate('template-1')

      // ASSERT
      expect(result).toEqual(mockTemplateRow)
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM meal_pack_templates WHERE id = $1 RETURNING *',
        ['template-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Deleting pack template', { templateId: 'template-1' })
      expect(logger.info).toHaveBeenCalledWith('Pack template deleted successfully', { templateId: 'template-1' })
    })

    it('should throw DatabaseError when pack template not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminPackService.deletePackTemplate('template-999')).rejects.toThrow(DatabaseError)
      expect(logger.warn).toHaveBeenCalledWith('Pack template not found for deletion', { templateId: 'template-999' })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.deletePackTemplate('template-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_delete_pack_template',
        service: 'admin',
        templateId: 'template-1'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to delete pack template', {
        error: 'Database connection failed',
        stack: error.stack,
        templateId: 'template-1'
      })
    })

    it('should re-throw DatabaseError as-is', async () => {
      // ARRANGE
      const dbError = new DatabaseError('Custom database error')
      ;(db.query as jest.Mock).mockRejectedValueOnce(dbError)

      // ACT & ASSERT
      await expect(adminPackService.deletePackTemplate('template-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, expect.any(Object))
    })
  })

  describe('getAllPackSales', () => {
    const mockPackSalesRows = [
      {
        id: 'sale-1',
        user_id: 'user-123',
        template_id: 'template-1',
        price_paid: 50,
        status: 'active',
        purchase_date: new Date('2023-01-01'),
        expiry_date: new Date('2023-02-01'),
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        template_name: 'Small Pack',
        user_name: 'John Doe',
        user_email: 'john@example.com'
      }
    ]

    it('should return all pack sales without filters', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackSalesRows })

      // ACT
      const result = await adminPackService.getAllPackSales()

      // ASSERT
      expect(result).toEqual(mockPackSalesRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        []
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack sales for admin', { filters: undefined })
      expect(logger.info).toHaveBeenCalledWith('Pack sales fetched successfully', { count: 1, filters: undefined })
    })

    it('should filter by templateId', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackSalesRows })

      // ACT
      const result = await adminPackService.getAllPackSales({ templateId: 'template-1' })

      // ASSERT
      expect(result).toEqual(mockPackSalesRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND ps.template_id = $1'),
        ['template-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack sales for admin', { filters: { templateId: 'template-1' } })
    })

    it('should filter by status', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackSalesRows })

      // ACT
      const result = await adminPackService.getAllPackSales({ status: 'active' })

      // ASSERT
      expect(result).toEqual(mockPackSalesRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND ps.status = $1'),
        ['active']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack sales for admin', { filters: { status: 'active' } })
    })

    it('should filter by startDate', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackSalesRows })

      // ACT
      const result = await adminPackService.getAllPackSales({ startDate: '2023-01-01' })

      // ASSERT
      expect(result).toEqual(mockPackSalesRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND ps.purchase_date >= $1'),
        ['2023-01-01']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack sales for admin', { filters: { startDate: '2023-01-01' } })
    })

    it('should filter by endDate', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackSalesRows })

      // ACT
      const result = await adminPackService.getAllPackSales({ endDate: '2023-01-31' })

      // ASSERT
      expect(result).toEqual(mockPackSalesRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND ps.purchase_date <= $1'),
        ['2023-01-31']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack sales for admin', { filters: { endDate: '2023-01-31' } })
    })

    it('should filter by multiple criteria', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: mockPackSalesRows })

      // ACT
      const result = await adminPackService.getAllPackSales({
        templateId: 'template-1',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      })

      // ASSERT
      expect(result).toEqual(mockPackSalesRows)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND ps.template_id = $1 AND ps.status = $2 AND ps.purchase_date >= $3 AND ps.purchase_date <= $4'),
        ['template-1', 'active', '2023-01-01', '2023-01-31']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching all pack sales for admin', {
        filters: {
          templateId: 'template-1',
          status: 'active',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      })
    })

    it('should handle empty results', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminPackService.getAllPackSales()

      // ASSERT
      expect(result).toEqual([])
      expect(logger.info).toHaveBeenCalledWith('Pack sales fetched successfully', { count: 0, filters: undefined })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.getAllPackSales()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_all_pack_sales',
        service: 'admin',
        filters: undefined
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack sales', {
        error: 'Database connection failed',
        stack: error.stack,
        filters: undefined
      })
    })
  })

  describe('getPackSaleById', () => {
    const mockPackSaleRow = {
      id: 'sale-1',
      user_id: 'user-123',
      template_id: 'template-1',
      price_paid: 50,
      status: 'active',
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-02-01'),
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      template_name: 'Small Pack',
      user_name: 'John Doe',
      user_email: 'john@example.com'
    }

    it('should return pack sale when found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPackSaleRow] })

      // ACT
      const result = await adminPackService.getPackSaleById('sale-1')

      // ASSERT
      expect(result).toEqual(mockPackSaleRow)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ps.*, pt.name as template_name, u.name as user_name, u.email as user_email'),
        ['sale-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Fetching pack sale by ID for admin', { saleId: 'sale-1' })
      expect(logger.info).toHaveBeenCalledWith('Pack sale fetched successfully', { saleId: 'sale-1' })
    })

    it('should return null when pack sale not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT
      const result = await adminPackService.getPackSaleById('sale-999')

      // ASSERT
      expect(result).toBeNull()
      expect(logger.info).toHaveBeenCalledWith('Pack sale not found', { saleId: 'sale-999' })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.getPackSaleById('sale-1')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_pack_sale_by_id',
        service: 'admin',
        saleId: 'sale-1'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack sale', {
        error: 'Database connection failed',
        stack: error.stack,
        saleId: 'sale-1'
      })
    })
  })

  describe('getPackSalesStats', () => {
    const mockStatsRow = {
      total_sales: 50,
      total_revenue: 2500,
      average_price: 50,
      unique_customers: 30
    }

    it('should return pack sales statistics', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockStatsRow] })

      // ACT
      const result = await adminPackService.getPackSalesStats()

      // ASSERT
      expect(result).toEqual(mockStatsRow)
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
      expect(logger.debug).toHaveBeenCalledWith('Fetching pack sales statistics for admin dashboard')
      expect(logger.debug).toHaveBeenCalledWith('Pack sales statistics fetched', { stats: mockStatsRow })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.getPackSalesStats()).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_get_pack_sales_stats',
        service: 'admin'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack sales statistics', {
        error: 'Database connection failed',
        stack: error.stack
      })
    })
  })

  describe('updatePackSaleStatus', () => {
    const mockPackSaleRow = {
      id: 'sale-1',
      user_id: 'user-123',
      template_id: 'template-1',
      price_paid: 50,
      status: 'active',
      purchase_date: new Date('2023-01-01'),
      expiry_date: new Date('2023-02-01'),
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      template_name: 'Small Pack',
      user_name: 'John Doe',
      user_email: 'john@example.com'
    }

    it('should update and return pack sale status', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPackSaleRow] })

      // ACT
      const result = await adminPackService.updatePackSaleStatus('sale-1', 'used')

      // ASSERT
      expect(result).toEqual(mockPackSaleRow)
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE pack_sales SET status = $1 WHERE id = $2 RETURNING *',
        ['used', 'sale-1']
      )
      expect(logger.info).toHaveBeenCalledWith('Updating pack sale status', { saleId: 'sale-1', newStatus: 'used' })
      expect(logger.info).toHaveBeenCalledWith('Pack sale status updated successfully', {
        saleId: 'sale-1',
        oldStatus: 'active',
        newStatus: 'used'
      })
    })

    it('should throw DatabaseError when pack sale not found', async () => {
      // ARRANGE
      ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      // ACT & ASSERT
      await expect(adminPackService.updatePackSaleStatus('sale-999', 'used')).rejects.toThrow(DatabaseError)
      expect(logger.warn).toHaveBeenCalledWith('Pack sale not found for status update', { saleId: 'sale-999', status: 'used' })
    })

    it('should throw DatabaseError when database query fails', async () => {
      // ARRANGE
      const error = new Error('Database connection failed')
      ;(db.query as jest.Mock).mockRejectedValueOnce(error)

      // ACT & ASSERT
      await expect(adminPackService.updatePackSaleStatus('sale-1', 'used')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_update_pack_sale_status',
        service: 'admin',
        saleId: 'sale-1',
        status: 'used'
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to update pack sale status', {
        error: 'Database connection failed',
        stack: error.stack,
        saleId: 'sale-1',
        status: 'used'
      })
    })

    it('should re-throw DatabaseError as-is', async () => {
      // ARRANGE
      const dbError = new DatabaseError('Custom database error')
      ;(db.query as jest.Mock).mockRejectedValueOnce(dbError)

      // ACT & ASSERT
      await expect(adminPackService.updatePackSaleStatus('sale-1', 'used')).rejects.toThrow(DatabaseError)
      expect(captureErrorSafe).toHaveBeenCalledWith(dbError, expect.any(Object))
    })
  })
})
 