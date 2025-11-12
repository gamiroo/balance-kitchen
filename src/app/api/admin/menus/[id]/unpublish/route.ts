// app/api/admin/menus/[id]/unpublish/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../../lib/auth/auth"
import { adminMenuService } from "../../../../../../lib/services/admin/menuService"
import { captureErrorSafe } from '../../../../../../lib/utils/error-utils'
import { logger } from '../../../../../../lib/logging/logger'
import { AuditLogger } from '../../../../../../lib/logging/audit-logger'
import { NextRequest } from "next/server"

// POST /api/admin/menus/[id]/unpublish - Unpublish menu
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params;
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to unpublish menu', { menuId: resolvedParams.id })
      AuditLogger.logFailedAction(
        undefined,
        'UNPUBLISH_MENU',
        'menus',
        'UNAUTHORIZED',
        { menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to unpublish menu', { 
        userId: session.user.id,
        userRole: session.user.role,
        menuId: resolvedParams.id 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'UNPUBLISH_MENU',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role, menuId: resolvedParams.id }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!resolvedParams.id) {
      logger.warn('Menu unpublish failed - missing menu ID')
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    logger.info('Admin unpublishing menu', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })

    const menu = await adminMenuService.unpublishMenu(resolvedParams.id)
    
    if (!menu) {
      logger.info('Menu unpublish failed - menu not found', { 
        userId: session.user.id,
        menuId: resolvedParams.id 
      })
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }
    
    logger.info('Menu unpublished successfully', { 
      userId: session.user.id,
      menuId: resolvedParams.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'UNPUBLISH_MENU',
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
      action: 'admin_unpublish_menu',
      service: 'admin',
      endpoint: `/api/admin/menus/${resolvedParams.id}/unpublish`,
      userId: (await getServerSession(authOptions))?.user?.id,
      menuId: resolvedParams.id
    })
    
    logger.error('Failed to unpublish menu', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      menuId: resolvedParams.id
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to unpublish menu. Please try again." 
    }, { status: 500 })
  }
}
