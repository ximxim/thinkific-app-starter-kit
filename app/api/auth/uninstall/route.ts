import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { z } from 'zod';

// Schema for validating the uninstall webhook payload
const UninstallPayloadSchema = z.object({
  subdomain: z.string().min(1),
  // Add other fields from the webhook as needed
  event: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the payload
    const result = UninstallPayloadSchema.safeParse(body);
    
    if (!result.success) {
      console.error('[Uninstall] Invalid payload:', result.error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const { subdomain } = result.data;
    
    console.log('[Uninstall] Processing uninstall for subdomain:', subdomain);
    
    // Delete the session from the database
    await deleteSession(subdomain);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Uninstall] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process uninstall' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification (if required by Thinkific)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

