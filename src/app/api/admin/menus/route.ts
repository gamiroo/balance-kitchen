// app/api/admin/menus/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth/auth"
import { db } from "../../../../lib/database/client"
import { captureErrorSafe } from '../../../../lib/utils/error-utils'
import { logger } from '../../../../lib/logging/logger'
import { AuditLogger } from '../../../../lib/logging/audit-logger'
import { ApiResponse, PaginatedApiResponse } from '../../../../lib/types/api'

// Define API-specific types
interface ApiMenu {
  id: string;
  week_start_date: string; // ISO string for API response
  week_end_date: string;   // ISO string for API response
  created_by: string;
  created_by_name?: string;
  item_count: number;
  status: string;
  is_published: boolean;
  [key: string]: string | number | boolean | undefined | null;
}

interface MenuRow {
  id: string;
  week_start_date: Date;
  week_end_date: Date;
  created_by: string;
  created_by_name?: string;
  item_count: number;
  status: string;
  is_published: boolean;
  [key: string]: string | number | boolean | Date | null | undefined;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to menus list')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_MENUS_LIST',
        'menus',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to menus list', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_MENUS_LIST',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    logger.info('Admin accessing menus list', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    logger.debug('Fetching menus with filters', { published, startDate, endDate })

    let query = `
      SELECT 
        m.*,
        u.name as created_by_name,
        COUNT(mi.id) as item_count,
        CASE 
          WHEN m.is_published = false THEN 'Draft'
          WHEN m.week_end_date < NOW() THEN 'Expired'
          WHEN m.week_start_date <= NOW() AND m.week_end_date >= NOW() THEN 'Active'
          WHEN m.week_start_date > NOW() THEN 'Scheduled'
        END as status
      FROM menus m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN menu_items mi ON m.id = mi.menu_id
      WHERE 1=1
    `
    
    const params: (string | boolean)[] = []
    let paramIndex = 1

    if (published !== null) {
      query += ` AND m.is_published = $${paramIndex}`
      params.push(published === 'true')
      paramIndex++
    }

    if (startDate) {
      query += ` AND m.week_start_date >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND m.week_end_date <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    query += ` GROUP BY m.id, u.name ORDER BY m.week_start_date DESC`

    const result = await db.query<MenuRow>(query, params)
    
    // Transform MenuRow[] to ApiMenu[] (convert Date to string)
    const menus: ApiMenu[] = result.rows.map(row => ({
      ...row,
      week_start_date: row.week_start_date.toISOString(),
      week_end_date: row.week_end_date.toISOString()
    }))
    
    logger.info('Menus list fetched successfully', { 
      count: menus.length,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_MENUS_LIST',
      'menus',
      { menuCount: menus.length }
    )
    
    const response: PaginatedApiResponse<ApiMenu[]> = {
      success: true,
      data: menus,
      meta: {
        count: menus.length,
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_menus',
      service: 'admin',
      endpoint: '/api/admin/menus',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch menus list', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to fetch menus. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

interface CreateMenuBody {
  week_start_date: string;
  week_end_date: string;
}

interface CreatedMenu {
  id: string;
  week_start_date: string; // ISO string for API response
  week_end_date: string;   // ISO string for API response
  created_by: string;
  is_published: boolean;
  is_active: boolean;
  created_at: string; // ISO string for API response
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to create menu')
      AuditLogger.logFailedAction(
        undefined,
        'CREATE_MENU',
        'menus',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to create menu', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'CREATE_MENU',
        'menus',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body: CreateMenuBody = await request.json()
    logger.info('Admin creating new menu', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    // Validate required fields
    if (!body.week_start_date || !body.week_end_date) {
      logger.warn('Menu creation failed - missing required dates', { 
        userId: session.user.id 
      })
      return NextResponse.json(
        { error: "Week start date and end date are required" },
        { status: 400 }
      )
    }

    const menuData = {
      week_start_date: body.week_start_date,
      week_end_date: body.week_end_date,
      created_by: session.user.id
    }

    logger.debug('Inserting new menu', { 
      menuData: { ...menuData, created_by: '[REDACTED]' } 
    })

    const result = await db.query(
      `INSERT INTO menus (week_start_date, week_end_date, created_by, is_published) 
       VALUES ($1, $2, $3, false) 
       RETURNING *`,
      [menuData.week_start_date, menuData.week_end_date, menuData.created_by]
    )
    
    // Transform database menu to API response format
    const dbMenu = result.rows[0]
    const createdMenu: CreatedMenu = {
      id: dbMenu.id,
      week_start_date: new Date(dbMenu.week_start_date).toISOString(),
      week_end_date: new Date(dbMenu.week_end_date).toISOString(),
      created_by: dbMenu.created_by,
      is_published: dbMenu.is_published,
      is_active: dbMenu.is_active,
      created_at: new Date(dbMenu.created_at).toISOString()
    }
    
    logger.info('Menu created successfully', { 
      menuId: createdMenu.id,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'CREATE_MENU',
      'menus',
      { menuId: createdMenu.id }
    )
    
    const response: ApiResponse<CreatedMenu> = {
      success: true,
      data: createdMenu
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_create_menu',
      service: 'admin',
      endpoint: '/api/admin/menus',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to create menu', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const response: ApiResponse<never> = { 
      success: false,
      error: "Failed to create menu. Please try again." 
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
