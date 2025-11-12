// src/app/api/zoho/callback/route.test.ts
import { GET } from './route'
import { captureErrorSafe } from '../../../../lib/utils/error-utils'
import { logger } from '../../../../lib/logging/logger'
import { AuditLogger } from '../../../../lib/logging/audit-logger'

// Mock external dependencies
jest.mock('../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn()
}))

jest.mock('../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.mock('../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    log: jest.fn()
  }
}))

// Mock global fetch
global.fetch = jest.fn()

describe('GET /api/zoho/callback', () => {
  const originalEnv = process.env
  let nodeEnvValue: string | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = { ...originalEnv }
    nodeEnvValue = process.env.NODE_ENV
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return error HTML when no authorization code is provided', async () => {
    // ARRANGE
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback'
    } as unknown as Request

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('Authorization Code Missing')
    expect(logger.warn).toHaveBeenCalledWith('Zoho OAuth callback failed - no authorization code')
  })

  it('should return configuration error HTML when ZOHO_CLIENT_ID is missing', async () => {
    // ARRANGE
    delete process.env.ZOHO_CLIENT_ID
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('Configuration Error')
    expect(logger.error).toHaveBeenCalledWith('Zoho OAuth configuration error - missing credentials')
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_CONFIG_ERROR',
      resource: 'zoho',
      details: { 
        missingClientId: true,
        missingClientSecret: false 
      },
      success: false,
      error: 'MISSING_CREDENTIALS'
    })
  })

  it('should return configuration error HTML when ZOHO_CLIENT_SECRET is missing', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    delete process.env.ZOHO_CLIENT_SECRET
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('Configuration Error')
    expect(logger.error).toHaveBeenCalledWith('Zoho OAuth configuration error - missing credentials')
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_CONFIG_ERROR',
      resource: 'zoho',
      details: { 
        missingClientId: false,
        missingClientSecret: true 
      },
      success: false,
      error: 'MISSING_CREDENTIALS'
    })
  })

  it('should use correct token domain for US data center', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    process.env.ZOHO_DATA_CENTER = 'US'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.com/oauth/v2/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
    )
    expect(html).toContain('Success!')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresIn: 3600
    })
  })

  it('should use correct token domain for AU data center', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    process.env.ZOHO_DATA_CENTER = 'AU'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.com.au/oauth/v2/token',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(html).toContain('Success!')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresIn: 3600
    })
  })

  it('should use correct token domain for EU data center', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    process.env.ZOHO_DATA_CENTER = 'EU'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.eu/oauth/v2/token',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(html).toContain('Success!')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresIn: 3600
    })
  })

  it('should use correct token domain for IN data center', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    process.env.ZOHO_DATA_CENTER = 'IN'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.in/oauth/v2/token',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(html).toContain('Success!')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresIn: 3600
    })
  })

  it('should use correct token domain for CN data center', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    process.env.ZOHO_DATA_CENTER = 'CN'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.com.cn/oauth/v2/token',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(html).toContain('Success!')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresIn: 3600
    })
  })

  it('should use default AU domain for unknown data center', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    process.env.ZOHO_DATA_CENTER = 'UNKNOWN'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(logger.warn).toHaveBeenCalledWith('Unknown Zoho data center, using default', { dataCenter: 'UNKNOWN' })
    expect(fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.com.au/oauth/v2/token',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(html).toContain('Success!')
  })

  it('should handle successful token exchange with refresh token in development', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    // Mock NODE_ENV for this test only
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
      writable: true
    })
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('Success!')
    expect(html).toContain('Refresh Token Generated Successfully!')
    expect(html).toContain('ZOHO_REFRESH_TOKEN=test-refresh-token')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresIn: 3600
    })
    expect(logger.info).toHaveBeenCalledWith('ZOHO REFRESH_TOKEN (Development only):', {
      refreshToken: expect.any(String)
    })
    expect(AuditLogger.log).toHaveBeenCalledWith({
      action: 'ZOHO_OAUTH_SUCCESS',
      resource: 'zoho',
      details: { 
        hasRefreshToken: true,
        hasAccessToken: true
      },
      success: true
    })
  })

  it('should handle successful token exchange without refresh token', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const mockTokenResponse = {
      access_token: 'test-access-token',
      expires_in: 3600
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTokenResponse)
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('Success!')
    expect(html).toContain('No Refresh Token Received')
    expect(logger.info).toHaveBeenCalledWith('Zoho OAuth token exchange successful', {
      hasAccessToken: true,
      hasRefreshToken: false,
      expiresIn: 3600
    })
  })

  it('should handle token exchange failure with error response', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Invalid authorization code'
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('OAuth Process Failed')
    expect(logger.error).toHaveBeenCalledWith('Zoho token exchange failed', {
      status: 400,
      statusText: 'Bad Request',
      responseBody: 'Invalid authorization code'
    })
  })

  it('should handle invalid JSON response from Zoho', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'invalid json response'
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('OAuth Process Failed')
    expect(logger.error).toHaveBeenCalledWith('Invalid JSON response from Zoho', {
      responseText: 'invalid json response',
      error: expect.stringContaining('Unexpected token')
    })
  })

  it('should handle network error during token exchange', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const networkError = new Error('Network connection failed')
    ;(fetch as jest.Mock).mockRejectedValue(networkError)

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('OAuth Process Failed')
    expect(logger.error).toHaveBeenCalledWith('Network error during Zoho token exchange', {
      error: 'Network connection failed',
      stack: networkError.stack
    })
  })

  it('should handle system error and call captureErrorSafe', async () => {
    // ARRANGE
    process.env.ZOHO_CLIENT_ID = 'test-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-secret'
    
    const mockRequest = {
      url: 'https://example.com/api/zoho/callback?code=test-code'
    } as unknown as Request

    const systemError = new Error('System error occurred')
    ;(fetch as jest.Mock).mockImplementation(() => {
      throw systemError
    })

    // ACT
    const response = await GET(mockRequest)
    const html = await response.text()

    // ASSERT
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('OAuth Process Failed')
    expect(captureErrorSafe).toHaveBeenCalledWith(systemError, {
      action: 'zoho_oauth_callback',
      endpoint: '/api/zoho/callback',
      service: 'zoho'
    })
    expect(logger.error).toHaveBeenCalledWith('Zoho OAuth callback failed with system error', {
      error: expect.stringContaining('System error occurred'),
      stack: systemError.stack
    })
  })
})
