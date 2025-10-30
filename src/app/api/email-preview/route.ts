// src/app/api/email-preview/route.ts
import { NextResponse } from 'next/server';
import { generateAdminEmailHTML, generateConfirmationEmailHTML, getMockEmailData } from '../../../lib/email-templates';

// GET route - displays admin email by default, confirmation with ?type=confirmation
export async function GET(request: Request) {
  const url = new URL(request.url);
  const emailType = url.searchParams.get('type') || 'admin';
  
  const mockData = getMockEmailData();
  const requestId = 'preview-' + Date.now();
  const ip = '127.0.0.1';
  
  try {
    if (emailType === 'confirmation') {
      const html = generateConfirmationEmailHTML(mockData, requestId);
      return new NextResponse(html, {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'X-Email-Type': 'confirmation',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // Default to admin email
    const html = generateAdminEmailHTML(mockData, requestId, ip);
    return new NextResponse(html, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'X-Email-Type': 'admin',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}

// POST route - allows choosing email type via JSON body
export async function POST(request: Request) {
  try {
    const { type = 'admin' } = await request.json().catch(() => ({ type: 'admin' }));
    
    const mockData = getMockEmailData();
    const requestId = 'preview-' + Date.now();
    
    if (type === 'confirmation') {
      const html = generateConfirmationEmailHTML(mockData, requestId);
      return new NextResponse(html, { 
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      });
    }
    
    const html = generateAdminEmailHTML(mockData, requestId, '127.0.0.1');
    return new NextResponse(html, { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      } 
    });
    
  } catch {
    return NextResponse.json({ 
      error: 'Invalid request. Use ?type=admin or ?type=confirmation, or send {"type": "admin"|"confirmation"} in POST body.' 
    }, { status: 400 });
  }
}
