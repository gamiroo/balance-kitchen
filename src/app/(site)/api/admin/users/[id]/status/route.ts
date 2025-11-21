// app/api/admin/users/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminUserService } from "@/shared/lib/services/admin/userService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

interface UpdateUserStatusBody {
  is_active: boolean;
}

interface UpdateUserStatusResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// PUT /api/admin/users/[id]/status - Update user status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve the params promise
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to update user status', { userId: id })
      AuditLogger.logFailedAction(
        undefined,
        'UPDATE_USER_STATUS',
        'users',
        'UNAUTHORIZED',
        { targetUserId: id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to update user status', { 
        userId: session.user.id,
        userRole: session.user.role,
        targetUserId: id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_USER_STATUS',
        'users',
        'FORBIDDEN',
        { userRole: session.user.role, targetUserId: id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    if (!id) {
      logger.warn('User status update failed - missing user ID')
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 })
    }

    // Prevent deactivating the current admin user
    if (session.user.id === id) {
      logger.warn('User status update attempt on self', { 
        userId: session.user.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_USER_STATUS',
        'users',
        'CANNOT_DEACTIVATE_SELF',
        { targetUserId: id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Cannot deactivate yourself" 
      }, { status: 400 })
    }

    const body: UpdateUserStatusBody = await request.json()
    const { is_active } = body

    logger.info('Admin updating user status', { 
      adminUserId: session.user.id,
      targetUserId: id,
      newStatus: is_active 
    })

    if (is_active === undefined) {
      logger.warn('User status update failed - missing is_active', { 
        adminUserId: session.user.id,
        targetUserId: id 
      })
      return NextResponse.json({ 
        success: false,
        error: "is_active is required" 
      }, { status: 400 })
    }

    if (typeof is_active !== 'boolean') {
      logger.warn('User status update failed - invalid is_active type', { 
        adminUserId: session.user.id,
        targetUserId: id,
        is_active 
      })
      return NextResponse.json({ 
        success: false,
        error: "is_active must be a boolean value" 
      }, { status: 400 })
    }

    logger.debug('Executing user status update', { 
      targetUserId: id,
      is_active,
      adminUserId: session.user.id 
    })

    const user = await adminUserService.updateUserStatus(id, is_active)
    
    if (!user) {
      logger.info('User status update failed - user not found', { 
        adminUserId: session.user.id,
        targetUserId: id 
      })
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }
    
    logger.info('User status updated successfully', { 
      adminUserId: session.user.id,
      targetUserId: id,
      oldStatus: user.is_active,
      newStatus: is_active 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'UPDATE_USER_STATUS',
      'users',
      { 
        targetUserId: id,
        oldStatus: user.is_active,
        newStatus: is_active 
      }
    )
    
    return NextResponse.json({
      success: true,
      data: user
    } as UpdateUserStatusResponse)
  } catch (error: unknown) {
    // Handle params for error logging
    let userId = 'unknown';
    try {
      const resolvedParams = await params;
      userId = resolvedParams.id;
    } catch (_e) {
      console.log(_e);
    }

    captureErrorSafe(error, {
      action: 'admin_update_user_status',
      service: 'admin',
      endpoint: `/api/admin/users/${userId}/status`,
      userId: (await getServerSession(authOptions))?.user?.id,
      targetUserId: userId
    })
    
    logger.error('Failed to update user status', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      targetUserId: userId
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to update user status. Please try again." 
    }, { status: 500 })
  }
}
