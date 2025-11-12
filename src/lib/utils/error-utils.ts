// src/lib/utils/error-utils.ts
import { captureError } from '../monitoring/sentry'

export function isError(error: unknown): error is Error {
  return error instanceof Error
}

export function captureErrorSafe(error: unknown, context?: Record<string, unknown>): Error {
  let errorToCapture: Error
  
  if (isError(error)) {
    errorToCapture = error
  } else {
    errorToCapture = new Error(`Non-Error thrown: ${String(error)}`)
  }
  
  captureError(errorToCapture, context)
  return errorToCapture
}
