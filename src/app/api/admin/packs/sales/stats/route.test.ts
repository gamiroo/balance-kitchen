import { GET } from './route'
import { getServerSession } from "next-auth"
import { adminPackService } from "../../../../../../lib/services/admin/packService"
import { captureErrorSafe } from '../../../../../../lib/utils/error-utils'
import { logger } from '../../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../../lib/logging/audit-logger'

// Mock external dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("../../../../../../lib/auth/auth", () => ({
  authOptions: {}
}))

jest.mock("../../../../../../lib/services/admin/packService", () => ({
  adminPackService: {
    getPackSalesStats: jest.fn()
  }
}))

jest.mock('../../../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}))

describe('GET /api/admin/packs/sales/stats', () => {
  // Store original values
  const originalUrl = globalThis.URL;
  const originalRequest = globalThis.Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    globalThis.URL = originalUrl;
    globalThis.Request = originalRequest;
  });

  it('should return 401 when user is not authenticated', async () => {
    // ARRANGE
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Mock URL constructor to return our test URL
    const mockUrl = {
      searchParams: {
        get: jest.fn().mockReturnValue(null)
      }
    };
    globalThis.URL = jest.fn().mockImplementation(() => mockUrl) as unknown as typeof URL;


    // ACT
    const response = await GET();
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(401);
    expect(data).toEqual({ 
      success: false,
      error: "Unauthorized" 
    });
    expect(logger.warn).toHaveBeenCalledWith('Unauthorized access attempt to pack sales stats');  // Fixed to match actual implementation
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'ACCESS_PACK_SALES_STATS',
      'packs',
      'UNAUTHORIZED'
    );
  });

  it('should return 403 when user is not admin', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user'
      }
    };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    // Mock URL constructor to return our test URL
    const mockUrl = {
      searchParams: {
        get: jest.fn().mockReturnValue(null)
      }
    };
    globalThis.URL = jest.fn().mockImplementation(() => mockUrl) as unknown as typeof URL;


    // ACT
    const response = await GET();
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(403);
    expect(data).toEqual({ 
      success: false,
      error: "Forbidden" 
    });
    expect(logger.warn).toHaveBeenCalledWith('Forbidden access attempt to pack sales stats', {  // Fixed to match actual implementation
      userId: 'user-123',
      userRole: 'user' 
    });
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      'user-123',
      'ACCESS_PACK_SALES_STATS',
      'packs',
      'FORBIDDEN',
      { userRole: 'user' }
    );
  });

  it('should return pack sales stats successfully for admin user', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const mockStats = {
      totalSales: 150,
      totalRevenue: 7500.00,
      averagePrice: 50.00,
      salesByTemplate: [
        { template_id: 'template-1', template_name: 'Weekly Pack', count: 100, revenue: 5000.00 },
        { template_id: 'template-2', template_name: 'Monthly Pack', count: 50, revenue: 2500.00 }
      ]
    };

    (adminPackService.getPackSalesStats as jest.Mock).mockResolvedValue(mockStats);

    // Mock URL constructor to return our test URL
    const mockUrl = {
      searchParams: {
        get: jest.fn().mockReturnValue(null)  // No query params for this test
      }
    };
    globalThis.URL = jest.fn().mockImplementation(() => mockUrl) as unknown as typeof URL;


    // ACT
    const response = await GET();
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockStats);
    expect(logger.info).toHaveBeenCalledWith('Admin accessing pack sales statistics', {  // This matches the implementation
      userId: 'admin-123',
      userEmail: 'admin@example.com' 
    });
    expect(logger.debug).toHaveBeenCalledWith('Pack sales statistics fetched successfully', {  // This matches the implementation
      userId: 'admin-123',
      stats: mockStats  // The implementation logs the stats object
    });
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      'admin-123',
      'FETCH_PACK_SALES_STATS',
      'packs',
      { stats: mockStats }  // The implementation logs the stats object
    );
  });

  it('should handle empty pack sales stats', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const mockStats = { totalSales: 0, totalRevenue: 0, averagePrice: 0, salesByTemplate: [] };
    (adminPackService.getPackSalesStats as jest.Mock).mockResolvedValue(mockStats);

    // Mock URL constructor to return our test URL
    const mockUrl = {
      searchParams: {
        get: jest.fn().mockReturnValue(null)
      }
    };
    globalThis.URL = jest.fn().mockImplementation(() => mockUrl) as unknown as typeof URL;


    // ACT
    const response = await GET();
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockStats);
  });

  it('should handle service error gracefully', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const serviceError = new Error('Database connection failed');
    (adminPackService.getPackSalesStats as jest.Mock).mockRejectedValue(serviceError);

    // Mock URL constructor to return our test URL
    const mockUrl = {
      searchParams: {
        get: jest.fn().mockReturnValue(null)
      }
    };
    globalThis.URL = jest.fn().mockImplementation(() => mockUrl) as unknown as typeof URL;


    // ACT
    const response = await GET();
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Failed to fetch pack sales statistics. Please try again.");
    expect(captureErrorSafe).toHaveBeenCalledWith(serviceError, {
      action: 'admin_get_pack_sales_stats',
      service: 'admin',
      endpoint: '/api/admin/packs/sales/stats',
      userId: 'admin-123'  // This will be the resolved session user ID
    });
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch pack sales statistics', {  // This matches the implementation
      error: 'Error: Database connection failed',
      stack: serviceError.stack
    });
  });
});
