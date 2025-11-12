// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { adminUserService } from "../../../../../lib/services/admin/userService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and resolved params
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to user details', { userId: id })
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_USER_DETAILS',
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
      logger.warn('Forbidden access attempt to user details', { 
        userId: session.user.id,
        userRole: session.user.role,
        targetUserId: id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_USER_DETAILS',
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
      logger.warn('User details request failed - missing user ID')
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 })
    }

    logger.info('Admin accessing user details', { 
      adminUserId: session.user.id,
      targetUserId: id 
    })

    const user = await adminUserService.getUserById(id)
    
    if (!user) {
      logger.info('User details not found', { 
        adminUserId: session.user.id,
        targetUserId: id 
      })
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }
    
    logger.debug('User details fetched successfully', { 
      adminUserId: session.user.id,
      targetUserId: id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_USER_DETAILS',
      'users',
      { targetUserId: id }
    )
    
    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: unknown) {
    // Handle params for error logging
    let userId = 'unknown';
    try {
      const resolvedParams = params instanceof Promise ? await params : params;
      userId = resolvedParams.id;
    } catch (_e) {
      console.log(_e);
    }

    captureErrorSafe(error, {
      action: 'admin_get_user_by_id',
      service: 'admin',
      endpoint: `/api/admin/users/${userId}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      targetUserId: userId
    })
    
    logger.error('Failed to fetch user details', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      targetUserId: userId
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch user details. Please try again." 
    }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and resolved params
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to delete user', { userId: id })
      AuditLogger.logFailedAction(
        undefined,
        'DELETE_USER',
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
      logger.warn('Forbidden access attempt to delete user', { 
        userId: session.user.id,
        userRole: session.user.role,
        targetUserId: id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'DELETE_USER',
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
      logger.warn('User deletion failed - missing user ID')
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 })
    }

    // Prevent deleting the current admin user
    if (session.user.id === id) {
      logger.warn('User deletion attempt on self', { 
        userId: session.user.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'DELETE_USER',
        'users',
        'CANNOT_DELETE_SELF',
        { targetUserId: id }
      )
      return NextResponse.json({ 
        success: false,
        error: "Cannot delete yourself" 
      }, { status: 400 })
    }

    logger.info('Admin deleting user', { 
      adminUserId: session.user.id,
      targetUserId: id 
    })

    const user = await adminUserService.deleteUser(id)
    
    if (!user) {
      logger.info('User deletion failed - user not found', { 
        adminUserId: session.user.id,
        targetUserId: id 
      })
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }
    
    logger.info('User deleted successfully', { 
      adminUserId: session.user.id,
      targetUserId: id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'DELETE_USER',
      'users',
      { deletedUserId: id }
    )
    
    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })
  } catch (error: unknown) {
    const errorInstance = error as Error;
    
    // Handle params for error logging
    let userId = 'unknown';
    try {
      const resolvedParams = params instanceof Promise ? await params : params;
      userId = resolvedParams.id;
    } catch (_e) {
      console.log(_e);
    }

    captureErrorSafe(error, {
      action: 'admin_delete_user',
      service: 'admin',
      endpoint: `/api/admin/users/${userId}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      targetUserId: userId
    })
    
    logger.error('Failed to delete user', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      targetUserId: userId
    })
    
    if (errorInstance.message === 'Cannot delete user with active orders') {
      return NextResponse.json({ 
        success: false,
        error: errorInstance.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete user. Please try again." 
    }, { status: 500 })
  }
}
