// app/api/user/balance/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { db } from "@/shared/lib/database/client"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      logger.warn('Unauthorized balance check attempt - no session')
      AuditLogger.logFailedAction(
        undefined,
        'CHECK_BALANCE',
        'users',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    logger.debug('Fetching user meal balance', { userId: session.user.id })

    const result = await db.query(
      `SELECT COALESCE(SUM(remaining_balance), 0) as total_meals
       FROM meal_packs 
       WHERE user_id = $1 AND is_active = true AND remaining_balance > 0`,
      [session.user.id]
    )
    
    const balance = parseInt(result.rows[0]?.total_meals || '0')
    
    logger.debug('User meal balance retrieved', { 
      userId: session.user.id, 
      balance 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'CHECK_BALANCE',
      'users',
      { balance }
    )
    
    return NextResponse.json({ 
      success: true,
      balance 
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'get_user_balance',
      endpoint: '/api/user/balance',
      method: 'GET',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch meal balance', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch meal balance. Please try again."
      },
      { status: 500 }
    )
  }
}
