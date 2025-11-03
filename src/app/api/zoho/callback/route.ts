// src/app/api/zoho/callback/route.ts
import { NextResponse } from 'next/server';

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

  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'https://balance-kitchen.vercel.app/api/zoho/callback',
      grant_type: 'authorization_code',
    });

    console.log('Token request params:', {
      code: code ? '***' + code.slice(-4) : 'MISSING',
      client_id: clientId ? '***' + clientId.slice(-4) : 'MISSING',
      redirect_uri: 'https://balance-kitchen.vercel.app/api/zoho/callback',
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
    console.log('Token response body:', responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${responseText}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    // Log the refresh token - SAVE THIS!
    console.log('=== ZOHO REFRESH TOKEN ===');
    console.log('REFRESH_TOKEN:', tokenData.refresh_token);
    console.log('ACCESS_TOKEN:', tokenData.access_token);
    console.log('==========================');
    
    // Also return it in the response so you can see it in browser
    return new NextResponse(`
      <html>
        <head><title>Zoho OAuth Success</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Zoho OAuth Success!</h1>
          ${tokenData.refresh_token ? `
            <p><strong>Save this refresh token in your environment variables:</strong></p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all; margin: 15px 0;">
              <code style="font-size: 14px;">REFRESH_TOKEN: ${tokenData.refresh_token}</code>
            </div>
            <p style="color: #2d7a37; font-weight: bold;">✅ Refresh token found! Add this to your Vercel environment variables.</p>
          ` : `
            <p style="color: #cc0000; font-weight: bold;">❌ No refresh token found in response!</p>
            <p>This might be because:</p>
            <ul>
              <li>Invalid client credentials</li>
              <li>Redirect URI mismatch</li>
              <li>Client not configured for offline access</li>
            </ul>
          `}
          <details style="margin-top: 20px;">
            <summary>Full response data</summary>
            <pre style="background: #f8f8f8; padding: 10px; overflow-x: auto; font-size: 12px;">${JSON.stringify(tokenData, null, 2)}</pre>
          </details>
          <p style="margin-top: 20px;"><a href="/" style="color: #0066cc;">Return to website</a></p>
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
          <p><strong>Possible causes:</strong></p>
          <ul>
            <li>Invalid client ID or secret</li>
            <li>Redirect URI not authorized in Zoho console</li>
            <li>Client not configured for offline access (access_type=offline)</li>
            <li>Authorization code expired or already used</li>
          </ul>
          <p>Check server logs for more details.</p>
          <p style="margin-top: 20px;"><a href="/api/zoho/auth" style="color: #0066cc;">Try again</a></p>
        </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
