// app/api/admin/menus/status/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { adminStatsService } from "@/shared/lib/services/admin/statsService"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { ApiResponse } from "lib/types/api"

// Define types
interface MenuStatus {
  total: number;
  published: number;
  draft: number;
  active: number;
  expired: number;
}

// GET /api/admin/menus/status - Menu status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to menu status')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_MENU_STATUS',
        'menus',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to menu status', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_MENU_STATUS',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    logger.info('Admin accessing menu status', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const menuStatusItems = await adminStatsService.getMenuStatus()
    
    // Transform the array of menu items into summary statistics
    const menuStatus: MenuStatus = {
      total: menuStatusItems.length,
      published: menuStatusItems.filter(item => item.is_published).length,
      draft: menuStatusItems.filter(item => !item.is_published).length,
      active: menuStatusItems.filter(item => item.status === 'Active').length,
      expired: menuStatusItems.filter(item => item.status === 'Expired').length
    };
    
    logger.debug('Menu status fetched successfully', { 
      userId: session.user.id,
      status: menuStatus 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_MENU_STATUS',
      'menus',
      { status: menuStatus }
    )
    
    const response: ApiResponse<MenuStatus> = {
      success: true,
      data: menuStatus
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_menu_status',
      service: 'admin',
      endpoint: '/api/admin/menus/status',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch menu status', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to fetch menu status. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
