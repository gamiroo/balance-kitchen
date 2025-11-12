// src/app/api/zoho/callback/route.ts
import { NextResponse } from 'next/server'
import { captureErrorSafe } from '../../../../lib/utils/error-utils'
import { logger } from '../../../../lib/logging/logger'
import { AuditLogger } from '../../../../lib/logging/audit-logger'

interface ZohoTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  [key: string]: string | number | undefined
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    logger.info('Zoho OAuth callback received', { 
      hasCode: !!code,
      timestamp: new Date().toISOString()
    })

    if (!code) {
      logger.warn('Zoho OAuth callback failed - no authorization code')
      return new NextResponse(`
        <html>
          <head><title>Zoho OAuth Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #dc3545;">❌ Authorization Code Missing</h1>
              <p>The authorization code was not found in the callback URL.</p>
              <p><strong>Possible causes:</strong></p>
              <ul>
                <li>Authorization was cancelled</li>
                <li>Invalid redirect URI configuration</li>
                <li>Session timeout</li>
              </ul>
              <div style="margin-top: 20px; padding: 15px; background: #f8d7da; border-radius: 5px;">
                <p><strong>Next steps:</strong></p>
                <a href="/api/zoho/auth" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Try Again</a>
              </div>
            </div>
          </body>
        </html>
      `, { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const clientId = process.env.ZOHO_CLIENT_ID
    const clientSecret = process.env.ZOHO_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      logger.error('Zoho OAuth configuration error - missing credentials')
      AuditLogger.log({
        action: 'ZOHO_CONFIG_ERROR',
        resource: 'zoho',
        details: { 
          missingClientId: !clientId,
          missingClientSecret: !clientSecret 
        },
        success: false,
        error: 'MISSING_CREDENTIALS'
      })
      
      return new NextResponse(`
        <html>
          <head><title>Zoho Configuration Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #dc3545;">❌ Configuration Error</h1>
              <p>Missing Zoho credentials in environment variables:</p>
              <ul style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                <li>ZOHO_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}</li>
                <li>ZOHO_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}</li>
              </ul>
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                <p><strong>Action required:</strong> Please set these in your Vercel environment variables.</p>
              </div>
            </div>
          </body>
        </html>
      `, { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Use the correct data center for token exchange
    const dataCenter = process.env.ZOHO_DATA_CENTER || 'AU'
    let tokenDomain = 'https://accounts.zoho.com.au'
    
    switch (dataCenter.toUpperCase()) {
      case 'US':
        tokenDomain = 'https://accounts.zoho.com'
        break
      case 'AU':
        tokenDomain = 'https://accounts.zoho.com.au'
        break
      case 'EU':
        tokenDomain = 'https://accounts.zoho.eu'
        break
      case 'IN':
        tokenDomain = 'https://accounts.zoho.in'
        break
      case 'CN':
        tokenDomain = 'https://accounts.zoho.com.cn'
        break
      default:
        logger.warn('Unknown Zoho data center, using default', { dataCenter })
    }

    logger.debug('Making Zoho token exchange request', {
      tokenDomain,
      clientId: clientId ? `***${clientId.slice(-4)}` : 'MISSING',
      redirectUri: 'https://balance-kitchen.vercel.app/api/zoho/callback'
    })

    try {
      const params = new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'https://balance-kitchen.vercel.app/api/zoho/callback',
        grant_type: 'authorization_code',
      })

      const tokenResponse = await fetch(`${tokenDomain}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const responseText = await tokenResponse.text()
      logger.debug('Zoho token response received', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        responseLength: responseText.length
      })

      if (!tokenResponse.ok) {
        const errorDetails = {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          responseBody: responseText.substring(0, 500)
        }
        
        logger.error('Zoho token exchange failed', errorDetails)
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${responseText}`)
      }

      let tokenData: ZohoTokenResponse
      try {
        tokenData = JSON.parse(responseText) as ZohoTokenResponse
      } catch (parseError) {
        logger.error('Invalid JSON response from Zoho', {
          responseText: responseText.substring(0, 500),
          error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        })
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
      }

      // Log token information (without exposing actual tokens in logs)
      logger.info('Zoho OAuth token exchange successful', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      })

      // Log the refresh token securely for development (REMOVE IN PRODUCTION)
      if (process.env.NODE_ENV === 'development' && tokenData.refresh_token) {
        logger.info('ZOHO REFRESH_TOKEN (Development only):', {
          refreshToken: tokenData.refresh_token ? `***${tokenData.refresh_token.slice(-8)}` : 'NOT FOUND'
        })
      }

      AuditLogger.log({
        action: 'ZOHO_OAUTH_SUCCESS',
        resource: 'zoho',
        details: { 
          hasRefreshToken: !!tokenData.refresh_token,
          hasAccessToken: !!tokenData.access_token
        },
        success: true
      })
      
      return new NextResponse(`
        <html>
          <head>
            <title>Zoho OAuth Success</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f8f9fa; margin: 0;">
            <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #28a745; font-size: 2.5rem; margin: 0;">✅ Success!</h1>
                <p style="font-size: 1.2rem; color: #6c757d; margin: 10px 0 0 0;">Zoho OAuth Connection Established</p>
              </div>
              
              ${tokenData.refresh_token ? `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #155724; margin-top: 0; display: flex; align-items: center;">
                    <span style="font-size: 1.5rem; margin-right: 10px;">🎉</span>
                    Refresh Token Generated Successfully!
                  </h3>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; word-break: break-all; font-family: monospace; font-size: 14px; color: #495057;">
                    ZOHO_REFRESH_TOKEN=${tokenData.refresh_token}
                  </div>
                  <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; font-weight: 500; color: #856404;">
                      <strong>⚠️ Important:</strong> Copy this value and add it to your Vercel environment variables immediately.
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #6c757d;">
                      This token provides long-term access to Zoho CRM and should be kept secure.
                    </p>
                  </div>
                </div>
              ` : `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #721c24; margin-top: 0; display: flex; align-items: center;">
                    <span style="font-size: 1.5rem; margin-right: 10px;">❌</span>
                    No Refresh Token Received
                  </h3>
                  <p>This usually means one of the following:</p>
                  <ul style="color: #721c24;">
                    <li>Client credentials are still incorrect</li>
                    <li>Client not configured for offline access</li>
                    <li>Authorization code already used or expired</li>
                  </ul>
                  <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <p><strong>Next steps:</strong></p>
                    <a href="/api/zoho/auth" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Try Again</a>
                  </div>
                </div>
              `}
              
              <details style="margin-top: 30px; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden;">
                <summary style="padding: 15px; background: #e9ecef; cursor: pointer; font-weight: 500;">Full Response Data (for debugging)</summary>
                <pre style="background: #f8f9fa; padding: 15px; margin: 0; overflow-x: auto; font-size: 12px; max-height: 300px;">${JSON.stringify(tokenData, null, 2)}</pre>
              </details>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="/" style="display: inline-block; background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Return to Website</a>
              </div>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      })
    } catch (networkError) {
      logger.error('Network error during Zoho token exchange', {
        error: networkError instanceof Error ? networkError.message : 'Unknown network error',
        stack: networkError instanceof Error ? networkError.stack : undefined
      })
      
      throw networkError
    }
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'zoho_oauth_callback',
      endpoint: '/api/zoho/callback',
      service: 'zoho'
    })
    
    logger.error('Zoho OAuth callback failed with system error', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return new NextResponse(`
      <html>
        <head><title>Zoho OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc3545;">❌ OAuth Process Failed</h1>
            <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            <p><strong>Common causes:</strong></p>
            <ul>
              <li>Invalid client ID or secret</li>
              <li>Redirect URI not authorized in Zoho</li>
              <li>Client not configured for offline access</li>
              <li>Authorization code expired or already used</li>
              <li>Wrong data center endpoint</li>
            </ul>
            <div style="margin-top: 20px; padding: 15px; background: #f8d7da; border-radius: 5px;">
              <p><strong>Next steps:</strong></p>
              <a href="/api/zoho/auth" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Try Again</a>
            </div>
            <p style="margin-top: 20px; font-size: 0.9rem; color: #6c757d;">
              Check server logs for more detailed error information.
            </p>
          </div>
        </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
