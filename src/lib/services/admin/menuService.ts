// lib/services/admin/menuService.ts
import { db } from "../../../lib/database/client";
import { captureErrorSafe } from '../../../lib/utils/error-utils';
import { logger } from '../../../lib/logging/logger';
import { DatabaseError } from '../../../lib/errors/system-errors';
import { AuditLogger } from '../../../lib/logging/audit-logger';

// Define database row interfaces
interface MenuRow {
  id: string;
  week_start_date: Date;
  week_end_date: Date;
  created_by: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  created_by_name?: string;
  item_count: number;
  [key: string]: unknown;
}

interface MenuItemRow {
  id: string;
  menu_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  nutritional_info?: string;
  ingredients?: string;
  allergens?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown;
}

// Define business logic interfaces
interface MenuFilters {
  published?: boolean;
  startDate?: string;
  endDate?: string;
}

interface Menu {
  id: string;
  week_start_date: Date;
  week_end_date: Date;
  created_by: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  created_by_name?: string;
  item_count: number;
}

interface MenuItem {
  id: string;
  menu_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  nutritional_info?: string;
  ingredients?: string;
  allergens?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateMenuData {
  week_start_date: string;
  week_end_date: string;
  created_by: string;
}

interface UpdateMenuData {
  week_start_date?: Date;
  week_end_date?: Date;
  is_published?: boolean;
  updated_by?: string;
}

interface CreateMenuItemData {
  id: string;
  menu_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  nutritional_info?: string;
  ingredients?: string;
  allergens?: string;
  created_by: string;
}

interface UpdateMenuItemData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_available?: boolean;
  image_url?: string;
  nutritional_info?: string;
  ingredients?: string;
  allergens?: string;
  updated_by?: string;
}

