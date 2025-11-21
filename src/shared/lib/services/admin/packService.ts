// lib/services/admin/packService.ts
import { db } from "../../database/client";
import { captureErrorSafe } from '../../utils/error-utils';
import { logger } from '../../logging/logger';
import { DatabaseError } from '../../errors/system-errors';

// Define database row interfaces
interface PackTemplateRow {
  id: string;
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  sales_count: number;
  [key: string]: unknown;
}

interface PackSaleRow {
  id: string;
  user_id: string;
  template_id: string;
  price_paid: number;
  status: string;
  purchase_date: Date;
  expiry_date: Date;
  created_at: Date;
  updated_at: Date;
  template_name: string;
  user_name: string;
  user_email: string;
  [key: string]: unknown;
}

interface PackSalesStatsRow {
  total_sales: number;
  total_revenue: number;
  average_price: number;
  unique_customers: number;
  [key: string]: unknown;
}

// Define business logic interfaces
interface PackTemplateFilters {
  active?: boolean;
}

interface PackTemplate {
  id: string;
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PackSaleFilters {
  templateId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface PackSale {
  id: string;
  user_id: string;
  template_id: string;
  price_paid: number;
  status: string;
  purchase_date: Date;
  expiry_date: Date;
  created_at: Date;
  updated_at: Date;
  template_name: string;
  user_name: string;
  user_email: string;
}

interface PackSalesStats {
  total_sales: number;
  total_revenue: number;
  average_price: number;
  unique_customers: number;
}

interface CreatePackTemplateData {
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
}

interface UpdatePackTemplateData {
  name?: string;
  size?: number;
  price?: number;
  description?: string;
  is_active?: boolean;
}

export const adminPackService = {
  // Pack Templates
  async getAllPackTemplates(filters?: PackTemplateFilters): Promise<PackTemplate[]> {
    try {
      logger.info('Fetching all pack templates for admin', { filters });
      
      let query = `
        SELECT 
          pt.*,
          COUNT(ps.id) as sales_count
        FROM meal_pack_templates pt
        LEFT JOIN pack_sales ps ON pt.id = ps.template_id
        WHERE 1=1
      `;
      
      const params: unknown[] = [];
      let paramIndex = 1;

      if (filters?.active !== undefined) {
        query += ` AND pt.is_active = $${paramIndex}`;
        params.push(filters.active);
        paramIndex++;
      }

      query += ` GROUP BY pt.id ORDER BY pt.created_at DESC`;

      const result = await db.query<PackTemplateRow>(query, params);
      
      logger.info('Pack templates fetched successfully', { count: result.rows.length, filters });
      return result.rows as PackTemplate[]; // Type assertion
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_all_pack_templates',
        service: 'admin',
        filters
      });
      
      logger.error('Failed to fetch pack templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      
      throw new DatabaseError('Failed to fetch pack templates', { filters });
    }
  },

  async getPackTemplateById(id: string): Promise<PackTemplate | null> {
    try {
      logger.info('Fetching pack template by ID for admin', { templateId: id });
      
      const result = await db.query<PackTemplateRow>(
        `SELECT * FROM meal_pack_templates WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.info('Pack template not found', { templateId: id });
        return null;
      }
      
      const template: PackTemplate = result.rows[0] as PackTemplate; // Type assertion
      logger.info('Pack template fetched successfully', { templateId: id });
      return template;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_pack_template_by_id',
        service: 'admin',
        templateId: id
      });
      
      logger.error('Failed to fetch pack template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        templateId: id
      });
      
      throw new DatabaseError('Failed to fetch pack template', { templateId: id });
    }
  },

  async createPackTemplate(templateData: CreatePackTemplateData): Promise<PackTemplate> {
    // Move validation BEFORE try/catch - check all required fields first
    const missingFields = [];
    if (!templateData.name) {
      missingFields.push('name');
    }
    if (templateData.size === undefined || templateData.size === null) {
      missingFields.push('size');
    }
    if (templateData.price === undefined) {
      missingFields.push('price');
    }
    
    if (missingFields.length > 0) {
      throw new Error('Name, size, and price are required');
    }
    
    // Then validate values
    if (templateData.size <= 0) {
      throw new Error('Size must be positive');
    }
    
    if (templateData.price < 0) {
      throw new Error('Price must be non-negative');
    }
    
    try {
      logger.info('Creating new pack template', { 
        name: templateData.name,
        size: templateData.size,
        price: templateData.price
      });
      
      const result = await db.query<PackTemplateRow>(
        `INSERT INTO meal_pack_templates (name, size, price, description, is_active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          templateData.name, 
          templateData.size, 
          templateData.price, 
          templateData.description, 
          templateData.is_active ?? true
        ]
      );
      
      const template: PackTemplate = result.rows[0] as PackTemplate; // Type assertion
      logger.info('Pack template created successfully', { templateId: template.id });
      
      return template;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_create_pack_template',
        service: 'admin',
        templateData: { 
          name: templateData.name,
          size: templateData.size,
          price: templateData.price
        }
      });
      
      logger.error('Failed to create pack template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        templateData: { 
          name: templateData.name,
          size: templateData.size,
          price: templateData.price
        }
      });
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create pack template', { 
        name: templateData.name 
      });
    }
  },

  async updatePackTemplate(id: string, data: UpdatePackTemplateData): Promise<PackTemplate> {
    // Move validation BEFORE try/catch
    const fields = Object.keys(data);
    if (fields.length === 0) {
      throw new Error('No data provided for update');
    }
    
    // Validate numeric fields if present
    if (data.size !== undefined && data.size <= 0) {
      throw new Error('Size must be positive');
    }
    
    if (data.price !== undefined && data.price < 0) {
      throw new Error('Price must be non-negative');
    }
    
    try {
      logger.info('Updating pack template', { templateId: id, updateFields: Object.keys(data) });
      
      const values = Object.values(data);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await db.query<PackTemplateRow>(
        `UPDATE meal_pack_templates SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Pack template not found for update', { templateId: id });
        throw new Error('Pack template not found');
      }
      
      const template: PackTemplate = result.rows[0] as PackTemplate; // Type assertion
      logger.info('Pack template updated successfully', { templateId: id });
      
      return template;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_pack_template',
        service: 'admin',
        templateId: id,
        updateFields: Object.keys(data)
      });
      
      logger.error('Failed to update pack template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        templateId: id,
        updateFields: Object.keys(data)
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'No data provided for update' ||
           error.message === 'Size must be positive' ||
           error.message === 'Price must be non-negative' ||
           error.message === 'Pack template not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update pack template', { templateId: id });
    }
  },

  async deletePackTemplate(id: string): Promise<PackTemplate> {
    try {
      logger.info('Deleting pack template', { templateId: id });
      
      const result = await db.query<PackTemplateRow>(
        'DELETE FROM meal_pack_templates WHERE id = $1 RETURNING *', 
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Pack template not found for deletion', { templateId: id });
        throw new Error('Pack template not found');
      }
      
      const template: PackTemplate = result.rows[0] as PackTemplate; // Type assertion
      logger.info('Pack template deleted successfully', { templateId: id });
      
      return template;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_delete_pack_template',
        service: 'admin',
        templateId: id
      });
      
      logger.error('Failed to delete pack template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        templateId: id
      });
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete pack template', { templateId: id });
    }
  },

  // Pack Sales
  async getAllPackSales(filters?: PackSaleFilters): Promise<PackSale[]> {
    try {
      logger.info('Fetching all pack sales for admin', { filters });
      
      let query = `
        SELECT 
          ps.*,
          pt.name as template_name,
          u.name as user_name,
          u.email as user_email
        FROM pack_sales ps
        JOIN meal_pack_templates pt ON ps.template_id = pt.id
        JOIN users u ON ps.user_id = u.id
        WHERE 1=1
      `;
      
      const params: unknown[] = [];
      let paramIndex = 1;

      if (filters?.templateId) {
        query += ` AND ps.template_id = $${paramIndex}`;
        params.push(filters.templateId);
        paramIndex++;
      }

      if (filters?.status) {
        query += ` AND ps.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND ps.purchase_date >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND ps.purchase_date <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` ORDER BY ps.purchase_date DESC`;

      const result = await db.query<PackSaleRow>(query, params);
      
      logger.info('Pack sales fetched successfully', { count: result.rows.length, filters });
      return result.rows as PackSale[]; // Type assertion
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_all_pack_sales',
        service: 'admin',
        filters
      });
      
      logger.error('Failed to fetch pack sales', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      
      throw new DatabaseError('Failed to fetch pack sales', { filters });
    }
  },

  async getPackSaleById(id: string): Promise<PackSale | null> {
    try {
      logger.info('Fetching pack sale by ID for admin', { saleId: id });
      
      const result = await db.query<PackSaleRow>(
        `SELECT ps.*, pt.name as template_name, u.name as user_name, u.email as user_email
         FROM pack_sales ps
         JOIN meal_pack_templates pt ON ps.template_id = pt.id
         JOIN users u ON ps.user_id = u.id
         WHERE ps.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.info('Pack sale not found', { saleId: id });
        return null;
      }
      
      const sale: PackSale = result.rows[0] as PackSale; // Type assertion
      logger.info('Pack sale fetched successfully', { saleId: id });
      return sale;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_pack_sale_by_id',
        service: 'admin',
        saleId: id
      });
      
      logger.error('Failed to fetch pack sale', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        saleId: id
      });
      
      throw new DatabaseError('Failed to fetch pack sale', { saleId: id });
    }
  },

  async getPackSalesStats(): Promise<PackSalesStats> {
    try {
      logger.debug('Fetching pack sales statistics for admin dashboard');
      
      const result = await db.query<PackSalesStatsRow>(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(price_paid), 0) as total_revenue,
          COALESCE(AVG(price_paid), 0) as average_price,
          COUNT(DISTINCT user_id) as unique_customers
        FROM pack_sales
        WHERE status IN ('active', 'used')
      `);
      
      const stats: PackSalesStats = result.rows[0] as PackSalesStats; // Type assertion
      logger.debug('Pack sales statistics fetched', { stats });
      
      return stats;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_pack_sales_stats',
        service: 'admin'
      });
      
      logger.error('Failed to fetch pack sales statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new DatabaseError('Failed to fetch pack sales statistics');
    }
  },

  async updatePackSaleStatus(id: string, status: string): Promise<PackSale> {
    try {
      logger.info('Updating pack sale status', { saleId: id, newStatus: status });
      
      const result = await db.query<PackSaleRow>(
        `UPDATE pack_sales SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Pack sale not found for status update', { saleId: id, status });
        throw new Error('Pack sale not found');
      }
      
      const sale: PackSale = result.rows[0] as PackSale; // Type assertion
      logger.info('Pack sale status updated successfully', { 
        saleId: id, 
        oldStatus: sale.status,
        newStatus: status 
      });
      
      return sale;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_pack_sale_status',
        service: 'admin',
        saleId: id,
        status
      });
      
      logger.error('Failed to update pack sale status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        saleId: id,
        status
      });
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update pack sale status', { saleId: id });
    }
  }
};
