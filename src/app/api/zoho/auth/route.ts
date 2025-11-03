// src/app/api/zoho/auth/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: 'ZOHO_CLIENT_ID not configured' }, { status: 500 });
  }
  
  const redirectUri = encodeURIComponent('https://balance-kitchen.vercel.app/api/zoho/callback');
  const scope = encodeURIComponent('ZohoCRM.modules.CREATE');
  const prompt = encodeURIComponent('consent');
  
  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&prompt=${prompt}`;
  
  console.log('Zoho Auth URL:', authUrl); // For debugging
  
  return NextResponse.redirect(authUrl);
}
