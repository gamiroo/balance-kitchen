// src/lib/zoho-crm.test.ts
import { ZohoCRMService } from './zoho-crm';

// Mock fetch globally
global.fetch = jest.fn();

describe('ZohoCRMService', () => {
  let zohoService: ZohoCRMService;
  const mockEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...mockEnv };
    
    // Set required environment variables
    process.env.ZOHO_CLIENT_ID = 'test-client-id';
    process.env.ZOHO_CLIENT_SECRET = 'test-client-secret';
    process.env.ZOHO_REFRESH_TOKEN = 'test-refresh-token';
    
    zohoService = new ZohoCRMService();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = mockEnv;
  });

  describe('constructor', () => {
    it('should initialize with AU data center by default', () => {
      // ASSERT
      expect((zohoService as any).dataCenter).toBe('https://accounts.zoho.com.au');
      expect((zohoService as any).apiDomain).toBe('https://www.zohoapis.com.au');
    });

    it('should initialize with US data center when specified', () => {
      // ARRANGE
      process.env.ZOHO_DATA_CENTER = 'US';
      
      // ACT
      const service = new ZohoCRMService();
      
      // ASSERT
      expect((service as any).dataCenter).toBe('https://accounts.zoho.com');
      expect((service as any).apiDomain).toBe('https://www.zohoapis.com');
    });

    it('should initialize with EU data center when specified', () => {
      // ARRANGE
      process.env.ZOHO_DATA_CENTER = 'EU';
      
      // ACT
      const service = new ZohoCRMService();
      
      // ASSERT
      expect((service as any).dataCenter).toBe('https://accounts.zoho.eu');
      expect((service as any).apiDomain).toBe('https://www.zohoapis.eu');
    });

    it('should default to AU data center for unknown regions', () => {
      // ARRANGE
      process.env.ZOHO_DATA_CENTER = 'INVALID';
      
      // ACT
      const service = new ZohoCRMService();
      
      // ASSERT
      expect((service as any).dataCenter).toBe('https://accounts.zoho.com.au');
      expect((service as any).apiDomain).toBe('https://www.zohoapis.com.au');
    });
  });

  describe('getAccessToken', () => {
    it('should return existing access token if available', async () => {
      // ARRANGE
      (zohoService as any).accessToken = 'existing-token';

      // ACT
      const token = await (zohoService as any).getAccessToken();

      // ASSERT
      expect(token).toBe('existing-token');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch new access token when not available', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'new-access-token',
          expires_in: 3600
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const token = await (zohoService as any).getAccessToken();

      // ASSERT
      expect(token).toBe('new-access-token');
      expect((zohoService as any).accessToken).toBe('new-access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://accounts.zoho.com.au/oauth/v2/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
    });

    it('should throw error when token refresh fails', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid refresh token')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT & ASSERT
      await expect((zohoService as any).getAccessToken()).rejects.toThrow(
        'Failed to refresh Zoho access token: 400 - Invalid refresh token'
      );
    });

    it('should throw error when access token is missing in response', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          expires_in: 3600
          // missing access_token
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT & ASSERT
      await expect((zohoService as any).getAccessToken()).rejects.toThrow(
        'Invalid access token response from Zoho - no access_token field'
      );
    });
  });

  describe('createLeadInZoho', () => {
    beforeEach(() => {
      // Mock getAccessToken to return a token
      (zohoService as any).getAccessToken = jest.fn().mockResolvedValue('test-access-token');
    });

    it('should create lead successfully with details.id format', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          data: [{
            status: 'success',
            details: {
              id: 'lead-123'
            }
          }]
        }))
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const leadData = {
        Lead_Name: 'John Doe',
        Email: 'john@example.com',
        Lead_Source: 'Website - Search Engine'
      };

      // ACT
      const result = await (zohoService as any).createLeadInZoho(leadData);

      // ASSERT
      expect(result).toBe('lead-123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.zohoapis.com.au/crm/v2/Leads',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Zoho-oauthtoken test-access-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should create lead successfully with id format', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          data: [{
            status: 'success',
            id: 'lead-456'
          }]
        }))
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const leadData = {
        Lead_Name: 'John Doe',
        Email: 'john@example.com',
        Lead_Source: 'Website - Search Engine'
      };

      // ACT
      const result = await (zohoService as any).createLeadInZoho(leadData);

      // ASSERT
      expect(result).toBe('lead-456');
    });

    it('should create lead successfully with record.id format', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          data: [{
            status: 'success',
            record: {
              id: 'lead-789'
            }
          }]
        }))
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const leadData = {
        Lead_Name: 'John Doe',
        Email: 'john@example.com',
        Lead_Source: 'Website - Search Engine'
      };

      // ACT
      const result = await (zohoService as any).createLeadInZoho(leadData);

      // ASSERT
      expect(result).toBe('lead-789');
    });

    it('should throw error when API response is not ok', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const leadData = {
        Lead_Name: 'John Doe',
        Email: 'john@example.com',
        Lead_Source: 'Website - Search Engine'
      };

      // ACT & ASSERT
      await expect((zohoService as any).createLeadInZoho(leadData)).rejects.toThrow(
        'Failed to create lead in Zoho: 500 - Internal Server Error'
      );
    });

      it('should throw error when response cannot be parsed', async () => {
        // ARRANGE
        const mockResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue('invalid json')
        };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        const leadData = {
          Lead_Name: 'John Doe',
          Email: 'john@example.com',
          Lead_Source: 'Website - Search Engine'
        };

        // ACT & ASSERT
        await expect((zohoService as any).createLeadInZoho(leadData)).rejects.toThrow(/Failed to parse Zoho response/);
      });

    it('should throw error when API returns error status', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          data: [{
            status: 'error',
            message: 'Invalid field value'
          }]
        }))
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const leadData = {
        Lead_Name: 'John Doe',
        Email: 'john@example.com',
        Lead_Source: 'Website - Search Engine'
      };

      // ACT & ASSERT
      await expect((zohoService as any).createLeadInZoho(leadData)).rejects.toThrow(
        'Zoho API Error: Invalid field value'
      );
    });

    it('should throw error when no ID is returned in success response', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          data: [{
            status: 'success'
            // missing ID fields
          }]
        }))
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const leadData = {
        Lead_Name: 'John Doe',
        Email: 'john@example.com',
        Lead_Source: 'Website - Search Engine'
      };

      // ACT & ASSERT
      await expect((zohoService as any).createLeadInZoho(leadData)).rejects.toThrow(
        'Lead created successfully but no ID returned'
      );
    });
  });

  describe('createEnquiryLead', () => {
    it('should create enquiry lead successfully', async () => {
      // ARRANGE
      (zohoService as any).createLeadInZoho = jest.fn().mockResolvedValue('lead-123');

      const sanitizedEnquiry = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        howDidYouHear: 'Search Engine' as const,
        message: 'Test message'
      };

      // ACT
      const result = await zohoService.createEnquiryLead('John Doe', sanitizedEnquiry);

      // ASSERT
      expect(result).toEqual({
        leadId: 'lead-123',
        success: true
      });
      expect((zohoService as any).createLeadInZoho).toHaveBeenCalledWith({
        Lead_Name: 'John Doe',
        First_Name: 'John',
        Last_Name: 'Doe',
        Email: 'john@example.com',
        Phone: '',
        Mobile: '',
        Lead_Source: 'Website - Search Engine',
        Description: 'Test message'
      });
    });

    it('should handle errors gracefully and return failure response', async () => {
      // ARRANGE
      const error = new Error('Zoho API Error');
      (zohoService as any).createLeadInZoho = jest.fn().mockRejectedValue(error);

      const sanitizedEnquiry = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        howDidYouHear: 'Search Engine' as const,
        message: 'Test message'
      };

      // ACT
      const result = await zohoService.createEnquiryLead('John Doe', sanitizedEnquiry);

      // ASSERT
      expect(result).toEqual({
        leadId: '',
        success: false,
        error: 'Zoho API Error'
      });
    });

    it('should handle non-Error objects gracefully', async () => {
      // ARRANGE
      (zohoService as any).createLeadInZoho = jest.fn().mockRejectedValue('String error');

      const sanitizedEnquiry = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        howDidYouHear: 'Search Engine' as const,
        message: 'Test message'
      };

      // ACT
      const result = await zohoService.createEnquiryLead('John Doe', sanitizedEnquiry);

      // ASSERT
      expect(result).toEqual({
        leadId: '',
        success: false,
        error: 'Unknown error occurred'
      });
    });

    it('should include phone number in lead data when provided', async () => {
      // ARRANGE
      (zohoService as any).createLeadInZoho = jest.fn().mockResolvedValue('lead-123');

      const sanitizedEnquiry = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        subject: 'Test Subject',
        howDidYouHear: 'Search Engine' as const,
        message: 'Test message'
      };

      // ACT
      await zohoService.createEnquiryLead('John Doe', sanitizedEnquiry);

      // ASSERT
      expect((zohoService as any).createLeadInZoho).toHaveBeenCalledWith({
        Lead_Name: 'John Doe',
        First_Name: 'John',
        Last_Name: 'Doe',
        Email: 'john@example.com',
        Phone: '+1234567890',
        Mobile: '+1234567890',
        Lead_Source: 'Website - Search Engine',
        Description: 'Test message'
      });
    });
  });
});
