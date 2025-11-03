// src/app/api/zoho/auth/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: 'ZOHO_CLIENT_ID not configured' }, { status: 500 });
  }
  
  // Use Australian data center by default (you can make this configurable)
  const dataCenter = process.env.ZOHO_DATA_CENTER || 'AU';
  let authDomain = 'https://accounts.zoho.com.au';
  
  switch (dataCenter.toUpperCase()) {
    case 'US':
      authDomain = 'https://accounts.zoho.com';
      break;
    case 'AU':
      authDomain = 'https://accounts.zoho.com.au';
      break;
    case 'EU':
      authDomain = 'https://accounts.zoho.eu';
      break;
    case 'IN':
      authDomain = 'https://accounts.zoho.in';
      break;
    case 'CN':
      authDomain = 'https://accounts.zoho.com.cn';
      break;
  }
  
  const redirectUri = encodeURIComponent('https://balance-kitchen.vercel.app/api/zoho/callback');
  const scope = encodeURIComponent('ZohoCRM.modules.CREATE');
  const prompt = encodeURIComponent('consent');
  
  const authUrl = `${authDomain}/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&prompt=${prompt}`;
  
  console.log('Zoho Auth URL:', authUrl);
  
  return NextResponse.redirect(authUrl);
}
