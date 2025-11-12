// lib/api/admin/client.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth";
import { captureErrorSafe } from '../../utils/error-utils';
import { logger } from '../../logging/logger';

interface ApiError extends Error {
  status?: number;
  response?: unknown;
}

// Define interfaces for data structures
interface CreateMenuData {
  week_start_date: string;
  week_end_date: string;
  created_by: string;
}

interface UpdateMenuData {
  week_start_date?: string;
  week_end_date?: string;
  is_published?: boolean;
}

interface CreatePackTemplateData {
  name: string;
  size: number;
  price: number;
  description?: string;
  is_active?: boolean;
}

interface UpdatePackTemplateData {
  name?: string;
  size?: number;
  price?: number;
  description?: string;
  is_active?: boolean;
}

interface BulkUpdateOrdersData {
  orderIds: string[];
  status: string;
}

interface UpdateUserRoleData {
  role: string;
}

interface UpdateUserStatusData {
  is_active: boolean;
}

class AdminApiClient {
  private baseUrl = "/api/admin";

  private async getHeaders() {
    const session = await getServerSession(authOptions);
    return {
      "Content-Type": "application/json",
      ...(session?.user?.id ? { "X-User-ID": session.user.id } : {}),
    };
  }

  private async handleResponse(response: Response) {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage) as ApiError;
        error.status = response.status;
        error.response = data;
        logger.warn('API request failed', {
          status: response.status,
          url: response.url,
          error: errorMessage
        });
        throw error;
      }
      
      logger.debug('API request successful', {
        status: response.status,
        url: response.url
      });
      
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('API response handling failed', {
          error: error.message,
          stack: error.stack,
          url: response.url,
          status: response.status
        });
      }
      throw error;
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      const headers = await this.getHeaders();
      const config = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      };
      
      logger.debug('Making API request', {
        method: options.method || 'GET',
        url,
        hasBody: !!options.body
      });
      
      const response = await fetch(url, config);
      return this.handleResponse(response);
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'admin_api_request',
        url,
        method: options.method || 'GET'
      });
      
      logger.error('API request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url,
        method: options.method || 'GET'
      });
      
      throw error;
    }
  }

  // Menus
  async getMenus(filters?: { published?: boolean; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.published !== undefined) params.append("published", filters.published.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    
    return this.makeRequest(`${this.baseUrl}/menus?${params}`);
  }

  async getMenu(id: string) {
    if (!id) {
      throw new Error('Menu ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/menus/${encodeURIComponent(id)}`);
  }

  async createMenu(data: CreateMenuData) {
    return this.makeRequest(`${this.baseUrl}/menus`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMenu(id: string, data: UpdateMenuData) {
    if (!id) {
      throw new Error('Menu ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/menus/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMenu(id: string) {
    if (!id) {
      throw new Error('Menu ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/menus/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async publishMenu(id: string) {
    if (!id) {
      throw new Error('Menu ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/menus/${encodeURIComponent(id)}/publish`, {
      method: "POST",
    });
  }

  async unpublishMenu(id: string) {
    if (!id) {
      throw new Error('Menu ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/menus/${encodeURIComponent(id)}/unpublish`, {
      method: "POST",
    });
  }

  // Packs
  async getPackTemplates(filters?: { active?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.active !== undefined) params.append("active", filters.active.toString());
    
    return this.makeRequest(`${this.baseUrl}/packs/templates?${params}`);
  }

  async getPackTemplate(id: string) {
    if (!id) {
      throw new Error('Pack template ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/packs/templates/${encodeURIComponent(id)}`);
  }

  async createPackTemplate(data: CreatePackTemplateData) {
    // Validate required fields
    if (!data.name || !data.size || data.price === undefined) {
      throw new Error('Name, size, and price are required');
    }
    
    return this.makeRequest(`${this.baseUrl}/packs/templates`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePackTemplate(id: string, data: UpdatePackTemplateData) {
    if (!id) {
      throw new Error('Pack template ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/packs/templates/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePackTemplate(id: string) {
    if (!id) {
      throw new Error('Pack template ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/packs/templates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // Orders
  async getOrders(filters?: { status?: string; userId?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    
    return this.makeRequest(`${this.baseUrl}/orders?${params}`);
  }

  async getOrder(id: string) {
    if (!id) {
      throw new Error('Order ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/orders/${encodeURIComponent(id)}`);
  }

  async updateOrderStatus(id: string, status: string) {
    if (!id) {
      throw new Error('Order ID is required');
    }
    if (!status) {
      throw new Error('Status is required');
    }
    
    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    return this.makeRequest(`${this.baseUrl}/orders/${encodeURIComponent(id)}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async bulkUpdateOrders(orderIds: string[], status: string) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs are required');
    }
    if (!status) {
      throw new Error('Status is required');
    }
    
    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    return this.makeRequest(`${this.baseUrl}/orders/bulk-update`, {
      method: "POST",
      body: JSON.stringify({ orderIds, status } as BulkUpdateOrdersData),
    });
  }

  // Users
  async getUsers(filters?: { role?: string; active?: boolean; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.active !== undefined) params.append("active", filters.active.toString());
    if (filters?.search) params.append("search", filters.search);
    
    return this.makeRequest(`${this.baseUrl}/users?${params}`);
  }

  async getUser(id: string) {
    if (!id) {
      throw new Error('User ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/users/${encodeURIComponent(id)}`);
  }

  async updateUserRole(id: string, role: string) {
    if (!id) {
      throw new Error('User ID is required');
    }
    if (!role) {
      throw new Error('Role is required');
    }
    
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    return this.makeRequest(`${this.baseUrl}/users/${encodeURIComponent(id)}/role`, {
      method: "PUT",
      body: JSON.stringify({ role } as UpdateUserRoleData),
    });
  }

  async updateUserStatus(id: string, is_active: boolean) {
    if (!id) {
      throw new Error('User ID is required');
    }
    
    return this.makeRequest(`${this.baseUrl}/users/${encodeURIComponent(id)}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active } as UpdateUserStatusData),
    });
  }

  async deleteUser(id: string) {
    if (!id) {
      throw new Error('User ID is required');
    }
    return this.makeRequest(`${this.baseUrl}/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // Stats
  async getDashboardStats() {
    return this.makeRequest(`${this.baseUrl}/stats`);
  }

  async getRecentOrders(limit?: number) {
    const params = new URLSearchParams();
    if (limit && limit > 0 && limit <= 100) params.append("limit", limit.toString());
    
    return this.makeRequest(`${this.baseUrl}/recent-orders?${params}`);
  }

  async getMenuStatus() {
    return this.makeRequest(`${this.baseUrl}/menus/status`);
  }
}

export const adminApi = new AdminApiClient();