export const adminMenuService = {
  async getAllMenus(filters?: MenuFilters): Promise<Menu[]> {
    try {
      logger.info('Fetching all menus for admin', { filters });
      
      let query = `
        SELECT 
          m.*,
          u.name as created_by_name,
          COUNT(mi.id) as item_count
        FROM menus m
        LEFT JOIN users u ON m.created_by = u.id
        LEFT JOIN menu_items mi ON m.id = mi.menu_id
        WHERE 1=1
      `;
      
      const params: unknown[] = [];
      let paramIndex = 1;

      if (filters?.published !== undefined) {
        query += ` AND m.is_published = $${paramIndex}`;
        params.push(filters.published);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND m.week_start_date >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND m.week_end_date <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` GROUP BY m.id, u.name ORDER BY m.week_start_date DESC`;

      const result = await db.query<MenuRow>(query, params);
      
      logger.info('Menus fetched successfully', { count: result.rows.length, filters });
      return result.rows as Menu[]; // Type assertion since MenuRow extends Menu
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_all_menus',
        service: 'admin',
        filters
      });
      
      logger.error('Failed to fetch menus', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      
      throw new DatabaseError('Failed to fetch menus', { filters });
    }
  },

  async getMenuById(id: string): Promise<(Menu & { items: MenuItem[] }) | null> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu ID is required');
    }
    
    try {
      logger.info('Fetching menu by ID for admin', { menuId: id });
      
      const menuResult = await db.query<MenuRow>(
        `SELECT m.*, u.name as created_by_name 
         FROM menus m 
         LEFT JOIN users u ON m.created_by = u.id 
         WHERE m.id = $1`,
        [id]
      );

      if (menuResult.rows.length === 0) {
        logger.info('Menu not found', { menuId: id });
        return null;
      }

      const itemsResult = await db.query<MenuItemRow>(
        `SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY category, name`,
        [id]
      );

      const menu = {
        ...menuResult.rows[0],
        items: itemsResult.rows as MenuItem[] // Type assertion
      };
      
      logger.info('Menu details fetched successfully', { menuId: id });
      return menu as Menu & { items: MenuItem[] };
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_get_menu_by_id',
        service: 'admin',
        menuId: id
      });
      
      logger.error('Failed to fetch menu details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message === 'Menu ID is required') {
        throw error;
      }
      
      throw new DatabaseError('Failed to fetch menu details', { menuId: id });
    }
  },

  async createMenu(menuData: CreateMenuData): Promise<Menu> {
    // Move validation BEFORE try/catch
    if (!menuData.week_start_date || !menuData.week_end_date || !menuData.created_by) {
      throw new Error('Week start date, end date, and creator are required');
    }
    
    try {
      logger.info('Creating new menu', { 
        createdBy: menuData.created_by,
        startDate: menuData.week_start_date,
        endDate: menuData.week_end_date
      });
      
      const result = await db.query<MenuRow>(
        `INSERT INTO menus (week_start_date, week_end_date, created_by, is_published) 
         VALUES ($1, $2, $3, false) 
         RETURNING *`,
        [menuData.week_start_date, menuData.week_end_date, menuData.created_by]
      );
      
      const menu: Menu = result.rows[0] as Menu; // Type assertion
      logger.info('Menu created successfully', { menuId: menu.id });
      
      AuditLogger.logUserAction(
        menuData.created_by,
        'CREATE_MENU',
        'menus',
        { menuId: menu.id }
      );
      
      return menu;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_create_menu',
        service: 'admin',
        menuData
      });
      
      logger.error('Failed to create menu', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuData
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message === 'Week start date, end date, and creator are required') {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create menu', { 
        startDate: menuData.week_start_date 
      });
    }
  },

  async updateMenu(id: string, data: UpdateMenuData): Promise<Menu> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu ID is required');
    }
    
    const fields = Object.keys(data);
    if (fields.length === 0) {
      throw new Error('No data provided for update');
    }
    
    try {
      logger.info('Updating menu', { menuId: id, updateFields: Object.keys(data) });
      
      const values = Object.values(data);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await db.query<MenuRow>(
        `UPDATE menus SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Menu not found for update', { menuId: id });
        throw new Error('Menu not found');
      }
      
      const menu: Menu = result.rows[0] as Menu; // Type assertion
      logger.info('Menu updated successfully', { menuId: id });
      
      AuditLogger.logUserAction(
        data.updated_by || 'unknown',
        'UPDATE_MENU',
        'menus',
        { menuId: id }
      );
      
      return menu;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_menu',
        service: 'admin',
        menuId: id,
        updateFields: Object.keys(data)
      });
      
      logger.error('Failed to update menu', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuId: id,
        updateFields: Object.keys(data)
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'Menu ID is required' || 
           error.message === 'No data provided for update' ||
           error.message === 'Menu not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update menu', { menuId: id });
    }
  },

  async deleteMenu(id: string): Promise<Menu> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu ID is required');
    }
    
    try {
      logger.info('Deleting menu', { menuId: id });
      
      // First delete menu items
      const itemsResult = await db.query<{ id: string }>('DELETE FROM menu_items WHERE menu_id = $1 RETURNING id', [id]);
      logger.debug('Menu items deleted', { menuId: id, itemCount: itemsResult.rowCount });
      
      // Then delete menu
      const result = await db.query<MenuRow>('DELETE FROM menus WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        logger.warn('Menu not found for deletion', { menuId: id });
        throw new Error('Menu not found');
      }
      
      const menu: Menu = result.rows[0] as Menu; // Type assertion
      logger.info('Menu deleted successfully', { menuId: id });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'DELETE_MENU',
        'menus',
        { menuId: id, deletedItems: itemsResult.rowCount }
      );
      
      return menu;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_delete_menu',
        service: 'admin',
        menuId: id
      });
      
      logger.error('Failed to delete menu', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'Menu ID is required' || 
           error.message === 'Menu not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete menu', { menuId: id });
    }
  },

  async publishMenu(id: string): Promise<Menu> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu ID is required');
    }
    
    try {
      logger.info('Publishing menu', { menuId: id });
      
      const result = await db.query<MenuRow>(
        'UPDATE menus SET is_published = true, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Menu not found for publishing', { menuId: id });
        throw new Error('Menu not found');
      }
      
      const menu: Menu = result.rows[0] as Menu; // Type assertion
      logger.info('Menu published successfully', { menuId: id });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'PUBLISH_MENU',
        'menus',
        { menuId: id }
      );
      
      return menu;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_publish_menu',
        service: 'admin',
        menuId: id
      });
      
      logger.error('Failed to publish menu', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'Menu ID is required' || 
           error.message === 'Menu not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to publish menu', { menuId: id });
    }
  },

  async unpublishMenu(id: string): Promise<Menu> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu ID is required');
    }
    
    try {
      logger.info('Unpublishing menu', { menuId: id });
      
      const result = await db.query<MenuRow>(
        'UPDATE menus SET is_published = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Menu not found for unpublishing', { menuId: id });
        throw new Error('Menu not found');
      }
      
      const menu: Menu = result.rows[0] as Menu; // Type assertion
      logger.info('Menu unpublished successfully', { menuId: id });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'UNPUBLISH_MENU',
        'menus',
        { menuId: id }
      );
      
      return menu;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_unpublish_menu',
        service: 'admin',
        menuId: id
      });
      
      logger.error('Failed to unpublish menu', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'Menu ID is required' || 
           error.message === 'Menu not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to unpublish menu', { menuId: id });
    }
  },

  // Menu Items
  async createMenuItem(menuItemId: string, itemData: CreateMenuItemData): Promise<MenuItem> {
    try {
      logger.info('Creating menu item', { 
        menuItemId, 
        menuId: itemData.menu_id,
        name: itemData.name
      });
      
      const fields = ['id', 'menu_id', 'name', 'description', 'price', 'category', 'is_available', 'image_url', 'nutritional_info', 'ingredients', 'allergens', 'created_by'];
      
      // Create a record from the interface by explicitly mapping each field
      const values = fields.map(field => {
        switch (field) {
          case 'id': return itemData.id;
          case 'menu_id': return itemData.menu_id;
          case 'name': return itemData.name;
          case 'description': return itemData.description;
          case 'price': return itemData.price;
          case 'category': return itemData.category;
          case 'is_available': return itemData.is_available;
          case 'image_url': return itemData.image_url;
          case 'nutritional_info': return itemData.nutritional_info;
          case 'ingredients': return itemData.ingredients;
          case 'allergens': return itemData.allergens;
          case 'created_by': return itemData.created_by;
          default: return undefined;
        }
      });
      
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      
      const result = await db.query<MenuItemRow>(
        `INSERT INTO menu_items (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      
      const menuItem: MenuItem = result.rows[0] as MenuItem; // Type assertion
      logger.info('Menu item created successfully', { menuItemId: menuItem.id });
      
      AuditLogger.logUserAction(
        itemData.created_by || 'unknown',
        'CREATE_MENU_ITEM',
        'menu_items',
        { menuItemId: menuItem.id, menuId: itemData.menu_id }
      );
      
      return menuItem;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_create_menu_item',
        service: 'admin',
        menuItemId,
        itemData: { 
          menuId: itemData.menu_id,
          name: itemData.name,
          category: itemData.category
        }
      });
      
      logger.error('Failed to create menu item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuItemId,
        itemData: { 
          menuId: itemData.menu_id,
          name: itemData.name,
          category: itemData.category
        }
      });
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create menu item', { menuItemId });
    }
  },

  async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<MenuItem> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu item ID is required');
    }
    
    const fields = Object.keys(data);
    if (fields.length === 0) {
      throw new Error('No data provided for update');
    }
    
    try {
      logger.info('Updating menu item', { menuItemId: id, updateFields: Object.keys(data) });
      
      const values = Object.values(data);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await db.query<MenuItemRow>(
        `UPDATE menu_items SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      if (result.rows.length === 0) {
        logger.warn('Menu item not found for update', { menuItemId: id });
        throw new Error('Menu item not found');
      }
      
      const menuItem: MenuItem = result.rows[0] as MenuItem; // Type assertion
      logger.info('Menu item updated successfully', { menuItemId: id });
      
      AuditLogger.logUserAction(
        data.updated_by || 'unknown',
        'UPDATE_MENU_ITEM',
        'menu_items',
        { menuItemId: id }
      );
      
      return menuItem;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_update_menu_item',
        service: 'admin',
        menuItemId: id,
        updateFields: Object.keys(data)
      });
      
      logger.error('Failed to update menu item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuItemId: id,
        updateFields: Object.keys(data)
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'Menu item ID is required' || 
           error.message === 'No data provided for update' ||
           error.message === 'Menu item not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update menu item', { menuItemId: id });
    }
  },

  async deleteMenuItem(id: string): Promise<MenuItem> {
    // Move validation BEFORE try/catch
    if (!id) {
      throw new Error('Menu item ID is required');
    }
    
    try {
      logger.info('Deleting menu item', { menuItemId: id });
      
      const result = await db.query<MenuItemRow>('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        logger.warn('Menu item not found for deletion', { menuItemId: id });
        throw new Error('Menu item not found');
      }
      
      const menuItem: MenuItem = result.rows[0] as MenuItem; // Type assertion
      logger.info('Menu item deleted successfully', { menuItemId: id });
      
      AuditLogger.logUserAction(
        'unknown', // No user context available
        'DELETE_MENU_ITEM',
        'menu_items',
        { menuItemId: id }
      );
      
      return menuItem;
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_delete_menu_item',
        service: 'admin',
        menuItemId: id
      });
      
      logger.error('Failed to delete menu item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        menuItemId: id
      });
      
      // Re-throw validation errors as-is
      if (error instanceof Error && 
          (error.message === 'Menu item ID is required' || 
           error.message === 'Menu item not found')) {
        throw error;
      }
      
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete menu item', { menuItemId: id });
    }
  }
};
