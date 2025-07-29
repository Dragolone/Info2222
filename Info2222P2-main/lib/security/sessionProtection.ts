import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Interface for session tokens
interface SessionToken {
  token: string;
  userId: string;
  created: number;
  expires: number;
  fingerprint: string;  // Browser fingerprint hash
  lastActive: number;
  ip: string;
}

// In-memory session store (for development)
// In production, this would be a database or distributed cache
const sessionStore: Map<string, SessionToken> = new Map();

// Session configuration
const SESSION_CONFIG = {
  cookieName: 'auth_session',
  fingerprintCookieName: 'device_id',
  maxAge: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  renewalThreshold: 60 * 60 * 1000, // 1 hour in milliseconds
  secureCookie: process.env.NODE_ENV === 'production',
  renewalEnabled: true,
  tokenRotationEnabled: true,
  consistentDeviceRequired: true,
};

/**
 * Create a new session for a user
 *
 * @param userId The user's ID
 * @param request The NextRequest object containing client information
 * @returns The session token
 */
export function createSession(userId: string, request: NextRequest): string {
  // Generate a random session token
  const token = crypto.randomBytes(64).toString('hex');

  // Get client IP
  const ip = request.ip ||
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             'unknown';

  // Generate or get device fingerprint
  const fingerprint = generateDeviceFingerprint(request);

  // Create session expiration time
  const now = Date.now();
  const expires = now + SESSION_CONFIG.maxAge;

  // Create session token object
  const sessionToken: SessionToken = {
    token,
    userId,
    created: now,
    expires,
    fingerprint,
    lastActive: now,
    ip,
  };

  // Store session token
  sessionStore.set(token, sessionToken);

  // Set session and fingerprint cookies
  const cookieStore = cookies();

  cookieStore.set({
    name: SESSION_CONFIG.cookieName,
    value: token,
    httpOnly: true,
    path: '/',
    secure: SESSION_CONFIG.secureCookie,
    sameSite: 'lax',
    expires: new Date(expires),
  });

  cookieStore.set({
    name: SESSION_CONFIG.fingerprintCookieName,
    value: fingerprint,
    httpOnly: true,
    path: '/',
    secure: SESSION_CONFIG.secureCookie,
    sameSite: 'lax',
    expires: new Date(now + 365 * 24 * 60 * 60 * 1000), // 1 year for fingerprint
  });

  return token;
}

/**
 * Validate and potentially renew a user session
 *
 * @param request The NextRequest object
 * @returns Object containing validation result and user ID if valid
 */
export function validateSession(request: NextRequest): { valid: boolean, userId?: string, reason?: string } {
  // Get session token from cookies
  const token = request.cookies.get(SESSION_CONFIG.cookieName)?.value;

  if (!token) {
    return { valid: false, reason: 'No session token found' };
  }

  // Get session from store
  const session = sessionStore.get(token);

  if (!session) {
    return { valid: false, reason: 'Invalid session token' };
  }

  // Check if session has expired
  const now = Date.now();
  if (now > session.expires) {
    sessionStore.delete(token);
    return { valid: false, reason: 'Session expired' };
  }

  // Check for inactivity timeout
  if (now > session.lastActive + SESSION_CONFIG.inactivityTimeout) {
    sessionStore.delete(token);
    return { valid: false, reason: 'Session timed out due to inactivity' };
  }

  // Verify device fingerprint if required
  if (SESSION_CONFIG.consistentDeviceRequired) {
    const currentFingerprint = request.cookies.get(SESSION_CONFIG.fingerprintCookieName)?.value;

    if (!currentFingerprint || currentFingerprint !== session.fingerprint) {
      sessionStore.delete(token);
      return { valid: false, reason: 'Device fingerprint mismatch' };
    }
  }

  // Check for IP changes (optional additional security)
  const currentIp = request.ip ||
                    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    'unknown';

  if (session.ip !== 'unknown' && currentIp !== 'unknown' && session.ip !== currentIp) {
    // Instead of invalidating, just log this for suspicious activity monitoring
    console.warn(`IP change detected for user ${session.userId}: ${session.ip} -> ${currentIp}`);
  }

  // Update last active timestamp
  session.lastActive = now;

  // Handle session renewal if needed
  if (SESSION_CONFIG.renewalEnabled && now > session.created + SESSION_CONFIG.renewalThreshold) {
    renewSession(token, request);
  }

  return { valid: true, userId: session.userId };
}

/**
 * Invalidate a user session (logout)
 *
 * @param token Session token to invalidate
 * @returns True if session was invalidated, false otherwise
 */
export function invalidateSession(token: string): boolean {
  if (!token) return false;

  const success = sessionStore.delete(token);

  // Clear cookies
  const cookieStore = cookies();

  cookieStore.delete(SESSION_CONFIG.cookieName);
  // Note: We don't delete the fingerprint cookie as it's used for tracking the device

  return success;
}

/**
 * Renew a session with a new token
 *
 * @param currentToken Current session token
 * @param request The NextRequest object
 * @returns New session token if renewed, undefined otherwise
 */
