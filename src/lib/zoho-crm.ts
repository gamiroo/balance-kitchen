/* -------------------------------------------------------------
   src/lib/zoho-crm.ts
   ------------------------------------------------------------- */

interface ZohoCRMLead {
  Lead_Name: string;      
  Email: string;          
  Phone?: string;         
  Mobile?: string;        
  Lead_Source: string;    
  Referrer?: string;      
  [key: string]: string | number | boolean | undefined;
}

interface ZohoCRMResponseDataItem {
  status: string;
  details?: {
    id: string;
  };
  id?: string;
  record?: {
    id: string;
  };
  message?: string;
   [key: string]: string | number | object | undefined;
}

interface ZohoCRMResponse {
  data?: ZohoCRMResponseDataItem[];
  [key: string]: string | number | object | undefined;
}

interface ZohoTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  [key: string]: string | number | object | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    console.log('Refreshing Zoho access token...');
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`Failed to refresh Zoho access token: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as ZohoTokenResponse;
    this.accessToken = data.access_token;

    if (!this.accessToken) {
      console.error('Invalid token response:', data);
      throw new Error('Invalid access token response from Zoho - no access_token field');
    }

    console.log('Access token refreshed successfully');
    return this.accessToken;
  }

  private async createLeadInZoho(leadData: ZohoCRMLead): Promise<string> {
    const accessToken = await this.getAccessToken();
    const endpoint = `${this.apiDomain}/crm/v2/Leads`;

    console.log('Creating lead with data:', JSON.stringify(leadData, null, 2));
    
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

    const responseText = await response.text();
    console.log('Zoho API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '') // Truncate long responses
    });

    if (!response.ok) {
      throw new Error(`Failed to create lead in Zoho: ${response.status} - ${responseText}`);
    }

    let result: ZohoCRMResponse;
    try {
      result = JSON.parse(responseText) as ZohoCRMResponse;
    } catch (parseError) {
      throw new Error(`Failed to parse Zoho response: ${responseText.substring(0, 200)}`);
    }

    console.log('Parsed Zoho response structure:', {
      hasData: !!result.data,
      dataLength: result.data?.length,
      firstDataItem: result.data?.[0] ? Object.keys(result.data[0]) : 'no data'
    });

    // Handle Zoho CRM API response format
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const firstResult = result.data[0];
      
      // Handle error responses
      if (firstResult.status === 'error' || firstResult.status === 'failed') {
        const errorMessage = firstResult.message || firstResult.details || JSON.stringify(firstResult);
        console.error('Zoho API Error Details:', firstResult);
        throw new Error(`Zoho API Error: ${errorMessage}`);
      }
      
      // Handle success responses - Zoho can return different success formats
      if (firstResult.status === 'success') {
        // Try different possible ID locations
        const possibleIds = [
          firstResult.details?.id,
          firstResult.id,
          firstResult.record?.id
        ].filter((id): id is string => typeof id === 'string' && id.length > 0);
        
        if (possibleIds.length > 0) {
          const leadId = possibleIds[0];
          console.log('Successfully created lead with ID:', leadId);
          return leadId;
        }
        
        // If no ID found but status is success, it might be a bulk operation
        console.log('Success response but no ID found:', firstResult);
        throw new Error('Lead created successfully but no ID returned');
      }
    }

    // Log full response for debugging unexpected formats
    console.error('Unexpected Zoho response format:', JSON.stringify(result, null, 2));
    throw new Error(`Failed to create lead - unexpected response format. Response: ${JSON.stringify(result).substring(0, 500)}`);
  }

  /* -----------------------------------------------------------------
     Main entry point – called by the API route.
     ----------------------------------------------------------------- */
  async createEnquiryLead(
  displayName: string,
  sanitized: SanitizedEnquiry
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
): Promise<{ leadId: string; success: boolean; error?: string }> {
  try {
    console.log('Creating Zoho CRM lead for:', displayName);
    
    // Build Lead Name from first and last name
    const leadName = `${sanitized.firstName} ${sanitized.lastName}`.trim();

    const leadData: ZohoCRMLead = {
      Lead_Name: leadName,
      First_Name: sanitized.firstName,
      Last_Name: sanitized.lastName,
      Email: sanitized.email,
      Phone: sanitized.phone || '',
      Mobile: sanitized.phone || '',
      Lead_Source: `Website - ${sanitized.howDidYouHear}`,
      Description: sanitized.message,
    };

    console.log('Sending lead data to Zoho:', leadData);

    const leadId = await this.createLeadInZoho(leadData);

    console.log('Successfully created Zoho lead:', leadId);
    
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
