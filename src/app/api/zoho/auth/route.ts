import { NextResponse } from 'next/server';
import { ZohoCRMService } from '../../../../lib/zoho-crm';

type EnquiryPayload = {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  howDidYouHear?: string;
  referrer?: string;
  message?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

function sanitizeString(value: unknown, max = 255): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const HEAR_OPTIONS = [
  'Search Engine',
  'Social Media',
  'Friend / Family',
  'Google Ads',
  'Influencer / Blogger',
  'Event / Conference',
  'Online Forum / Community',
  'Other',
] as const;

function isValidHearOption(value: string): value is (typeof HEAR_OPTIONS)[number] {
  return (HEAR_OPTIONS as readonly string[]).includes(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<EnquiryPayload>;

    const firstName = sanitizeString(body.firstName, 80);
    const lastName = sanitizeString(body.lastName, 80);
    const preferredName = sanitizeString(body.preferredName, 80);
    const email = sanitizeString(body.email, 255).toLowerCase();
    const phone = sanitizeString(body.phone, 40);
    const subject = sanitizeString(body.subject, 120);
    const howDidYouHear = sanitizeString(body.howDidYouHear, 80);
    const referrer = sanitizeString(body.referrer, 120);
    const message = sanitizeString(body.message, 2000);

    if (!firstName) {
      return NextResponse.json({ error: 'firstName is required' }, { status: 400 });
    }
    if (!lastName) {
      return NextResponse.json({ error: 'lastName is required' }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    if (!isValidHearOption(howDidYouHear)) {
      return NextResponse.json({ error: 'Invalid howDidYouHear value' }, { status: 400 });
    }

    const sanitized = {
      firstName,
      lastName,
      preferredName,
      email,
      phone,
      subject,
      howDidYouHear,
      referrer,
      message,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
    };

    const zoho = new ZohoCRMService();

    // Note: displayName is not used internally (Lead_Name is built from first + last).
    // You can pass anything meaningful (e.g., full name) or keep it for future use.
    const displayName = [firstName, lastName].filter(Boolean).join(' ');

    const result = await zoho.createEnquiryLead(displayName, sanitized, /* requestId */ crypto.randomUUID());

    if (!result.success) {
      console.error('Zoho lead creation failed:', result.error);
      return NextResponse.json(
        { error: result.error ?? 'Failed to create lead in Zoho CRM' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, leadId: result.leadId }, { status: 201 });
  } catch (err) {
    console.error('Unhandled error in /api/enquiry:', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