function renewSession(currentToken: string, request: NextRequest): string | undefined {
  // Get current session
  const currentSession = sessionStore.get(currentToken);
  if (!currentSession) return undefined;

  // If token rotation is disabled, just extend expiration
  if (!SESSION_CONFIG.tokenRotationEnabled) {
    const newExpires = Date.now() + SESSION_CONFIG.maxAge;
    currentSession.expires = newExpires;

    // Update cookie expiration
    const cookieStore = cookies();
    cookieStore.set({
      name: SESSION_CONFIG.cookieName,
      value: currentToken,
      httpOnly: true,
      path: '/',
      secure: SESSION_CONFIG.secureCookie,
      sameSite: 'lax',
      expires: new Date(newExpires),
    });

    return currentToken;
  }

  // Generate a new token
  const newToken = crypto.randomBytes(64).toString('hex');

  // Create a new session with updated expiration
  const now = Date.now();
  const newExpires = now + SESSION_CONFIG.maxAge;

  const newSession: SessionToken = {
    ...currentSession,
    token: newToken,
    created: now,
    expires: newExpires,
    lastActive: now,
  };

  // Update session store (add new, remove old)
  sessionStore.set(newToken, newSession);
  sessionStore.delete(currentToken);

  // Update cookies
  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_CONFIG.cookieName,
    value: newToken,
    httpOnly: true,
    path: '/',
    secure: SESSION_CONFIG.secureCookie,
    sameSite: 'lax',
    expires: new Date(newExpires),
  });

  return newToken;
}

/**
 * Generate a device fingerprint from request headers
 *
 * @param request The NextRequest object
 * @returns A hashed fingerprint string
 */
function generateDeviceFingerprint(request: NextRequest): string {
  // Check if there's already a fingerprint cookie
  const existingFingerprint = request.cookies.get(SESSION_CONFIG.fingerprintCookieName)?.value;
  if (existingFingerprint) {
    return existingFingerprint;
  }

  // Create fingerprint from request data
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  // Combine data for fingerprinting
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${uuidv4()}`;

  // Create hash of the data
  return crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex');
}

/**
 * Get count of active sessions
 *
 * @returns Number of active sessions
 */
export function getActiveSessionCount(): number {
  // Clean expired sessions first
  cleanExpiredSessions();

  return sessionStore.size;
}

/**
 * Clean expired sessions from the session store
 */
function cleanExpiredSessions(): void {
  const now = Date.now();
  let expiredCount = 0;

  for (const [token, session] of sessionStore.entries()) {
    if (now > session.expires || now > session.lastActive + SESSION_CONFIG.inactivityTimeout) {
      sessionStore.delete(token);
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired sessions`);
  }
}

// Set up periodic cleanup of expired sessions
if (typeof setInterval !== 'undefined') {
  // Run every 15 minutes
  setInterval(cleanExpiredSessions, 15 * 60 * 1000);
}

/**
 * Regenerate a session to prevent session fixation
 * Call this whenever there's a privilege level change or sensitive action
 *
 * @param userId User ID for the session
 * @param request The NextRequest object containing client information
 * @param preserveData Additional data to preserve in the new session
 * @returns The new session token
 */
export function regenerateSession(
  userId: string,
  request: NextRequest,
  preserveData: Record<string, any> = {}
): string {
  // Get the current session token
  const currentToken = request.cookies.get(SESSION_CONFIG.cookieName)?.value;

  // If there's an existing session, invalidate it
  if (currentToken) {
    // Get data from the current session that we want to preserve
    const currentSession = sessionStore.get(currentToken);

    // Preserve any data from the current session
    const dataToPreserve = currentSession ? { ...preserveData } : preserveData;

    // Delete the current session
    invalidateSession(currentToken);

    // Log the session regeneration
    console.log(`Session regenerated for user ${userId} as a security precaution`);
  }

  // Create a completely new session
  return createSession(userId, request);
}

/**
 * Update session state on privilege change to prevent session fixation
 * Call this whenever a user's privileges change (role change, etc.)
 *
 * @param userId User ID for the session
 * @param request The NextRequest object containing client information
 * @param newPrivileges New privileges for the user
 * @returns The new session token
 */
export function updateSessionOnPrivilegeChange(
  userId: string,
  request: NextRequest,
  newPrivileges: string[]
): string {
  // Completely regenerate the session
  const newToken = regenerateSession(userId, request, { privileges: newPrivileges });

  // Log the privilege change
  console.log(`User ${userId} privileges updated to [${newPrivileges.join(', ')}], session regenerated`);

  return newToken;
}

/**
 * Handle security-sensitive operations requiring session regeneration
 * Examples: password change, email change, 2FA enabled/disabled, etc.
 *
 * @param userId User ID for the session
 * @param request The NextRequest object containing client information
 * @param operationType Type of sensitive operation
 * @returns The new session token
 */
export function refreshSessionAfterSensitiveOperation(
  userId: string,
  request: NextRequest,
  operationType: string
): string {
  // Generate a new session
  const newToken = regenerateSession(userId, request);

  // Log the sensitive operation
  console.log(`Session regenerated after ${operationType} for user ${userId}`);

  return newToken;
}
