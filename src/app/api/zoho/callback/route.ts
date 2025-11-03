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
        redirect_uri: 'https://your-domain.com/api/zoho/callback', // Update with your actual domain
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    // Log the refresh token - SAVE THIS!
    console.log('=== ZOHO REFRESH TOKEN ===');
    console.log('REFRESH_TOKEN:', tokenData.refresh_token);
    console.log('ACCESS_TOKEN:', tokenData.access_token);
    console.log('==========================');
    
    return new NextResponse(`
      <h1>Zoho OAuth Success!</h1>
      <p>Check your server console for the refresh token.</p>
      <p><strong>Save the refresh token in your environment variables!</strong></p>
      <pre>${JSON.stringify(tokenData, null, 2)}</pre>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return new NextResponse('Token exchange failed', { status: 500 });
  }
}
