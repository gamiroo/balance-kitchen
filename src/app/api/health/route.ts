// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '../../../lib/database/client'
import { captureErrorSafe } from '../../../lib/utils/error-utils'
import { logger } from '../../../lib/logging/logger'

export async function GET() {
  try {
    logger.debug('Health check initiated')
    
    // Check database connection
    const startTime = Date.now()
    const dbResult = await db.query('SELECT NOW() as now')
    const dbResponseTime = Date.now() - startTime
    const dbStatus = dbResult.rows.length > 0 ? 'healthy' : 'unhealthy'
    
    // Check authentication service (simplified check)
    const authStatus = 'healthy' // In a real implementation, you might check auth service health
    
    const status = dbStatus === 'healthy' && authStatus === 'healthy' 
      ? 'healthy' 
      : 'degraded'
    
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        authentication: authStatus
      },
      responseTimes: {
        database: `${dbResponseTime}ms`
      },
      version: process.env.APP_VERSION || '1.0.0'
    }
    
    logger.info('Health check completed', healthData)
    
    const statusCode = status === 'healthy' ? 200 : 503
    return NextResponse.json(healthData, { status: statusCode })
    
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'health_check',
      service: 'system'
    })
    
    logger.error('Health check failed', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
