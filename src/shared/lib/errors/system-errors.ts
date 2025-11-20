// src/lib/errors/system-errors.ts
export class SystemError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SystemError';
  }
}

export class DatabaseError extends SystemError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DATABASE_ERROR', message, 500, details);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends SystemError {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SystemError {
  constructor(message: string = 'Access denied') {
    super('AUTHZ_ERROR', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends SystemError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}
