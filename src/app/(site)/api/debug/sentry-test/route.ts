// src/app/api/debug/sentry-test/route.ts
import { NextResponse } from 'next/server'
import { captureError } from '@/shared/lib/monitoring/sentry'

// GET /api/debug/sentry-test
export async function GET() {
  try {
    // This will intentionally throw an error for testing
    throw new Error('Sentry test error - this is intentional')
  } catch (error: unknown) {
    // Type guard to ensure we're passing an Error to captureError
    if (error instanceof Error) {
      captureError(error, {
        url: '/api/debug/sentry-test',
        method: 'GET'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test error sent to Sentry'
    })
  }
}
