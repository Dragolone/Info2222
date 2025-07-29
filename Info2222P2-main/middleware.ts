import { NextResponse, NextRequest } from 'next/server';
import { getClientIp } from './lib/security/rateLimit';
import { SecurityEventType, logSecurityEventFromRequest } from './lib/security/audit';

// Define paths that should be excluded from authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health'
];

// Define paths that should be API routes
const API_PATHS = ['/api/'];

/**
 * Middleware function for Next.js
 * Adds security headers, enforces HTTPS, and performs basic request validation
 */
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Create a response object that we'll modify
  let response = NextResponse.next();

  // 1. Add security headers to all responses
  response = addSecurityHeaders(response);

  // 2. Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    // Log security event for HTTP use in production
    logSecurityEventFromRequest(
      SecurityEventType.CERTIFICATE_ISSUE,
      request,
      undefined,
      { message: 'Attempted to use HTTP in production', redirectedToHttps: true }
    );
    return NextResponse.redirect(url);
  }

  // 3. Perform content type validation for API endpoints
  if (pathname.startsWith('/api/') && request.method !== 'GET') {
    const contentType = request.headers.get('content-type');

    // API requests should use application/json for POST/PUT/PATCH
    if (!contentType?.includes('application/json')) {
      logSecurityEventFromRequest(
        SecurityEventType.SUSPICIOUS_INPUT,
        request,
        undefined,
        { message: 'Invalid content type for API request', contentType }
      );
      return new NextResponse(
        JSON.stringify({ error: 'Invalid content type, application/json required' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 4. Check request size for potential DoS attacks
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    logSecurityEventFromRequest(
      SecurityEventType.API_ABUSE,
      request,
      undefined,
      { message: 'Request exceeds size limit', size: contentLength }
    );
    return new NextResponse(
      JSON.stringify({ error: 'Request entity too large' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Log suspicious user agents
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || isSuspiciousUserAgent(userAgent)) {
    logSecurityEventFromRequest(
      SecurityEventType.SUSPICIOUS_INPUT,
      request,
      undefined,
      { message: 'Suspicious user agent detected', userAgent }
    );
    // We don't block, just log for analysis
  }

  // 6. Check for missing or suspicious referrer for sensitive operations
  const sensitiveOperation = pathname.includes('/api/users/') ||
                            pathname.includes('/api/groups/') ||
                            pathname.includes('/api/messages/');

  if (sensitiveOperation && request.method !== 'GET') {
    const referrer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';

    // This is a simplistic check - in production you would validate against your domain
    if (!referrer && !origin) {
      logSecurityEventFromRequest(
        SecurityEventType.SUSPICIOUS_INPUT,
        request,
        undefined,
        { message: 'Missing referrer for sensitive operation', path: pathname }
      );
      // Log but don't block - this might be a legitimate API client
    }
  }

  return response;
}

/**
 * Add security headers to the response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy (CSP)
  // In a real application, you might want to customize this further
  const cspValue = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Restrict for production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  // Set all the security headers
  response.headers.set('Content-Security-Policy', cspValue);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Strict-Transport-Security for HTTPS enforcement
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

/**
 * Check if a user agent string looks suspicious
 */
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspicious = [
    /^$/,                          // Empty user agent
    /curl|wget|python-requests/i,  // API tools (might be legitimate, but log for analysis)
    /sqlmap|nikto|burpsuite/i,     // Penetration testing tools
    /nmap|masscan/i,               // Network scanning tools
    /zgrab|gobuster|dirbuster/i,   // Web scanning tools
  ];

  return suspicious.some(pattern => pattern.test(userAgent));
}

/**
 * Configure matcher for which routes to run middleware on
 */
export const config = {
  // Run middleware on all routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
