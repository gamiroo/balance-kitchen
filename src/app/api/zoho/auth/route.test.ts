const mockRedirect = jest.fn()
const mockJson = jest.fn()

// Mock all dependencies first
jest.mock('../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    log: jest.fn()
  }
}))

// Mock next/server with our functions
jest.doMock('next/server', () => ({
  NextResponse: {
    redirect: mockRedirect,
    json: mockJson
  }
}), { virtual: true })

// Now we can safely import
const { GET } = require('./route')

// Import the mocked modules for use in tests
const { captureErrorSafe } = require('../../../../lib/utils/error-utils')
const { logger } = require('../../../../lib/logging/logger')
const { AuditLogger } = require('../../../../lib/logging/audit-logger')

describe('GET /api/zoho/auth', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return error response when ZOHO_CLIENT_ID is missing', async () => {
    delete process.env.ZOHO_CLIENT_ID

    const mockResponse = {
      json: async () => ({ success: false, error: 'ZOHO_CLIENT_ID not configured in environment variables' }),
      status: 500
    }
    mockJson.mockReturnValue(mockResponse)

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual({ success: false, error: 'ZOHO_CLIENT_ID not configured in environment variables' })
    expect(logger.error).toHaveBeenCalledWith('Zoho OAuth failed - missing client ID')
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_INIT',
      resource: 'zoho',
      details: { error: 'MISSING_CLIENT_ID' },
      success: false
    })
  })

  it('should redirect to Zoho OAuth URL with US data center', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_DATA_CENTER = 'US'

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(logger.debug).toHaveBeenCalledWith('Redirecting to Zoho OAuth URL', {
      authDomain: 'https://accounts.zoho.com',
      clientId: '***t-id',
      scope: scope,
      redirectUri: encodedRedirectUri  // Use encoded version as that's what's logged
    })
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'US', scope: scope },
      success: true
    })
  })

  it('should redirect to Zoho OAuth URL with AU data center', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_DATA_CENTER = 'AU'

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.com.au/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(logger.debug).toHaveBeenCalledWith('Redirecting to Zoho OAuth URL', {
      authDomain: 'https://accounts.zoho.com.au',
      clientId: '***t-id',
      scope: scope,
      redirectUri: encodedRedirectUri  // Use encoded version as that's what's logged
    })
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'AU', scope: scope },
      success: true
    })
  })

  it('should redirect to Zoho OAuth URL with EU data center', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_DATA_CENTER = 'EU'

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.eu/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(logger.debug).toHaveBeenCalledWith('Redirecting to Zoho OAuth URL', {
      authDomain: 'https://accounts.zoho.eu',
      clientId: '***t-id',
      scope: scope,
      redirectUri: encodedRedirectUri  // Use encoded version as that's what's logged
    })
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'EU', scope: scope },
      success: true
    })
  })

  it('should redirect to Zoho OAuth URL with IN data center', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_DATA_CENTER = 'IN'

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(logger.debug).toHaveBeenCalledWith('Redirecting to Zoho OAuth URL', {
      authDomain: 'https://accounts.zoho.in',
      clientId: '***t-id',
      scope: scope,
      redirectUri: encodedRedirectUri  // Use encoded version as that's what's logged
    })
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'IN', scope: scope },
      success: true
    })
  })

  it('should redirect to Zoho OAuth URL with CN data center', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_DATA_CENTER = 'CN'

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.com.cn/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(logger.debug).toHaveBeenCalledWith('Redirecting to Zoho OAuth URL', {
      authDomain: 'https://accounts.zoho.com.cn',
      clientId: '***t-id',
      scope: scope,
      redirectUri: encodedRedirectUri  // Use encoded version as that's what's logged
    })
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'CN', scope: scope },
      success: true
    })
  })

  it('should use default AU data center for unknown data center', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_DATA_CENTER = 'UNKNOWN'

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.com.au/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.warn).toHaveBeenCalledWith('Unknown Zoho data center, using default', { dataCenter: 'UNKNOWN' })
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'UNKNOWN', scope: scope },
      success: true
    })
  })

  it('should use default AU data center when no data center is specified', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    delete process.env.ZOHO_DATA_CENTER

    const redirectUri = 'https://balance-kitchen.vercel.app/api/zoho/callback'
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'ZohoCRM.modules.CREATE'
    const encodedScope = encodeURIComponent(scope)
    const prompt = 'consent'
    const encodedPrompt = encodeURIComponent(prompt)

    const expectedAuthUrl = `https://accounts.zoho.com.au/oauth/v2/auth?scope=${encodedScope}&client_id=test-client-id&response_type=code&access_type=offline&redirect_uri=${encodedRedirectUri}&prompt=${encodedPrompt}`

    const mockResponse = {
      url: expectedAuthUrl,
      status: 307
    }
    mockRedirect.mockReturnValue(mockResponse)

    const response = await GET()

    expect(response.status).toBe(307)
    expect(mockRedirect).toHaveBeenCalledWith(expectedAuthUrl)
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth authorization initiated')
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter: 'AU', scope: scope },
      success: true
    })
  })

  it('should handle system error and call captureErrorSafe', async () => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'

    const systemError = new Error('System error occurred')
    mockRedirect.mockImplementation(() => {
      throw systemError
    })

    const mockResponse = {
      json: async () => ({ success: false, error: 'Failed to initialize Zoho OAuth process' }),
      status: 500
    }
    mockJson.mockReturnValue(mockResponse)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ success: false, error: 'Failed to initialize Zoho OAuth process' })
    expect(captureErrorSafe).toHaveBeenCalledWith(systemError, {
      action: 'zoho_oauth_init',
      endpoint: '/api/zoho/auth',
      service: 'zoho'
    })
    expect(logger.error).toHaveBeenCalledWith('Zoho OAuth initialization failed', {
      error: 'Error: System error occurred',
      stack: systemError.stack
    })
  })
})
