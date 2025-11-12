// src/lib/errors/system-errors.test.ts
import { 
  SystemError, 
  DatabaseError, 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError 
} from './system-errors';

describe('system-errors', () => {
  describe('SystemError', () => {
    it('should create system error with all properties', () => {
      // ACT
      const error = new SystemError('TEST_ERROR', 'Test error message', 400, { field: 'value' });

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SystemError);
      expect(error.name).toBe('SystemError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
    });

    it('should use default status code 500', () => {
      // ACT
      const error = new SystemError('TEST_ERROR', 'Test error message');

      // ASSERT
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe('DatabaseError', () => {
    it('should create database error with correct properties', () => {
      // ACT
      const error = new DatabaseError('Database connection failed', { host: 'localhost' });

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SystemError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('DatabaseError');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ host: 'localhost' });
    });

    it('should create database error without details', () => {
      // ACT
      const error = new DatabaseError('Database connection failed');

      // ASSERT
      expect(error.details).toBeUndefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with default message', () => {
      // ACT
      const error = new AuthenticationError();

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SystemError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
    });

    it('should create authentication error with custom message', () => {
      // ACT
      const error = new AuthenticationError('Invalid credentials');

      // ASSERT
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with default message', () => {
      // ACT
      const error = new AuthorizationError();

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SystemError);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.name).toBe('AuthorizationError');
      expect(error.code).toBe('AUTHZ_ERROR');
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });

    it('should create authorization error with custom message', () => {
      // ACT
      const error = new AuthorizationError('Insufficient permissions');

      // ASSERT
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with details', () => {
      // ACT
      const error = new ValidationError('Invalid input data', { email: 'Invalid email format' });

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SystemError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input data');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ email: 'Invalid email format' });
    });

    it('should create validation error without details', () => {
      // ACT
      const error = new ValidationError('Invalid input data');

      // ASSERT
      expect(error.details).toBeUndefined();
    });
  });
});
