// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    integrations: [
      // Profiling integration removed because '@sentry/profiling-node' is not available in this project.
      // Add integrations here if needed and available.
    ]
  })
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: {
      request: context
    }
  })
}

// Optional: Capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

// Optional: Add user context
export function setUserContext(user: { id: string; email?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email
  })
}
