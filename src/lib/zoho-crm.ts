// src/lib/zoho-crm.ts
interface ZohoCRMLead {
  Lead_Name: string;      // Combined first + last name
  Email: string;          // Email address
  Phone?: string;         // Phone number
  Mobile?: string;        // Mobile number
  Lead_Source: string;    // How they found you
  Referrer?: string;      // Who referred them
}

interface ZohoCRMResponse {
  data: Array<{
    details: {
      id: string;
    };
    status: string;
  }>;
}

export class ZohoCRMService {
  private accessToken?: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID!;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET!;
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN!;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const tokenEndpoint = 'https://accounts.zoho.com/oauth/v2/token';
    
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

    const data = await response.json();
    this.accessToken = data.access_token;
    
    if (!this.accessToken || typeof this.accessToken !== 'string') {
      console.error('Zoho token response:', data);
      throw new Error('Invalid access token response from Zoho - no access_token field');
    }
    
    return this.accessToken;
  }

  private async createLeadInZoho(leadData: ZohoCRMLead): Promise<string> {
    const accessToken = await this.getAccessToken();
    const endpoint = 'https://www.zohoapis.com/crm/v2/Leads';

    const payload = {
      data: [leadData],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    
    throw new Error('Failed to create lead - unexpected response format');
  }

  async createEnquiryLead(
    displayName: string, 
    sanitized: any, 
    requestId: string
  ): Promise<{ leadId: string; success: boolean; error?: string }> {
    try {
      // Build Lead Name from first and last name
      const leadName = `${sanitized.firstName} ${sanitized.lastName}`.trim();

      const leadData: ZohoCRMLead = {
        Lead_Name: leadName,                          
        Email: sanitized.email,                       
        Phone: sanitized.phone || '',                 
        Mobile: sanitized.phone || '',                
        Lead_Source: `Website - ${sanitized.howDidYouHear}`, 
        Referrer: sanitized.referrer || '',          
      };

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
