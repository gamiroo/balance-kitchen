// src/app/api/enquiry/route.ts
export async function POST(request: Request) {
  try {
    console.log('API route called successfully');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Basic validation
    if (!body.firstName || !body.lastName || !body.email || !body.message) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Processing enquiry for:', body.email);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = {
      success: true,
      message: 'Thank you for your enquiry! We will get back to you soon.',
      timestamp: new Date().toISOString(),
      receivedData: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        subject: body.subject || 'General Enquiry'
      }
    };
    
    console.log('Enquiry processed successfully:', response);
    
    return Response.json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    
    return Response.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: 'Enquiry API is working',
    timestamp: new Date().toISOString()
  });
}
