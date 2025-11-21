// app/api/admin/users/[id]/role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminUserService } from "@/shared/lib/services/admin/userService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { NextRequest } from "next/server"

// PUT /api/admin/users/[id]/role - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to update user role', { userId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'UPDATE_USER_ROLE',
        'users',
        'UNAUTHORIZED',
        { targetUserId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to update user role', { 
        userId: session.user.id,
        userRole: session.user.role,
        targetUserId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_USER_ROLE',
        'users',
        'FORBIDDEN',
        { userRole: session.user.role, targetUserId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('User role update failed - missing user ID')
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 })
    }

    // Prevent changing role of the current admin user
    if (session.user.id === resolvedParams.id) {
      logger.warn('User role update attempt on self', { 
        userId: session.user.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_USER_ROLE',
        'users',
        'CANNOT_CHANGE_OWN_ROLE',
        { targetUserId: resolvedParams.id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Cannot change your own role" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { role } = body

    logger.info('Admin updating user role', { 
      adminUserId: session.user.id,
      targetUserId: resolvedParams.id,
      newRole: role 
    })

    if (!role) {
      logger.warn('User role update failed - missing role', { 
        adminUserId: session.user.id,
        targetUserId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "Role is required" 
      }, { status: 400 })
    }

    const validRoles = ['user', 'admin']
    if (!validRoles.includes(role)) {
      logger.warn('User role update failed - invalid role', { 
        adminUserId: session.user.id,
        targetUserId: resolvedParams.id,
        role 
      })
      return NextResponse.json({ 
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      }, { status: 400 })
    }

    logger.debug('Executing user role update', { 
      targetUserId: resolvedParams.id,
      role,
      adminUserId: session.user.id 
    })

    const user = await adminUserService.updateUserRole(resolvedParams.id, role)
    
    if (!user) {
      logger.info('User role update failed - user not found', { 
        adminUserId: session.user.id,
        targetUserId: resolvedParams.id 
      })
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }
    
    logger.info('User role updated successfully', { 
      adminUserId: session.user.id,
      targetUserId: resolvedParams.id,
      oldRole: user.role,
      newRole: role 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'UPDATE_USER_ROLE',
      'users',
      { 
        targetUserId: resolvedParams.id,
        oldRole: user.role,
        newRole: role 
      }
    )
    
    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: unknown) {
    const resolvedParams = await params;
    const errorInstance = error as Error
    captureErrorSafe(error, {
      action: 'admin_update_user_role',
      service: 'admin',
      endpoint: `/api/admin/users/${resolvedParams.id}/role`,
      userId: (await getServerSession(authOptions))?.user?.id,
      targetUserId: resolvedParams.id
    })
    
    logger.error('Failed to update user role', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      targetUserId: resolvedParams.id
    })
    
    if (errorInstance.message === 'Invalid role') {
      return NextResponse.json({ 
        success: false,
        error: "Invalid role" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to update user role. Please try again." 
    }, { status: 500 })
  }
}
