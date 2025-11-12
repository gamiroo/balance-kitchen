// middleware.test.ts
import { withAuth } from "next-auth/middleware";
import middleware, { config } from './middleware';

// Mock next-auth/middleware
jest.mock("next-auth/middleware", () => ({
  withAuth: jest.fn((middlewareConfig) => {
    // Return a mock middleware function that captures the config
    return Object.assign(
      function mockMiddleware() {},
      { _testConfig: middlewareConfig }
    );
  })
}));

describe('middleware', () => {
  describe('withAuth configuration', () => {
    it('should configure withAuth with correct pages', () => {
      // ASSERT
      const mockWithAuth = withAuth as jest.Mock;
      expect(mockWithAuth).toHaveBeenCalledWith({
        pages: {
          signIn: "/login",
        },
        callbacks: {
          authorized: expect.any(Function),
        },
      });
    });

    it('should have correct matcher configuration', () => {
      // ASSERT
      expect(config).toEqual({
        matcher: ["/admin/:path*", "/backend/:path*"],
      });
    });
  });

  describe('authorized callback', () => {
    let authorizedCallback: Function;

    beforeEach(() => {
      const mockWithAuth = withAuth as jest.Mock;
      const mockMiddleware = mockWithAuth.mock.results[0].value;
      authorizedCallback = mockMiddleware._testConfig.callbacks.authorized;
    });

    it('should allow admin access to admin routes for admin users', async () => {
      // ARRANGE
      const params = {
        token: { role: 'admin' },
        req: {
          nextUrl: {
            pathname: '/admin/dashboard'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should deny admin access to admin routes for non-admin users', async () => {
      // ARRANGE
      const params = {
        token: { role: 'user' },
        req: {
          nextUrl: {
            pathname: '/admin/dashboard'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should deny admin access to admin routes for users without role', async () => {
      // ARRANGE
      const params = {
        token: {},
        req: {
          nextUrl: {
            pathname: '/admin/dashboard'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should allow access to admin routes for users with admin role', async () => {
      // ARRANGE
      const params = {
        token: { role: 'admin' },
        req: {
          nextUrl: {
            pathname: '/admin/users'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should allow access to backend routes for authenticated users', async () => {
      // ARRANGE
      const params = {
        token: { id: 'user-123' },
        req: {
          nextUrl: {
            pathname: '/backend/dashboard'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should deny access to backend routes for unauthenticated users', async () => {
      // ARRANGE
      const params = {
        token: null,
        req: {
          nextUrl: {
            pathname: '/backend/dashboard'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should allow access to other protected routes for authenticated users', async () => {
      // ARRANGE
      const params = {
        token: { id: 'user-123' },
        req: {
          nextUrl: {
            pathname: '/profile'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should deny access to other protected routes for unauthenticated users', async () => {
      // ARRANGE
      const params = {
        token: null,
        req: {
          nextUrl: {
            pathname: '/profile'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should handle undefined token gracefully', async () => {
      // ARRANGE
      const params = {
        token: undefined,
        req: {
          nextUrl: {
            pathname: '/admin/dashboard'
          }
        }
      };

      // ACT
      const result = await authorizedCallback(params);

      // ASSERT
      expect(result).toBe(false);
    });
  });
});
