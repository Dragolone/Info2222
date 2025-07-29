import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { cookies } from 'next/headers';
import { withNextAuth } from '@/lib/auth/middleware';
import { SecurityEventType, logSecurityEventFromRequest } from '@/lib/security/audit';

// CSRF token configuration
const CSRF_CONFIG = {
  cookieName: 'csrf_token',
  headerName: 'X-CSRF-Token',
  tokenLength: 64, // bytes
  tokenLifetime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

/**
 * Generate a secure random CSRF token
 *
 * @returns Random token as base64url string
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('base64url');
}

/**
 * Set a new CSRF token in cookies
 *
 * @param req The NextRequest object
 * @returns The new CSRF token
 */
function setCsrfToken(req: NextRequest): string {
  const token = generateCsrfToken();
  const cookieStore = cookies();

  cookieStore.set({
    name: CSRF_CONFIG.cookieName,
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CSRF_CONFIG.tokenLifetime / 1000, // Convert to seconds
  });

  return token;
}

/**
 * Get CSRF token API endpoint
 * Issues a new CSRF token or refreshes an existing one
 */
export async function GET(request: NextRequest) {
  // This endpoint should be accessible without authentication
  try {
    // Generate a new CSRF token
    const token = setCsrfToken(request);

    // Return the token to be included in forms/requests
    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error generating CSRF token:', error);

    // Log security event
    logSecurityEventFromRequest(
      SecurityEventType.AUTH_FAILURE,
      request,
      undefined,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );

    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

/**
 * Verify a CSRF token
 * Helper function to be used in other routes
 *
 * @param request The NextRequest object
 * @returns Boolean indicating if the token is valid
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  try {
    // Get the token from the header
    const headerToken = request.headers.get(CSRF_CONFIG.headerName);

    // Get the token from the cookie
    const cookieToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value;

    // If either token is missing, verification fails
    if (!headerToken || !cookieToken) {
      return false;
    }

    // Compare the tokens
    return headerToken === cookieToken;
  } catch (error) {
    console.error('Error verifying CSRF token:', error);
    return false;
  }
}

/**
 * Middleware for verifying CSRF tokens on state-changing requests
 *
 * @param request The NextRequest object
 * @param handler The handler function to call if the token is valid
 * @returns Response from the handler or error response
 */
export async function withCsrfProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Only check CSRF for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (stateChangingMethods.includes(request.method)) {
    // Verify CSRF token
    const isValidCsrf = verifyCsrfToken(request);

    if (!isValidCsrf) {
      // Log potential CSRF attempt
      logSecurityEventFromRequest(
        SecurityEventType.ACCESS_DENIED,
        request,
        undefined,
        { reason: 'Invalid CSRF token' }
      );

      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // Token is valid or not required, continue to handler
  return handler(request);
}

/**
 * Middleware for verifying both authentication and CSRF
 *
 * @param request The NextRequest object
 * @param handler The handler function to call if authentication and CSRF are valid
 * @returns Response from the handler or error response
 */
export async function withAuthAndCsrf(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  return withNextAuth(request, async (req, userId) => {
    return withCsrfProtection(req, async (req) => {
      return handler(req, userId);
    });
  });
}
