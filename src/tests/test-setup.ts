// src/tests/test-setup.ts
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn()
}));

// Mock database client with proper structure
const mockDb = {
  query: jest.fn()
};

jest.mock('@/lib/database/client', () => ({
  db: mockDb
}));

// Mock logger with all required methods
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/lib/logging/logger', () => ({
  logger: mockLogger
}));

// Mock captureErrorSafe
const mockCaptureErrorSafe = jest.fn();

jest.mock('@/lib/utils/error-utils', () => ({
  captureErrorSafe: mockCaptureErrorSafe,
  isError: (error: unknown): error is Error => error instanceof Error
}));

// Mock AuditLogger
const mockAuditLogger = {
  logUserAction: jest.fn(),
  logFailedAction: jest.fn(),
  log: jest.fn()
};

jest.mock('@/lib/logging/audit-logger', () => ({
  AuditLogger: mockAuditLogger
}));

// Extend Jest expect
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  // Reset all mock implementations
  mockDb.query.mockReset();
  mockLogger.info.mockReset();
  mockLogger.error.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.debug.mockReset();
  mockCaptureErrorSafe.mockReset();
  mockAuditLogger.logUserAction.mockReset();
  mockAuditLogger.logFailedAction.mockReset();
  mockAuditLogger.log.mockReset();
});
