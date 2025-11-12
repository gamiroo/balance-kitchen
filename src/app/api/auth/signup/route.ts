// app/api/auth/signup/route.ts
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "../../../../lib/database/client"
import { captureErrorSafe } from '../../../../lib/utils/error-utils'
import { logger } from '../../../../lib/logging/logger'
import { AuditLogger } from '../../../../lib/logging/audit-logger'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    logger.info('Signup attempt started', { email })

    // Validate input
    if (!name || !email || !password) {
      logger.warn('Signup failed - missing required fields', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasPassword: !!password 
      })
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      logger.warn('Signup failed - password too short', { email })
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists
    logger.debug('Checking for existing user', { email })
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      logger.info('Signup failed - user already exists', { email })
      AuditLogger.logFailedAction(
        undefined,
        'SIGNUP_ATTEMPT',
        'auth',
        'USER_EXISTS',
        { email }
      )
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    logger.debug('Hashing password', { email })
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    logger.info('Creating new user', { email })
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, 'user']
    )

    const user = result.rows[0]
    logger.info('User created successfully', { userId: user.id, email: user.email })
    
    AuditLogger.logUserAction(
      user.id,
      'USER_REGISTERED',
      'users',
      { email: user.email }
    )

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'user_signup',
      service: 'auth',
      endpoint: '/api/auth/signup'
    })
    
    logger.error('Signup failed with system error', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
