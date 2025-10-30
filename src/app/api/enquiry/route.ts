// src/app/api/enquiry/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { generateAdminEmailHTML, generateConfirmationEmailHTML } from '../../../lib/email-templates';

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

  // Sanitize inputs
  const sanitized = {
    firstName: sanitize(data.firstName),
    lastName: sanitize(data.lastName),
    preferredName: data.preferredName ? sanitize(data.preferredName) : '',
    email: data.email.toLowerCase().trim(),
    phone: sanitize(data.phone || ''),
    subject: sanitize(data.subject),
    howDidYouHear: data.howDidYouHear,
    referrer: sanitize(data.referrer || ''),
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
    .filter((k) => (sanitized as Record<string, string | undefined>)[k])
    .map((k) => `${k}: ${(sanitized as Record<string, string | undefined>)[k]}`);

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
      utmParts
    };
    
    const requestId = crypto.randomUUID();

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

    return NextResponse.json({ success: true, requestId });
  } catch (error: unknown) {
    console.error('Error sending enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to send enquiry. Please try again later.' },
      { status: 500 }
    );
  }
}
