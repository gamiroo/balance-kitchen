// src/app/api/zoho/callback/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return new NextResponse('Authorization code not found', { status: 400 });
  }

  try {
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        redirect_uri: 'https://balance-kitchen.vercel.app/api/zoho/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    
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
          <p><strong>Save this refresh token in your environment variables:</strong></p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all;">
            <code>REFRESH_TOKEN: ${tokenData.refresh_token || 'NOT FOUND'}</code>
          </div>
          <p style="margin-top: 20px;"><a href="/" style="color: #0066cc;">Return to website</a></p>
          <details style="margin-top: 20px;">
            <summary>Full response data</summary>
            <pre style="background: #f8f8f8; padding: 10px; overflow-x: auto;">${JSON.stringify(tokenData, null, 2)}</pre>
          </details>
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
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>Check server logs for more details.</p>
        </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
