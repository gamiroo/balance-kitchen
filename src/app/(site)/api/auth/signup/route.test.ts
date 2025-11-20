// app/api/auth/signup/route.test.ts
import { POST } from './route'
import { db } from '@/shared/lib/database/client'
import bcrypt from 'bcryptjs'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'
import { logger } from '@/shared/lib/logging/logger'

// Mock dependencies
jest.mock('@/lib/database/client', () => ({
  db: {
    query: jest.fn()
  }
}))

jest.mock('bcryptjs')
jest.mock('@/lib/logging/logger')
jest.mock('@/lib/logging/audit-logger')

const mockRequest = <T = unknown>(body: T) => ({
  json: async () => body
} as unknown as Request)

describe('POST /api/auth/signup', () => {
  const validUserData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    }
    
    ;(db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // Check existing user
      .mockResolvedValueOnce({ rows: [mockUser] }) // Create user
    
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

    // ACT
    const response = await POST(mockRequest(validUserData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.user).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role
    })
    expect(db.query).toHaveBeenCalledTimes(2)
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    expect(logger.info).toHaveBeenCalledWith('User created successfully', {
      userId: mockUser.id,
      email: mockUser.email
    })
    expect(AuditLogger.logUserAction).toHaveBeenCalledWith(
      mockUser.id,
      'USER_REGISTERED',
      'users',
      { email: mockUser.email }
    )
  })

  it('should return 400 when name is missing', async () => {
    // ARRANGE
    const invalidData = {
      email: 'test@example.com',
      password: 'password123'
    }

    // ACT
    const response = await POST(mockRequest(invalidData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Name, email, and password are required')
    expect(logger.warn).toHaveBeenCalledWith('Signup failed - missing required fields', {
      hasName: false,
      hasEmail: true,
      hasPassword: true
    })
  })

  it('should return 400 when email is missing', async () => {
    // ARRANGE
    const invalidData = {
      name: 'Test User',
      password: 'password123'
    }

    // ACT
    const response = await POST(mockRequest(invalidData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Name, email, and password are required')
    expect(logger.warn).toHaveBeenCalledWith('Signup failed - missing required fields', {
      hasName: true,
      hasEmail: false,
      hasPassword: true
    })
  })

  it('should return 400 when password is missing', async () => {
    // ARRANGE
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com'
    }

    // ACT
    const response = await POST(mockRequest(invalidData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Name, email, and password are required')
    expect(logger.warn).toHaveBeenCalledWith('Signup failed - missing required fields', {
      hasName: true,
      hasEmail: true,
      hasPassword: false
    })
  })

  it('should return 400 when password is too short', async () => {
    // ARRANGE
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: '123'
    }

    // ACT
    const response = await POST(mockRequest(invalidData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('Password must be at least 6 characters')
    expect(logger.warn).toHaveBeenCalledWith('Signup failed - password too short', {
      email: 'test@example.com'
    })
  })

  it('should return 400 when user already exists', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 'existing-user' }]
    })

    // ACT
    const response = await POST(mockRequest(validUserData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(400)
    expect(data.error).toBe('User with this email already exists')
    expect(logger.info).toHaveBeenCalledWith('Signup failed - user already exists', {
      email: 'test@example.com'
    })
    expect(AuditLogger.logFailedAction).toHaveBeenCalledWith(
      undefined,
      'SIGNUP_ATTEMPT',
      'auth',
      'USER_EXISTS',
      { email: 'test@example.com' }
    )
  })

  it('should return 500 when database error occurs during user check', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'))

    // ACT
    const response = await POST(mockRequest(validUserData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create account. Please try again.')
    expect(logger.error).toHaveBeenCalledWith('Signup failed with system error', {
      error: 'Error: Database connection failed',
      stack: expect.any(String)
    })
  })

  it('should return 500 when database error occurs during user creation', async () => {
    // ARRANGE
    ;(db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // Check existing user
      .mockRejectedValueOnce(new Error('Database insert failed'))
    
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

    // ACT
    const response = await POST(mockRequest(validUserData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create account. Please try again.')
    expect(logger.error).toHaveBeenCalledWith('Signup failed with system error', {
      error: 'Error: Database insert failed',
      stack: expect.any(String)
    })
  })

  it('should return 500 when bcrypt hashing fails', async () => {
    // ARRANGE
    ;(db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }) // Check existing user
    ;(bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'))

    // ACT
    const response = await POST(mockRequest(validUserData))
    const data = await response.json()

    // ASSERT
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create account. Please try again.')
    expect(logger.error).toHaveBeenCalledWith('Signup failed with system error', {
      error: 'Error: Hashing failed',
      stack: expect.any(String)
    })
  })
})
