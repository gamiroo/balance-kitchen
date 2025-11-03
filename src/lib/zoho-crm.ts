/* -------------------------------------------------------------
   src/lib/zoho-crm.ts
   ------------------------------------------------------------- */

export interface ZohoCRMLead {
  Lead_Name: string;      // Combined first + last name
  Email: string;          // Email address
  Phone?: string;         // Phone number
  Mobile?: string;        // Mobile number
  Lead_Source: string;    // How they found you
  Referrer?: string;      // Who referred them
}

export interface ZohoCRMResponse {
  data: Array<{
    details: {
      id: string;
    };
    status: string;
  }>;
}

/* -----------------------------------------------------------------
   A small type that mirrors the payload we get from the API route.
   This eliminates the `any` usage.
   ----------------------------------------------------------------- */
export interface SanitizedEnquiry {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  subject: string;
  howDidYouHear: (typeof HEAR_OPTIONS)[number]; // reuse the array from the route
  referrer?: string;
  message: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
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

/* -----------------------------------------------------------------
   Service that handles OAuth refresh + Lead creation.
   ----------------------------------------------------------------- */
export class ZohoCRMService {
  private accessToken?: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private dataCenter: string;
  private apiDomain: string;

  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID!;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET!;
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN!;
    
    // Detect data center from environment or default to AU
    const dataCenter = process.env.ZOHO_DATA_CENTER || 'AU';
    
    switch (dataCenter.toUpperCase()) {
      case 'US':
        this.dataCenter = 'https://accounts.zoho.com';
        this.apiDomain = 'https://www.zohoapis.com';
        break;
      case 'AU':
        this.dataCenter = 'https://accounts.zoho.com.au';
        this.apiDomain = 'https://www.zohoapis.com.au';
        break;
      case 'EU':
        this.dataCenter = 'https://accounts.zoho.eu';
        this.apiDomain = 'https://www.zohoapis.eu';
        break;
      case 'IN':
        this.dataCenter = 'https://accounts.zoho.in';
        this.apiDomain = 'https://www.zohoapis.in';
        break;
      case 'CN':
        this.dataCenter = 'https://accounts.zoho.com.cn';
        this.apiDomain = 'https://www.zohoapis.com.cn';
        break;
      default:
        this.dataCenter = 'https://accounts.zoho.com.au';
        this.apiDomain = 'https://www.zohoapis.com.au';
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const tokenEndpoint = `${this.dataCenter}/oauth/v2/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh Zoho access token: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { access_token?: string };
    this.accessToken = data.access_token;

    if (!this.accessToken) {
      console.error('Zoho token response:', data);
      throw new Error('Invalid access token response from Zoho – no access_token field');
    }

    return this.accessToken;
  }

  private async createLeadInZoho(leadData: ZohoCRMLead): Promise<string> {
    const accessToken = await this.getAccessToken();
    const endpoint = `${this.apiDomain}/crm/v2/Leads`;

    const payload = {
      data: [leadData],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create lead in Zoho: ${response.status} - ${errorText}`);
    }

    const result: ZohoCRMResponse = await response.json();

    if (result.data && result.data.length > 0 && result.data[0].status === 'success') {
      return result.data[0].details.id;
    }

    throw new Error('Failed to create lead – unexpected response format');
  }

  /* -----------------------------------------------------------------
     Main entry point – called by the API route.
     ----------------------------------------------------------------- */
  async createEnquiryLead(
    displayName: string,
    sanitized: SanitizedEnquiry,
    requestId: string // kept for traceability – you can delete if not needed
  ): Promise<{ leadId: string; success: boolean; error?: string }> {
    try {
      // Build Lead Name from first and last name
      const leadName = `${sanitized.firstName} ${sanitized.lastName}`.trim();

      const leadData: ZohoCRMLead = {
        Lead_Name: leadName,
        Email: sanitized.email,
        Phone: sanitized.phone || '',
        Mobile: sanitized.phone || '', // If you have a separate mobile field, map it here
        Lead_Source: `Website - ${sanitized.howDidYouHear}`,
        Referrer: sanitized.referrer || '',
      };

      // (Optional) If your CRM has custom fields for UTMs, add them here:
      // leadData.UTM_Source__c = sanitized.utm_source || '';
      // leadData.UTM_Medium__c = sanitized.utm_medium || '';
      // leadData.UTM_Campaign__c = sanitized.utm_campaign || '';

      const leadId = await this.createLeadInZoho(leadData);

      return {
        leadId,
        success: true,
      };
    } catch (error) {
      console.error('Error creating Zoho CRM lead:', error);
      return {
        leadId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
