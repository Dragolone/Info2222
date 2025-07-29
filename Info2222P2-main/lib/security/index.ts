/**
 * Security Module Index
 * Provides a central export point for all security-related functionality
 */

// Re-export from rate limiting module
export { default as rateLimit } from './rateLimit';
export { getClientIp, createRateLimitKey, getExponentialBackoff } from './rateLimit';

// Re-export from input sanitization module
export {
  sanitizeString,
  sanitizeObject,
  validateSafeString,
  validateEmail,
  validatePassword,
  validateUrl,
  generateCSPNonce
} from './inputSanitization';

// Re-export from audit module
export {
  SecurityEventType,
  logSecurityEvent,
  logSecurityEventFromRequest,
  getSecurityEvents,
  detectSuspiciousAuthActivity,
  detectReconnaissanceActivity
} from './audit';

// Re-export from session protection module
export {
  createSession,
  validateSession,
  invalidateSession,
  getActiveSessionCount
} from './sessionProtection';

/**
 * Comprehensive security check for a request
 * Combines multiple security checks into one function
 *
 * @param request The request to check
 * @param userId Optional user ID associated with the request
 * @returns Object containing security validation results
 */
export function performSecurityCheck(
  request: Request,
  userId?: string
): {
  isSecure: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if connection is secure
  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    issues.push('Insecure connection detected (HTTP)');
  }

  // Check for suspicious user agent
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    issues.push('Missing or suspiciously short user agent');
  }

  // Check for potentially dangerous request headers
  const contentType = request.headers.get('content-type');
  if (request.method !== 'GET' &&
      (!contentType || !contentType.includes('application/json'))) {
    issues.push('Invalid content type for non-GET request');
  }

  // Check for excessive request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) {
    issues.push('Request exceeds maximum allowed size');
  }

  return {
    isSecure: issues.length === 0,
    issues
  };
}

/**
 * Constants for security configuration
 */
export const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_HASH_ITERATIONS: 10000,
  PASSWORD_HASH_KEYLEN: 64,
  PASSWORD_HASH_ALGORITHM: 'sha512',
  SESSION_MAX_AGE: 4 * 60 * 60 * 1000, // 4 hours
  API_RATE_LIMIT: 60, // per minute
  MAX_FAILED_LOGINS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'wss:', 'ws:'],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"]
  }
};
