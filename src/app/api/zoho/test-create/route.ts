// src/app/api/zoho/test-create/route.ts
import { NextResponse } from 'next/server';
import { ZohoCRMService } from '../../../../lib/zoho-crm';

export async function GET() {
  try {
    const zoho = new ZohoCRMService();
    
    // Test with minimal lead data
    const testLeadData = {
      Lead_Name: "Test Lead - API Integration",
      Email: "test@example.com",
      Lead_Source: "Website - Test",
    };
    
    console.log('Testing lead creation with:', testLeadData);
    
    // Try to create a test lead
    const leadId = await zoho['createLeadInZoho'](testLeadData);
    
    return NextResponse.json({
      success: true,
      message: 'Test lead created successfully',
      leadId: leadId
    });
    
  } catch (error) {
    console.error('Test lead creation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
