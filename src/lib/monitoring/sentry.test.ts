// src/lib/monitoring/sentry.test.ts
import * as Sentry from '@sentry/nextjs';
import { captureError, captureMessage, setUserContext } from './sentry';

// Mock Sentry
jest.mock('@sentry/nextjs');

describe('sentry monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('captureError', () => {
    it('should capture error with context', () => {
      // ARRANGE
      const error = new Error('Test error');
      const context = { userId: 'user-123', action: 'test_action' };

      // ACT
      captureError(error, context);

      // ASSERT
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        contexts: {
          request: context
        }
      });
    });

    it('should capture error without context', () => {
      // ARRANGE
      const error = new Error('Test error');

      // ACT
      captureError(error);

      // ASSERT
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        contexts: {
          request: undefined
        }
      });
    });
  });

  describe('captureMessage', () => {
    it('should capture message with default level', () => {
      // ACT
      captureMessage('Test message');

      // ASSERT
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture message with specified level', () => {
      // ACT
      captureMessage('Test error message', 'error');

      // ASSERT
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test error message', 'error');
    });

    it('should capture message with warning level', () => {
      // ACT
      captureMessage('Test warning message', 'warning');

      // ASSERT
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test warning message', 'warning');
    });
  });

  describe('setUserContext', () => {
    it('should set user context with id and email', () => {
      // ARRANGE
      const user = { id: 'user-123', email: 'test@example.com' };

      // ACT
      setUserContext(user);

      // ASSERT
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com'
      });
    });

    it('should set user context with only id', () => {
      // ARRANGE
      const user = { id: 'user-123' };

      // ACT
      setUserContext(user);

      // ASSERT
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: undefined
      });
    });
  });
});
