import { prisma } from './prisma';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  gid?: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Create Basic Auth header from client credentials
 */
function getBasicAuthHeader(): string {
  const clientId = process.env.THINKIFIC_CLIENT_ID;
  const clientSecret = process.env.THINKIFIC_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 * Uses subdomain-specific endpoint with Basic Authentication
 */
export async function exchangeCodeForTokens(code: string, subdomain: string): Promise<TokenResponse> {
  const tokenUrl = `https://${subdomain}.thinkific.com/oauth2/token`;
  
  console.log('[Auth] Exchanging code for tokens at:', tokenUrl);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getBasicAuthHeader(),
      'User-Agent': 'LearnAlchemy/1.0', // Required by Thinkific API
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Auth] Token exchange failed:', response.status, error);
    throw new AuthError(`Failed to exchange code for tokens: ${error}`);
  }

  const tokens = await response.json();
  console.log('[Auth] Token exchange successful');
  return tokens;
}

/**
 * Refresh an expired access token
 * Uses subdomain-specific endpoint with Basic Authentication
 */
async function refreshAccessToken(refreshToken: string, subdomain: string): Promise<TokenResponse> {
  const tokenUrl = `https://${subdomain}.thinkific.com/oauth2/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getBasicAuthHeader(),
      'User-Agent': 'LearnAlchemy/1.0', // Required by Thinkific API
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Auth] Token refresh failed:', response.status, error);
    throw new AuthError('Failed to refresh access token');
  }

  return response.json();
}

/**
 * Get a valid access token for the given subdomain.
 * Automatically refreshes the token if expired.
 */
export async function getValidToken(subdomain: string): Promise<string> {
  const session = await prisma.session.findUnique({
    where: { subdomain },
  });

  if (!session) {
    throw new AuthError('No session found for subdomain');
  }

  // Check if token is expired (with 5 minute buffer)
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const isExpired = session.expiresAt < new Date(Date.now() + bufferTime);

  if (isExpired) {
    console.log('[Auth] Token expired, refreshing for subdomain:', subdomain);
    
    try {
      const refreshedTokens = await refreshAccessToken(session.refreshToken, subdomain);

      await prisma.session.update({
        where: { subdomain },
        data: {
          accessToken: refreshedTokens.access_token,
          refreshToken: refreshedTokens.refresh_token,
          expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000),
        },
      });

      return refreshedTokens.access_token;
    } catch (error) {
      console.error('[Auth] Failed to refresh token:', error);
      throw new AuthError('Session expired and could not be refreshed');
    }
  }

  return session.accessToken;
}

/**
 * Store or update session tokens in the database
 */
export async function upsertSession(
  subdomain: string,
  tokens: TokenResponse
): Promise<void> {
  await prisma.session.upsert({
    where: { subdomain },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
    create: {
      subdomain,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
}

/**
 * Delete a session when app is uninstalled
 */
export async function deleteSession(subdomain: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { subdomain },
    });
    console.log('[Auth] Session deleted for subdomain:', subdomain);
  } catch (error) {
    // Session may not exist, which is fine
    console.log('[Auth] No session to delete for subdomain:', subdomain);
  }
}

/**
 * Check if a valid session exists for the subdomain
 */
export async function hasValidSession(subdomain: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { subdomain },
  });

  if (!session) {
    return false;
  }

  // Check if not expired (with some buffer)
  return session.expiresAt > new Date(Date.now() + 60 * 1000);
}

