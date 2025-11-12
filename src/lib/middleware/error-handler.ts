// src/lib/middleware/error-handler.ts
import { NextResponse } from 'next/server'
import { SystemError } from '../errors/system-errors'
import { logger } from '../logging/logger'
import { captureError } from '../monitoring/sentry'

export function createErrorResponse(error: Error, requestId: string): NextResponse {
  const timestamp = new Date().toISOString()
  
  // Log the error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    requestId,
    timestamp
  })

  // Send to Sentry (but not for validation errors)
  if (!(error instanceof SystemError && error.statusCode < 500)) {
    captureError(error, {
      requestId,
      timestamp
    })
  }

  // Handle known error types
  if (error instanceof SystemError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          timestamp,
          requestId,
          details: error.details
        }
      },
      { status: error.statusCode }
    )
  }

  // Handle unexpected errors
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp,
        requestId
      }
    },
    { status: 500 }
  )
}
