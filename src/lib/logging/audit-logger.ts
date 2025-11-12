// src/lib/logging/audit-logger.ts
import { logger } from './logger';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  static log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    // Only log on server side
    if (typeof window !== 'undefined') {
      return; // Skip in browser
    }

    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    };
    
    logger.info('Audit Log', logEntry);
  }
  
  static logUserAction(
    userId: string,
    action: string,
    resource: string,
    details?: Record<string, unknown>
  ) {
    if (typeof window !== 'undefined') {
      return; // Skip in browser
    }

    this.log({
      userId,
      action,
      resource,
      details,
      success: true
    });
  }
  
  static logFailedAction(
    userId: string | undefined,
    action: string,
    resource: string,
    error: string,
    details?: Record<string, unknown>
  ) {
    if (typeof window !== 'undefined') {
      return; // Skip in browser
    }

    this.log({
      userId,
      action,
      resource,
      details,
      success: false,
      error
    });
  }
}
