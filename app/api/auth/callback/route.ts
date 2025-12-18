import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, upsertSession } from '@/lib/auth';

/**
 * Get the base URL for redirects.
 * Uses the THINKIFIC_REDIRECT_URI to derive the public-facing URL,
 * falling back to request.url for local development.
 */
function getBaseUrl(request: Request): string {
  const redirectUri = process.env.THINKIFIC_REDIRECT_URI;
  
  if (redirectUri) {
    // Extract base URL from redirect URI (e.g., https://dev.ximxim.ca/api/auth/callback -> https://dev.ximxim.ca)
    const url = new URL(redirectUri);
    return `${url.protocol}//${url.host}`;
  }
  
  // Fallback to request URL for local development
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const subdomain = searchParams.get('subdomain');
  const error = searchParams.get('error');
  
  // Get the correct base URL for redirects
  const baseUrl = getBaseUrl(request);

  // Handle OAuth errors
  if (error) {
    console.error('[Auth] OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error)}`);
  }

  // Validate required parameters
  if (!code) {
    console.error('[Auth] Missing authorization code');
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);
  }

  if (!subdomain) {
    console.error('[Auth] Missing subdomain');
    return NextResponse.redirect(`${baseUrl}/login?error=missing_subdomain`);
  }

  try {
    // Exchange the authorization code for tokens
    console.log('[Auth] Exchanging code for tokens, subdomain:', subdomain);
    const tokens = await exchangeCodeForTokens(code, subdomain);

    // Store the session in the database
    await upsertSession(subdomain, tokens);
    console.log('[Auth] Session created for subdomain:', subdomain);

    // Set a cookie to identify the current subdomain
    const cookieStore = await cookies();
    cookieStore.set('subdomain', subdomain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Redirect to the dashboard using the correct base URL
    console.log('[Auth] Redirecting to dashboard at:', `${baseUrl}/dashboard`);
    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (error) {
    console.error('[Auth] Callback error:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
  }
}

