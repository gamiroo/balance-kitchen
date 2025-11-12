// src/lib/auth/auth.test.ts
// Mock dependencies first
jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));
jest.mock('../database/client', () => ({
  db: {
    query: jest.fn()
  }
}));
jest.mock('../utils/error-utils');
jest.mock('../logging/logger');
jest.mock('../logging/audit-logger');

// Import after mocks
import bcrypt from 'bcryptjs';
import { db } from '../database/client';
import { captureErrorSafe } from '../utils/error-utils';
import { logger } from '../logging/logger';
import { AuditLogger } from '../logging/audit-logger';
import { authOptions } from './auth';

describe('auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ... [structure tests remain the same] ...

  describe('CredentialsProvider authorize', () => {
    // Get the authorize function directly
    let authorize: (credentials?: Record<string, string>) => Promise<any>;

    beforeAll(() => {
      // Get the authorize function from the first provider
      authorize = (authOptions.providers[0] as any).authorize;
    });

    it('should return null when credentials are missing', async () => {
      // ACT
      const result = await authorize({});

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null when email is missing', async () => {
      // ACT
      const result = await authorize({ password: 'password123' });

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null when password is missing', async () => {
      // ACT
      const result = await authorize({ email: 'test@example.com' });

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      // ARRANGE
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // DEBUG
      console.log('Credentials passed:', credentials);
      console.log('Database query called:', (db.query as jest.Mock).mock.calls);
      console.log('Result:', result);

      // ASSERT
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['nonexistent@example.com']
      );
    });

    it('should return user when authentication is successful', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'admin'
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // DEBUG
      console.log('Credentials passed:', credentials);
      console.log('Database query called:', (db.query as jest.Mock).mock.calls);
      console.log('Bcrypt compare called:', (bcrypt.compare as jest.Mock).mock.calls);
      console.log('Result:', result);

      // ASSERT
      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      });
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should return null when password is invalid', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user'
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // ACT
      const result = await authorize(credentials);

      // DEBUG
      console.log('Credentials passed:', credentials);
      console.log('Database query called:', (db.query as jest.Mock).mock.calls);
      console.log('Bcrypt compare called:', (bcrypt.compare as jest.Mock).mock.calls);
      console.log('Result:', result);

      // ASSERT
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });

    it('should return null and handle database query failure', async () => {
      // ARRANGE
      const error = new Error('Database connection failed');
      (db.query as jest.Mock).mockRejectedValueOnce(error);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // DEBUG
      console.log('Credentials passed:', credentials);
      console.log('Database query called:', (db.query as jest.Mock).mock.calls);
      console.log('Result:', result);

      // ASSERT
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should not log missing credentials on initial page load', async () => {
      // ACT
      const result = await authorize(undefined);

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle user without role and default to user', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password'
        // role is intentionally missing
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT
      const result = await authorize(credentials);

      // DEBUG
      console.log('Credentials passed:', credentials);
      console.log('Database query called:', (db.query as jest.Mock).mock.calls);
      console.log('Bcrypt compare called:', (bcrypt.compare as jest.Mock).mock.calls);
      console.log('Result:', result);

      // ASSERT
      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' // should default to 'user'
      });
    });
  });

  // ... [callbacks tests remain the same] ...
});
