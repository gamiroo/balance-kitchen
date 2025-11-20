// app/api/admin/menus/[id]/publish/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminMenuService } from "@/shared/lib/services/admin/menuService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { NextRequest } from "next/server"

// POST /api/admin/menus/[id]/publish - Publish a menu
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to publish menu', { menuId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'PUBLISH_MENU',
        'menus',
        'UNAUTHORIZED',
        { menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to publish menu', { 
        userId: session.user.id,
        userRole: session.user.role,
        menuId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'PUBLISH_MENU',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role, menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Menu publish failed - missing menu ID')
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    logger.info('Admin publishing menu', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })

    // First, unpublish all other menus by getting all published menus and unpublishing them
    const publishedMenus = await adminMenuService.getAllMenus({ published: true });
    
    // Unpublish each currently published menu
    for (const menu of publishedMenus) {
      if (menu.id !== resolvedParams.id) {
        await adminMenuService.unpublishMenu(menu.id);
      }
    }
    
    // Then publish the selected menu
    const menu = await adminMenuService.publishMenu(resolvedParams.id)
    
    if (!menu) {
      logger.info('Menu publish failed - menu not found', { 
        userId: session.user.id,
        menuId: resolvedParams.id 
      })
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }
    
    logger.info('Menu published successfully', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'PUBLISH_MENU',
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
      action: 'admin_publish_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/${resolvedParams.id}/publish`,
      userId: (await getServerSession(authOptions))?.user?.id,
      menuId: resolvedParams.id
    })
    
    logger.error('Failed to publish menu', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      menuId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to publish menu. Please try again." 
    }, { status: 500 })
  }
}
