// src/app/api/zoho/callback/route.ts
import { NextResponse } from 'next/server';

interface ZohoTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  [key: string]: string | number | undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return new NextResponse('Authorization code not found', { status: 400 });
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;


  if (!clientId || !clientSecret) {
    return new NextResponse(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: red;">
          <h1>❌ Configuration Error</h1>
          <p>Missing Zoho credentials in environment variables:</p>
          <ul>
            <li>ZOHO_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}</li>
            <li>ZOHO_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}</li>
          </ul>
          <p>Please set these in your Vercel environment variables.</p>
        </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Use the correct data center for token exchange
  const dataCenter = process.env.ZOHO_DATA_CENTER || 'AU';
  let tokenDomain = 'https://accounts.zoho.com.au';
  
  switch (dataCenter.toUpperCase()) {
    case 'US':
      tokenDomain = 'https://accounts.zoho.com';
      break;
    case 'AU':
      tokenDomain = 'https://accounts.zoho.com.au';
      break;
    case 'EU':
      tokenDomain = 'https://accounts.zoho.eu';
      break;
    case 'IN':
      tokenDomain = 'https://accounts.zoho.in';
      break;
    case 'CN':
      tokenDomain = 'https://accounts.zoho.com.cn';
      break;
  }

  try {
    const params = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'https://balance-kitchen.vercel.app/api/zoho/callback',
      grant_type: 'authorization_code',
    });

    console.log('Making token request with params:');
    console.log('- code:', code ? `***${code.slice(-4)}` : 'MISSING');
    console.log('- client_id:', clientId ? `***${clientId.slice(-4)}` : 'MISSING');
    console.log('- redirect_uri:', 'https://balance-kitchen.vercel.app/api/zoho/callback');
    console.log('- token endpoint:', `${tokenDomain}/oauth/v2/token`);

    const tokenResponse = await fetch(`${tokenDomain}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response body:', responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${responseText}`);
    }

    let tokenData: ZohoTokenResponse;
    try {
      tokenData = JSON.parse(responseText) as ZohoTokenResponse;
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    // Log the refresh token - SAVE THIS!
    console.log('=== ZOHO TOKEN RESPONSE ===');
    console.log('Full response:', JSON.stringify(tokenData, null, 2));
    console.log('REFRESH_TOKEN:', tokenData.refresh_token || 'NOT FOUND');
    console.log('ACCESS_TOKEN:', tokenData.access_token || 'NOT FOUND');
    console.log('==========================');
    
    return new NextResponse(`
      <html>
        <head><title>Zoho OAuth Success</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Zoho OAuth Success!</h1>
          ${tokenData.refresh_token ? `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #155724; margin-top: 0;">🎉 Refresh Token Generated!</h3>
              <p><strong>Save this refresh token in your Vercel environment variables:</strong></p>
              <div style="background: #f8f9fa; padding: 10px; border-radius: 3px; word-break: break-all; font-family: monospace; font-size: 14px;">
                ZOHO_REFRESH_TOKEN=${tokenData.refresh_token}
              </div>
              <p style="margin-top: 10px; font-size: 14px;">
                <strong>Important:</strong> Copy this value and add it to your Vercel environment variables immediately.
              </p>
            </div>
          ` : `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #721c24; margin-top: 0;">❌ No Refresh Token</h3>
              <p>Response received but no refresh token found. This usually means:</p>
              <ul>
                <li>Client credentials are still incorrect</li>
                <li>Client not configured for offline access</li>
                <li>Authorization code already used or expired</li>
              </ul>
            </div>
          `}
          <details style="margin-top: 20px;">
            <summary>Full response data</summary>
            <pre style="background: #f8f9fa; padding: 10px; overflow-x: auto; font-size: 12px;">${JSON.stringify(tokenData, null, 2)}</pre>
          </details>
          <p style="margin-top: 20px;"><a href="/" style="color: #007bff;">Return to website</a></p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return new NextResponse(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: red;">
          <h1>❌ Token exchange failed</h1>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p><strong>Common causes:</strong></p>
          <ul>
            <li>Invalid client ID or secret</li>
            <li>Redirect URI not authorized</li>
            <li>Client not configured for offline access</li>
            <li>Authorization code expired or already used</li>
            <li>Wrong data center endpoint</li>
          </ul>
          <p>Check server logs for more details.</p>
          <p style="margin-top: 20px;"><a href="/api/zoho/auth" style="color: #007bff;">Try again</a></p>
        </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
