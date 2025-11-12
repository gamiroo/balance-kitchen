// app/api/admin/menus/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { adminMenuService } from "../../../../../lib/services/admin/menuService"
import { captureErrorSafe } from '../../../../../lib/utils/error-utils'
import { logger } from '../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../lib/logging/audit-logger'
import { NextRequest } from "next/server"

// GET /api/admin/menus/[id] - Get specific menu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to menu details', { menuId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_MENU_DETAILS',
        'menus',
        'UNAUTHORIZED',
        { menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to menu details', { 
        userId: session.user.id,
        userRole: session.user.role,
        menuId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_MENU_DETAILS',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role, menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Menu details request failed - missing menu ID')
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    logger.info('Admin accessing menu details', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })

    const menu = await adminMenuService.getMenuById(resolvedParams.id)
    
    if (!menu) {
      logger.info('Menu not found', { 
        userId: session.user.id,
        menuId: resolvedParams.id 
      })
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }
    
    logger.debug('Menu details fetched successfully', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_MENU_DETAILS',
      'menus',
      { menuId: resolvedParams.id }
    )
    
    return NextResponse.json({
      success: true,
      data: menu
    })
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_get_menu_by_id',
      service: 'admin',
      endpoint: `/api/admin/menus/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      menuId: resolvedParams.id
    })
    
    logger.error('Failed to fetch menu details', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      menuId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch menu details. Please try again." 
    }, { status: 500 })
  }
}

// PUT /api/admin/menus/[id] - Update menu
// PUT /api/admin/menus/[id] - Update menu
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to update menu', { menuId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'UPDATE_MENU',
        'menus',
        'UNAUTHORIZED',
        { menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to update menu', { 
        userId: session.user.id,
        userRole: session.user.role,
        menuId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UPDATE_MENU',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role, menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Menu update failed - missing menu ID')
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    const body = await request.json()
    logger.info('Admin updating menu', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })

    const { ...updateData } = body
    
    logger.debug('Updating menu with data', { 
      menuId: resolvedParams.id,
      updateFields: Object.keys(updateData)
    })

    const menu = await adminMenuService.updateMenu(resolvedParams.id, updateData)
    
    if (!menu) {
      logger.info('Menu update failed - menu not found', { 
        userId: session.user.id,
        menuId: resolvedParams.id 
      })
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }
    
    logger.info('Menu updated successfully', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'UPDATE_MENU',
      'menus',
      { menuId: resolvedParams.id }
    )
    
    return NextResponse.json({
      success: true,
      data: menu
    })
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_update_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      menuId: resolvedParams.id
    })
    
    logger.error('Failed to update menu', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      menuId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to update menu. Please try again." 
    }, { status: 500 })
  }
}

// DELETE /api/admin/menus/[id] - Delete menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to delete menu', { menuId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'DELETE_MENU',
        'menus',
        'UNAUTHORIZED',
        { menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to delete menu', { 
        userId: session.user.id,
        userRole: session.user.role,
        menuId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'DELETE_MENU',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role, menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Menu deletion failed - missing menu ID')
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    logger.info('Admin deleting menu', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })

    const menu = await adminMenuService.deleteMenu(resolvedParams.id)
    
    if (!menu) {
      logger.info('Menu deletion failed - menu not found', { 
        userId: session.user.id,
        menuId: resolvedParams.id 
      })
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }
    
    logger.info('Menu deleted successfully', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'DELETE_MENU',
      'menus',
      { menuId: resolvedParams.id }
    )
    
    return NextResponse.json({
      success: true,
      message: "Menu deleted successfully"
    })
  } catch (error: unknown) {
    const resolvedParams = await params;
    captureErrorSafe(error, {
      action: 'admin_delete_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/${resolvedParams.id}`,
      userId: (await getServerSession(authOptions))?.user?.id,
      menuId: resolvedParams.id
    })
    
    logger.error('Failed to delete menu', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      menuId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete menu. Please try again." 
    }, { status: 500 })
  }
}
