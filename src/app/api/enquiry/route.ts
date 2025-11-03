// src/app/api/enquiry/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { generateAdminEmailHTML, generateConfirmationEmailHTML } from '../../../lib/email-templates';
import { ZohoCRMService, SanitizedEnquiry } from '../../../lib/zoho-crm';

// Environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER || 'your-admin@yourdomain.com';
const SMTP_PASS = process.env.SMTP_PASS || 'your-app-password';


// Optional: Recaptcha
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const ENABLE_RECAPTCHA = Boolean(RECAPTCHA_SECRET_KEY);

// Optional: Upstash Ratelimit
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const ENABLE_RATE_LIMIT = Boolean(UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN);

// Optional: ZohoCRM Integration
const ENABLE_CRM = process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN;

// Add this right after the environment variable declarations
console.log('=== ZOHO ENVIRONMENT VARIABLES ===');
console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? '✅ SET' : '❌ MISSING');
console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? '✅ SET' : '❌ MISSING');
console.log('ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? '✅ SET' : '❌ MISSING');
console.log('ENABLE_CRM:', ENABLE_CRM ? '✅ ENABLED' : '❌ DISABLED');
console.log('====================================');


// Define the interface for rate limiter
interface RateLimiter {
  limit: (identifier: string) => Promise<{ success: boolean; resetAt?: number }>;
}

// Initialize rate limiter (Upstash Ratelimit) if enabled
type RateLimitResult = { success: boolean; resetAt?: number };
let rateLimiter: RateLimiter | null = null;

if (ENABLE_RATE_LIMIT) {
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({
      url: UPSTASH_REDIS_URL!,
      token: UPSTASH_REDIS_TOKEN!,
    });

    const upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 requests per 5 minutes per IP
      analytics: true,
      prefix: 'enquiry',
    });

    // Wrap the Upstash limiter to match our interface
    rateLimiter = {
      limit: async (identifier: string) => {
        const result = await upstashLimiter.limit(identifier);
        return { success: result.success, resetAt: result.reset };
      }
    };
  } catch (importError: unknown) {
    console.error('Failed to initialize Upstash rate limiter:', importError);
  }
}

// Simple in-memory fallback rate limiter if Upstash not configured
const inMemoryRateStore = new Map<string, { count: number; resetAt: number }>();
const inMemoryLimiter = async (identifier: string): Promise<RateLimitResult> => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 5;

  const record = inMemoryRateStore.get(identifier);
  if (!record || now > record.resetAt) {
    inMemoryRateStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (record.count >= maxRequests) {
    return { success: false, resetAt: record.resetAt };
  }

  record.count += 1;
  inMemoryRateStore.set(identifier, record);
  return { success: true };
};

// Zod validation schema
const EnquirySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  preferredName: z.string().max(50, 'Preferred name too long').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30, 'Phone number too long').optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  howDidYouHear: z.enum(['Search Engine','Social Media','Friend / Family','Google Ads','Influencer / Blogger','Event / Conference','Online Forum / Community','Other']),
  referrer: z.string().max(100, 'Referrer too long').optional().or(z.literal('')),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
});

// Sanitize strings to prevent injection
const sanitize = (input: string) =>
  input
    .replace(/[<>]/g, '') // basic HTML tag removal
    .replace(/[\u0000-\u001F\u007F]/g, '') // control characters
    .trim();

// Validate reCAPTCHA if enabled
const validateRecaptcha = async (recaptchaToken?: string): Promise<boolean> => {
  if (!ENABLE_RECAPTCHA) return true;

  if (!recaptchaToken) {
    throw new Error('Recaptcha verification failed');
  }

  const params = new URLSearchParams();
  params.append('secret', RECAPTCHA_SECRET_KEY!);
  params.append('response', recaptchaToken);

  const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  const resp = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await resp.json() as { success?: boolean };
  if (!data.success) {
    throw new Error('Recaptcha verification failed');
  }

  return true;
};

// Rate limit by IP
const checkRateLimit = async (ip: string): Promise<boolean> => {
  if (rateLimiter) {
    const { success } = await rateLimiter.limit(ip);
    return success;
  } else {
    const { success } = await inMemoryLimiter(ip);
    return success;
  }
};

