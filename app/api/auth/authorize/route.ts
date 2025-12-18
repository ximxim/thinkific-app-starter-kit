import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');

  if (!subdomain) {
    return NextResponse.json(
      { error: 'Missing subdomain parameter' },
      { status: 400 }
    );
  }

  const clientId = process.env.THINKIFIC_CLIENT_ID;
  const redirectUri = process.env.THINKIFIC_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('[Auth] Missing THINKIFIC_CLIENT_ID or THINKIFIC_REDIRECT_URI');
    return NextResponse.json(
      { error: 'OAuth not configured' },
      { status: 500 }
    );
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Build the Thinkific authorization URL - must use subdomain-specific URL
  const authUrl = new URL(`https://${subdomain}.thinkific.com/oauth2/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', state);

  console.log('[Auth] Redirecting to Thinkific authorization:', authUrl.toString());

  return NextResponse.redirect(authUrl.toString());
}

