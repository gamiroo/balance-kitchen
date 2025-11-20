// src/app/api/zoho/auth/route.ts
import { NextResponse } from 'next/server'
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

export async function GET() {
    console.log('=== DEBUG ENV VARS ===')
  console.log('CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? 'SET' : 'MISSING')
  console.log('CLIENT_ID_VALUE:', process.env.ZOHO_CLIENT_ID?.substring(0, 10) + '...')
  console.log('=====================')
  try {
    const clientId = process.env.ZOHO_CLIENT_ID
    
    logger.info('Zoho OAuth authorization initiated')
    
    if (!clientId) {
      logger.error('Zoho OAuth failed - missing client ID')
      AuditLogger.log({
        action: 'ZOHO_AUTH_INIT',
        resource: 'zoho',
        details: { error: 'MISSING_CLIENT_ID' },
        success: false
      })
      
      return NextResponse.json({ 
        success: false,
        error: 'ZOHO_CLIENT_ID not configured in environment variables' 
      }, { status: 500 })
    }
    
    // Use Australian data center by default (you can make this configurable)
    const dataCenter = process.env.ZOHO_DATA_CENTER || 'AU'
    let authDomain = 'https://accounts.zoho.com.au'
    
    switch (dataCenter.toUpperCase()) {
      case 'US':
        authDomain = 'https://accounts.zoho.com'
        break
      case 'AU':
        authDomain = 'https://accounts.zoho.com.au'
        break
      case 'EU':
        authDomain = 'https://accounts.zoho.eu'
        break
      case 'IN':
        authDomain = 'https://accounts.zoho.in'
        break
      case 'CN':
        authDomain = 'https://accounts.zoho.com.cn'
        break
      default:
        logger.warn('Unknown Zoho data center, using default', { dataCenter })
    }
    
    const redirectUri = encodeURIComponent('https://balance-kitchen.vercel.app/api/zoho/callback')
    const scope = encodeURIComponent('ZohoCRM.modules.CREATE,ZohoCRM.users.ALL,ZohoCRM.org.ALL')
    const prompt = encodeURIComponent('consent')
    
    const authUrl = `${authDomain}/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&prompt=${prompt}`
    
    logger.debug('Redirecting to Zoho OAuth URL', {
      authDomain,
      clientId: clientId ? `***${clientId.slice(-4)}` : 'MISSING',
      scope,
      redirectUri
    })
    
    AuditLogger.log({
      action: 'ZOHO_AUTH_REDIRECT',
      resource: 'zoho',
      details: { dataCenter, scope },
      success: true
    })
    
    return NextResponse.redirect(authUrl)
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'zoho_oauth_init',
      endpoint: '/api/zoho/auth',
      service: 'zoho'
    })
    
    logger.error('Zoho OAuth initialization failed', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to initialize Zoho OAuth process' 
    }, { status: 500 })
  }
}