// Create transporter for Gmail
const createTransporter = () =>
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    '0.0.0.0';

  // Rate limit check
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Validate reCAPTCHA
  try {
    await validateRecaptcha((body as Record<string, unknown>)?.gRecaptchaResponse as string | undefined);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Security verification failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 403 }
    );
  }

  // Parse and validate form data
  const parsed = EnquirySchema.safeParse(body);
  if (!parsed.success) {
    console.error('Validation failed:', parsed.error.issues);
    const message = parsed.error.issues.map(i => i.message).join(', ');
    return NextResponse.json({ 
      error: 'Validation failed',
      details: parsed.error.issues,
      message 
    }, { status: 400 });
  }

  const data = parsed.data;

   // Build sanitized data directly as SanitizedEnquiry
  const sanitized: SanitizedEnquiry = {
    firstName: sanitize(data.firstName),
    lastName: sanitize(data.lastName),
    preferredName: data.preferredName ? sanitize(data.preferredName) : undefined,
    email: data.email.toLowerCase().trim(),
    phone: data.phone ? sanitize(data.phone) : undefined,
    subject: sanitize(data.subject), // Always string due to validation
    howDidYouHear: data.howDidYouHear,
    referrer: data.referrer ? sanitize(data.referrer) : undefined,
    message: data.message.trim(),
    utm_source: data.utm_source ? sanitize(data.utm_source) : undefined,
    utm_medium: data.utm_medium ? sanitize(data.utm_medium) : undefined,
    utm_campaign: data.utm_campaign ? sanitize(data.utm_campaign) : undefined,
  };

  const displayName = sanitized.preferredName
    ? `${sanitized.firstName} "${sanitized.preferredName}" ${sanitized.lastName}`
    : `${sanitized.firstName} ${sanitized.lastName}`;

  // UTM summary
  const utmParts = ['utm_source', 'utm_medium', 'utm_campaign']
    .filter((k) => sanitized[k as keyof SanitizedEnquiry])
    .map((k) => `${k}: ${sanitized[k as keyof SanitizedEnquiry]}`);

  // Generate request ID
  const requestId = crypto.randomUUID();

  // Initialize CRM result with proper type
  let crmResult: { leadId: string; success: boolean; error?: string } = { 
    leadId: '', 
    success: false 
  };


  try {
    const transporter = createTransporter();
    
    // Verify transporter (skip in production to reduce latency if you trust config)
    if (process.env.NODE_ENV !== 'production') {
      await transporter.verify();
    }

    // Prepare email data
    const emailData = {
      displayName,
      sanitized,
      utmParts,
      subject: sanitized.subject || 'General Enquiry'
    };

    // Create lead in ZohoCRM (if enabled and credentials are available)
    if (ENABLE_CRM) {
      try {
        console.log('Creating lead in ZohoCRM...');
        const zohoService = new ZohoCRMService();
        crmResult = await zohoService.createEnquiryLead(displayName, sanitized);
        
        if (crmResult.success) {
          console.log('ZohoCRM lead created successfully:', crmResult.leadId);
        } else {
          console.error('Failed to create ZohoCRM lead:', crmResult.error);
        }
      } catch (crmError: unknown) {
        console.error('Error creating ZohoCRM lead:', crmError);
        crmResult.error = crmError instanceof Error ? crmError.message : 'Unknown CRM error';
        // Continue processing even if CRM fails
      }
    } else {
      console.log('ZohoCRM integration not enabled - skipping CRM creation');
    }

    // Send email to admin
    await transporter.sendMail({
      from: `"Balance Kitchen Website" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[Balance Kitchen] ${sanitized.subject}: ${displayName}`,
      text: `
New enquiry from Balance Kitchen website:

Name: ${displayName}
Email: ${sanitized.email}
Phone: ${sanitized.phone || 'Not provided'}
How Did You Hear About Us: ${sanitized.howDidYouHear}
Referrer: ${sanitized.referrer || 'Not provided'}
Subject: ${sanitized.subject}

Message:
${sanitized.message}

${utmParts.length ? `Tracking: ${utmParts.join(' | ')}` : ''}

---
This message was sent from the Balance Kitchen website contact form.
Request ID: ${requestId}
${crmResult.success ? `CRM Lead ID: ${crmResult.leadId}` : `CRM: ${crmResult.error || 'Failed to create lead'}`}
      `,
      html: generateAdminEmailHTML(emailData, requestId, ip),
    });

    // Send confirmation to user
    try {
      await transporter.sendMail({
        from: `"Balance Kitchen" <${ADMIN_EMAIL}>`,
        to: sanitized.email,
        subject: 'Thank you for your enquiry - Balance Kitchen',
        text: `
Thank you for your enquiry, ${displayName.split(' ')[0]}!

We've received your message and will respond within 24 hours.

Subject: ${sanitized.subject}

Message preview:
${sanitized.message.substring(0, 200)}${sanitized.message.length > 200 ? '...' : ''}

Best regards,
Balance Kitchen Team

Request ID: ${requestId}
        `,
        html: generateConfirmationEmailHTML(emailData, requestId),
      });
    } catch (confirmationError: unknown) {
      console.error('Failed to send confirmation email:', confirmationError);
      // Don't fail the request if the confirmation fails
    }

    // Return success response with CRM info
    return NextResponse.json({ 
      success: true, 
      requestId,
      crmLeadId: crmResult.leadId || undefined,
      crmCreated: crmResult.success,
      crmEnabled: ENABLE_CRM,
      crmError: crmResult.error || undefined
    });

  } catch (error: unknown) {
    console.error('Error processing enquiry:', error);
    
    // Still try to send admin notification about the error
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Balance Kitchen Website" <${SMTP_USER}>`,
        to: ADMIN_EMAIL,
        subject: `[ERROR] Failed Enquiry Processing - ${requestId}`,
        text: `
An error occurred while processing an enquiry:

Error: ${error instanceof Error ? error.message : 'Unknown error'}
Request ID: ${requestId}
IP: ${ip}
Enquiry Data: ${JSON.stringify({ displayName, ...sanitized }, null, 2)}

CRM Status: ${crmResult.success ? `Created (${crmResult.leadId})` : `Failed (${crmResult.error})`}
        `,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fee; border: 1px solid #fcc;">
            <h2 style="color: #c00;">Error Processing Enquiry</h2>
            <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p><strong>Request ID:</strong> ${requestId}</p>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Enquiry Data:</strong></p>
            <pre style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${JSON.stringify({ displayName, ...sanitized }, null, 2)}</pre>
            <p><strong>CRM Status:</strong> ${crmResult.success ? `Created (${crmResult.leadId})` : `Failed (${crmResult.error})`}</p>
          </div>
        `,
      });
    } catch (notificationError: unknown) {
      console.error('Failed to send error notification:', notificationError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to process enquiry. Please try again later.',
        requestId,
        crmEnabled: ENABLE_CRM
      },
      { status: 500 }
    );
  }
}
