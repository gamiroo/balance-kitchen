// lib/api/admin/client.test.ts
import { getServerSession } from "next-auth";
import { adminApi } from './client';
import { captureErrorSafe } from '../../utils/error-utils';
import { logger } from '../../logging/logger';

// Mock dependencies
jest.mock("next-auth");
jest.mock('../../utils/error-utils');
jest.mock('../../logging/logger');

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminApiClient', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      role: 'admin'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getHeaders', () => {
    it('should return headers with user ID when session exists', async () => {
      // ACT
      const headers = await (adminApi as any).getHeaders();

      // ASSERT
      expect(headers).toEqual({
        "Content-Type": "application/json",
        "X-User-ID": "user-123"
      });
    });

    it('should return headers without user ID when no session', async () => {
      // ARRANGE
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // ACT
      const headers = await (adminApi as any).getHeaders();

      // ASSERT
      expect(headers).toEqual({
        "Content-Type": "application/json"
      });
    });
  });

  describe('handleResponse', () => {
    it('should handle successful responses', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        url: 'http://test.com/api/test'
      };

      // ACT
      const result = await (adminApi as any).handleResponse(mockResponse);

      // ASSERT
      expect(result).toEqual({ data: 'test' });
      expect(logger.debug).toHaveBeenCalledWith('API request successful', {
        status: undefined,
        url: 'http://test.com/api/test'
      });
    });

    it('should handle error responses', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 400,
        url: 'http://test.com/api/test',
        json: jest.fn().mockResolvedValue({ error: 'Bad Request' })
      };

      // ACT & ASSERT
      await expect((adminApi as any).handleResponse(mockResponse)).rejects.toThrow('Bad Request');
      expect(logger.warn).toHaveBeenCalledWith('API request failed', {
        status: 400,
        url: 'http://test.com/api/test',
        error: 'Bad Request'
      });
    });

    it('should handle error responses with message field', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 404,
        url: 'http://test.com/api/test',
        json: jest.fn().mockResolvedValue({ message: 'Not Found' })
      };

      // ACT & ASSERT
      await expect((adminApi as any).handleResponse(mockResponse)).rejects.toThrow('Not Found');
    });

    it('should handle error responses with default message', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 500,
        url: 'http://test.com/api/test',
        json: jest.fn().mockResolvedValue({})
      };

      // ACT & ASSERT
      await expect((adminApi as any).handleResponse(mockResponse)).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle JSON parsing errors', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        url: 'http://test.com/api/test',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      // ACT & ASSERT
      await expect((adminApi as any).handleResponse(mockResponse)).rejects.toThrow('Invalid JSON');
      expect(logger.error).toHaveBeenCalledWith('API response handling failed', {
        error: 'Invalid JSON',
        stack: expect.any(String),
        url: 'http://test.com/api/test',
        status: undefined
      });
    });
  });

  describe('makeRequest', () => {
    it('should make successful API requests', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await (adminApi as any).makeRequest('/api/test', { method: 'GET' });

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "user-123"
        }
      });
      expect(logger.debug).toHaveBeenCalledWith('Making API request', {
        method: 'GET',
        url: '/api/test',
        hasBody: false
      });
    });

    it('should handle fetch errors', async () => {
      // ARRANGE
      const error = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(error);

      // ACT & ASSERT
      await expect((adminApi as any).makeRequest('/api/test')).rejects.toThrow('Network error');
      expect(captureErrorSafe).toHaveBeenCalledWith(error, {
        action: 'admin_api_request',
        url: '/api/test',
        method: 'GET'
      });
      expect(logger.error).toHaveBeenCalledWith('API request failed', {
        error: 'Network error',
        stack: error.stack,
        url: '/api/test',
        method: 'GET'
      });
    });
  });

  describe('Menu operations', () => {
    it('should get menus with filters', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ menus: [] })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.getMenus({ published: true, startDate: '2023-01-01' });

      // ASSERT
      expect(result).toEqual({ menus: [] });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus?published=true&startDate=2023-01-01', expect.any(Object));
    });

    it('should get menu by ID', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'menu-123' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.getMenu('menu-123');

      // ASSERT
      expect(result).toEqual({ id: 'menu-123' });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus/menu-123', expect.any(Object));
    });

    it('should throw error when menu ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminApi.getMenu('')).rejects.toThrow('Menu ID is required');
    });

    it('should create menu', async () => {
      // ARRANGE
      const menuData = {
        week_start_date: '2023-01-01',
        week_end_date: '2023-01-07',
        created_by: 'user-123'
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'menu-123', ...menuData })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.createMenu(menuData);

      // ASSERT
      expect(result).toEqual({ id: 'menu-123', ...menuData });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(menuData)
      });
    });

    it('should update menu', async () => {
      // ARRANGE
      const updateData = { is_published: true };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'menu-123', ...updateData })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.updateMenu('menu-123', updateData);

      // ASSERT
      expect(result).toEqual({ id: 'menu-123', ...updateData });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus/menu-123', {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(updateData)
      });
    });

    it('should delete menu', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.deleteMenu('menu-123');

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus/menu-123', {
        method: 'DELETE',
        headers: expect.any(Object)
      });
    });

    it('should publish menu', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.publishMenu('menu-123');

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus/menu-123/publish', {
        method: 'POST',
        headers: expect.any(Object)
      });
    });

    it('should unpublish menu', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.unpublishMenu('menu-123');

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus/menu-123/unpublish', {
        method: 'POST',
        headers: expect.any(Object)
      });
    });
  });

  describe('Pack template operations', () => {
    it('should get pack templates with filters', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ templates: [] })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.getPackTemplates({ active: true });

      // ASSERT
      expect(result).toEqual({ templates: [] });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/packs/templates?active=true', expect.any(Object));
    });

    it('should create pack template with validation', async () => {
      // ARRANGE
      const templateData = {
        name: 'Test Pack',
        size: 10,
        price: 50
      };

      // ACT & ASSERT
      await expect(adminApi.createPackTemplate({
        name: '',
        size: 10,
        price: 50
      } as any)).rejects.toThrow('Name, size, and price are required');

      await expect(adminApi.createPackTemplate({
        name: 'Test Pack',
        size: 0,
        price: 50
      } as any)).rejects.toThrow('Name, size, and price are required');
    });

    it('should update pack template', async () => {
      // ARRANGE
      const updateData = { name: 'Updated Pack' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'template-123', ...updateData })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.updatePackTemplate('template-123', updateData);

      // ASSERT
      expect(result).toEqual({ id: 'template-123', ...updateData });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/packs/templates/template-123', {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(updateData)
      });
    });

    it('should throw error when pack template ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminApi.updatePackTemplate('', { name: 'Test' })).rejects.toThrow('Pack template ID is required');
    });
  });

  describe('Order operations', () => {
    it('should update order status with validation', async () => {
      // ACT & ASSERT
      await expect(adminApi.updateOrderStatus('order-123', '')).rejects.toThrow('Status is required');
      await expect(adminApi.updateOrderStatus('order-123', 'invalid')).rejects.toThrow(
        'Invalid status. Must be one of: pending, confirmed, delivered, cancelled'
      );
    });

    it('should update order status successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.updateOrderStatus('order-123', 'confirmed');

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/orders/order-123/status', {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify({ status: 'confirmed' })
      });
    });

    it('should bulk update orders with validation', async () => {
      // ACT & ASSERT
      await expect(adminApi.bulkUpdateOrders([], 'confirmed')).rejects.toThrow('Order IDs are required');
      await expect(adminApi.bulkUpdateOrders(['order-123'], '')).rejects.toThrow('Status is required');
      await expect(adminApi.bulkUpdateOrders(['order-123'], 'invalid')).rejects.toThrow(
        'Invalid status. Must be one of: pending, confirmed, delivered, cancelled'
      );
    });

    it('should bulk update orders successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.bulkUpdateOrders(['order-123', 'order-456'], 'confirmed');

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify({ orderIds: ['order-123', 'order-456'], status: 'confirmed' })
      });
    });
  });

  describe('User operations', () => {
    it('should update user role with validation', async () => {
      // ACT & ASSERT
      await expect(adminApi.updateUserRole('user-123', '')).rejects.toThrow('Role is required');
      await expect(adminApi.updateUserRole('user-123', 'invalid')).rejects.toThrow(
        'Invalid role. Must be one of: user, admin'
      );
    });

    it('should update user role successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.updateUserRole('user-123', 'admin');

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-123/role', {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify({ role: 'admin' })
      });
    });

    it('should update user status successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.updateUserStatus('user-123', false);

      // ASSERT
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-123/status', {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify({ is_active: false })
      });
    });

    it('should throw error when user ID is missing', async () => {
      // ACT & ASSERT
      await expect(adminApi.updateUserStatus('', true)).rejects.toThrow('User ID is required');
    });
  });

  describe('Stats operations', () => {
    it('should get dashboard stats', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ orders: 100, revenue: 5000 })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.getDashboardStats();

      // ASSERT
      expect(result).toEqual({ orders: 100, revenue: 5000 });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats', expect.any(Object));
    });

    it('should get recent orders with limit', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ orders: [] })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.getRecentOrders(10);

      // ASSERT
      expect(result).toEqual({ orders: [] });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/recent-orders?limit=10', expect.any(Object));
    });

    it('should get menu status', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ published: 5, draft: 2 })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const result = await adminApi.getMenuStatus();

      // ASSERT
      expect(result).toEqual({ published: 5, draft: 2 });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/menus/status', expect.any(Object));
    });
  });
});
