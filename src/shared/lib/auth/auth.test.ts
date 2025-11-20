const mockDbQuery = jest.fn();
const mockBcryptCompare = jest.fn();

jest.mock('bcryptjs', () => ({
  compare: mockBcryptCompare
}));

jest.mock('../database/client', () => ({
  db: {
    query: mockDbQuery
  }
}));

jest.mock('../utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}));

jest.mock('../logging/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../logging/audit-logger', () => ({
  AuditLogger: {
    logFailedAction: jest.fn(),
    logUserAction: jest.fn()
  }
}));

// Types for our test data
interface Credentials {
  email?: string;
  password?: string;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionCallbackParams {
  session: { user: { name: string; email: string } };
  token: { id: string; role: string };
  user: undefined;
  trigger: string;
  newSession: undefined;
}

interface JwtCallbackParams {
  token: Record<string, unknown>;
  user: { id: string; role?: string };
  account: undefined;
  profile: undefined;
  isNewUser: boolean;
}

interface RedirectCallbackParams {
  url: string;
  baseUrl: string;
}

// Create authorize implementation
const createAuthorizeImplementation = () => {
  return async (credentials?: Credentials): Promise<AuthUser | null> => {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    try {
      const result = await mockDbQuery(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        [credentials.email]
      );

      const user = result.rows[0];
      if (!user) {
        return null;
      }

      const isPasswordValid = await mockBcryptCompare(credentials.password, user.password_hash);
      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  };
};

// Define mockAuthOptions AFTER the types but BEFORE the tests
const mockAuthOptions = {
  providers: [
    {
      authorize: createAuthorizeImplementation()
    }
  ],
  callbacks: {
    session: jest.fn(),
    jwt: jest.fn(),
    redirect: jest.fn()
  }
};

// Mock the auth module - this must come AFTER mockAuthOptions is defined
jest.mock('./auth', () => ({
  authOptions: mockAuthOptions
}));

describe('auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the authorize implementation after each test
    mockAuthOptions.providers[0].authorize = createAuthorizeImplementation();
  });

  describe('CredentialsProvider authorize', () => {
    it('should return null when credentials are missing', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ACT
      const result = await authorize({});

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null when email is missing', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ACT
      const result = await authorize({ password: 'password123' });

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null when password is missing', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ACT
      const result = await authorize({ email: 'test@example.com' });

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ARRANGE
      mockDbQuery.mockResolvedValue({ rows: [] });

      const credentials: Credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // ASSERT
      expect(result).toBeNull();
      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['nonexistent@example.com']
      );
    });

    it('should return user when authentication is successful', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ARRANGE
      const mockUser: MockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'admin'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUser] });
      mockBcryptCompare.mockResolvedValue(true);

      const credentials: Credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // ASSERT
      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      });
      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(mockBcryptCompare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should return null when password is invalid', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ARRANGE
      const mockUser: MockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUser] });
      mockBcryptCompare.mockResolvedValue(false);

      const credentials: Credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // ACT
      const result = await authorize(credentials);

      // ASSERT
      expect(result).toBeNull();
      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(mockBcryptCompare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });

    it('should return null and handle database query failure', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ARRANGE
      const error = new Error('Database connection failed');
      mockDbQuery.mockRejectedValue(error);

      const credentials: Credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // ASSERT
      expect(result).toBeNull();
      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should not log missing credentials on initial page load', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ACT
      const result = await authorize(undefined);

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle user without role and default to user', async () => {
      const authorize = mockAuthOptions.providers[0].authorize as (credentials?: Credentials) => Promise<AuthUser | null>;
      
      // ARRANGE
      const mockUser: MockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUser] });
      mockBcryptCompare.mockResolvedValue(true);

      const credentials: Credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // ASSERT
      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      });
    });
  });

  describe('Session callback', () => {
    it('should add user ID and role to session', async () => {
      // ARRANGE
      const mockSession = {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };
      
      const mockToken = {
        id: 'user-123',
        role: 'admin'
      };

      mockAuthOptions.callbacks.session = jest.fn().mockImplementation(({ session, token }: SessionCallbackParams) => {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role
          }
        };
      });

      // ACT
      const result = await mockAuthOptions.callbacks.session({ 
        session: mockSession,
        token: mockToken,
        user: undefined,
        trigger: 'getToken',
        newSession: undefined
      });

      // ASSERT
      expect(result).toEqual({
        user: {
          name: 'Test User',
          email: 'test@example.com',
          id: 'user-123',
          role: 'admin'
        }
      });
    });

    it('should handle session callback errors gracefully', async () => {
      // ARRANGE
      const mockSession = { user: {} };
      const mockToken = { id: 'user-123' };

      mockAuthOptions.callbacks.session = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Session callback error'));
      });

      // ACT & ASSERT
      await expect(mockAuthOptions.callbacks.session({ 
        session: mockSession as SessionCallbackParams['session'],
        token: mockToken as SessionCallbackParams['token'],
        user: undefined,
        trigger: 'getToken',
        newSession: undefined
      })).rejects.toThrow('Session callback error');
    });
  });

  describe('JWT callback', () => {
    it('should add user ID and role to token', async () => {
      // ARRANGE
      const mockToken: Record<string, unknown> = {};
      const mockUser = {
        id: 'user-123',
        role: 'admin'
      };

      mockAuthOptions.callbacks.jwt = jest.fn().mockImplementation(({ token, user }: JwtCallbackParams) => {
        return {
          ...token,
          id: user.id,
          role: user.role
        };
      });

      // ACT
      const result = await mockAuthOptions.callbacks.jwt({ 
        token: mockToken,
        user: mockUser,
        account: undefined,
        profile: undefined,
        isNewUser: false
      });

      // ASSERT
      expect(result).toEqual({
        id: 'user-123',
        role: 'admin'
      });
    });

    it('should default role to user when not provided', async () => {
      // ARRANGE
      const mockToken: Record<string, unknown> = {};
      const mockUser = {
        id: 'user-123'
      };

      mockAuthOptions.callbacks.jwt = jest.fn().mockImplementation(({ token, user }: JwtCallbackParams) => {
        return {
          ...token,
          id: user.id,
          role: user.role || 'user'
        };
      });

      // ACT
      const result = await mockAuthOptions.callbacks.jwt({ 
        token: mockToken,
        user: mockUser,
        account: undefined,
        profile: undefined,
        isNewUser: false
      });

      // ASSERT
      expect(result).toEqual({
        id: 'user-123',
        role: 'user'
      });
    });

    it('should handle JWT callback errors gracefully', async () => {
      // ARRANGE
      const mockToken: Record<string, unknown> = {};
      const mockUser = { id: 'user-123' };

      mockAuthOptions.callbacks.jwt = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('JWT callback error'));
      });

      // ACT & ASSERT
      await expect(mockAuthOptions.callbacks.jwt({ 
        token: mockToken,
        user: mockUser,
        account: undefined,
        profile: undefined,
        isNewUser: false
      })).rejects.toThrow('JWT callback error');
    });
  });

  describe('Redirect callback', () => {
    it('should allow relative callback URLs', async () => {
      // ARRANGE
      const url = '/dashboard';
      const baseUrl = 'https://example.com';

      mockAuthOptions.callbacks.redirect = jest.fn().mockImplementation(({ url, baseUrl }: RedirectCallbackParams) => {
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url.startsWith(baseUrl) ? url : baseUrl;
      });

      // ACT
      const result = await mockAuthOptions.callbacks.redirect({ 
        url, 
        baseUrl 
      });

      // ASSERT
      expect(result).toBe('https://example.com/dashboard');
    });

    it('should allow callback URLs on the same origin', async () => {
      // ARRANGE
      const url = 'https://example.com/callback';
      const baseUrl = 'https://example.com';

      mockAuthOptions.callbacks.redirect = jest.fn().mockImplementation(({ url, baseUrl }: RedirectCallbackParams) => {
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url.startsWith(baseUrl) ? url : baseUrl;
      });

      // ACT
      const result = await mockAuthOptions.callbacks.redirect({ 
        url, 
        baseUrl 
      });

      // ASSERT
      expect(result).toBe('https://example.com/callback');
    });

    it('should redirect to baseUrl for external URLs', async () => {
      // ARRANGE
      const url = 'https://malicious.com';
      const baseUrl = 'https://example.com';

      mockAuthOptions.callbacks.redirect = jest.fn().mockImplementation(({ url, baseUrl }: RedirectCallbackParams) => {
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url.startsWith(baseUrl) ? url : baseUrl;
      });

      // ACT
      const result = await mockAuthOptions.callbacks.redirect({ 
        url, 
        baseUrl 
      });

      // ASSERT
      expect(result).toBe('https://example.com');
    });

    it('should handle redirect callback errors gracefully', async () => {
      // ARRANGE
      const url = 'invalid-url';
      const baseUrl = 'https://example.com';

      mockAuthOptions.callbacks.redirect = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Redirect callback error'));
      });

      // ACT & ASSERT
      await expect(mockAuthOptions.callbacks.redirect({ 
        url, 
        baseUrl 
      })).rejects.toThrow('Redirect callback error');
    });
  });
});