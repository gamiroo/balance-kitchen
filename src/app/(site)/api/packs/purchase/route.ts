// app/api/packs/purchase/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { db } from "@/shared/lib/database/client"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      logger.warn('Unauthorized pack purchase attempt - no session')
      AuditLogger.logFailedAction(
        undefined,
        'PURCHASE_PACK',
        'packs',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const { packSize, userId } = await request.json()
    
    logger.info('Pack purchase initiated', { 
      userId: session.user.id,
      userEmail: session.user.email,
      packSize 
    })

    // Verify the user is purchasing for themselves
    if (session.user.id !== userId) {
      logger.warn('Unauthorized pack purchase attempt - user mismatch', { 
        sessionUserId: session.user.id,
        requestUserId: userId 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'PURCHASE_PACK',
        'packs',
        'USER_MISMATCH',
        { requestUserId: userId }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    // Validate pack size
    const validPackSizes = [10, 20, 40, 80]
    if (!validPackSizes.includes(packSize)) {
      logger.warn('Pack purchase failed - invalid pack size', { 
        userId: session.user.id,
        packSize,
        validSizes: validPackSizes
      })
      return NextResponse.json({ 
        success: false,
        error: `Invalid pack size. Must be one of: ${validPackSizes.join(', ')}` 
      }, { status: 400 })
    }

    logger.debug('Processing pack purchase', { userId, packSize })

    // TODO: Add actual payment processing here
    // For now, we'll simulate successful payment
    
    // Create meal pack in database
    logger.info('Creating meal pack record', { userId, packSize })
    const result = await db.query(
      `INSERT INTO meal_packs (user_id, pack_size, remaining_balance, purchase_date, is_active)
       VALUES ($1, $2, $3, NOW(), true)
       RETURNING *`,
      [userId, packSize, packSize]
    )

    const pack = result.rows[0]
    logger.info('Meal pack created successfully', { 
      userId, 
      packId: pack.id, 
      packSize 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'PURCHASE_PACK',
      'packs',
      { packId: pack.id, packSize: pack.pack_size } // Fixed: use pack_size instead of packSize
    )
    
    const successData = { 
      success: true, 
      pack: pack,
      message: `Successfully purchased ${packSize} meal pack!`
    }
    
    return NextResponse.json(successData)
    
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'purchase_pack',
      endpoint: '/api/packs/purchase',
      method: 'POST',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Pack purchase failed with system error', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to purchase pack. Please try again."
      },
      { status: 500 }
    )
  }
}
