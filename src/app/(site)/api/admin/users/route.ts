// app/api/admin/users/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { db } from "@/shared/lib/database/client"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
// Remove unused import: import { DatabaseError } from '@/shared/lib/errors/system-errors'

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface UserWithStats extends UserRow {
  total_orders: number;
  total_spent: number;
  meal_balance: number;
}

// GET /api/admin/users - List users with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to users list')
      AuditLogger.logFailedAction(
        undefined,
        'ACCESS_USERS_LIST',
        'users',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }
    
    if (session.user.role !== "admin") {
      logger.warn('Forbidden access attempt to users list', { 
        userId: session.user.id,
        userRole: session.user.role 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'ACCESS_USERS_LIST',
        'users',
        'FORBIDDEN',
        { userRole: session.user.role }
      )
      return NextResponse.json({ 
        success: false,
        error: "Forbidden" 
      }, { status: 403 })
    }

    logger.info('Admin accessing users list', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    logger.debug('Fetching users with search filter', { search, userId: session.user.id })

    // Simple query first to test
    let query = `
      SELECT 
        id,
        name,
        email,
        role,
        is_active,
        created_at
      FROM users
      WHERE 1=1
    `
    
    const params: (string | boolean)[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT 50`

    logger.debug('Executing users query', { 
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      paramCount: params.length,
      userId: session.user.id 
    })

    const result = await db.query<UserRow>(query, params)
    
    // Add computed fields manually for now
    const usersWithStats: UserWithStats[] = result.rows.map(user => ({
      ...user,
      total_orders: 0,
      total_spent: 0,
      meal_balance: 0
    }))
    
    logger.info('Users list fetched successfully', { 
      count: usersWithStats.length,
      userId: session.user.id 
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'FETCH_USERS_LIST',
      'users',
      { userCount: usersWithStats.length }
    )
    
    return NextResponse.json({
      success: true,
      data: usersWithStats,
      meta: {
        count: usersWithStats.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'admin_get_users',
      service: 'admin',
      endpoint: '/api/admin/users',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Failed to fetch users list', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch users list. Please try again.",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
