/**
 * Input sanitization utilities to protect against XSS and injection attacks
 */

/**
 * Sanitize a string input to prevent XSS attacks
 *
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  // Replace HTML characters with their entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize an object by sanitizing all string properties
 *
 * @param obj Object to sanitize
 * @returns Sanitized object with the same structure
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    }
    // Sanitize arrays by mapping each item
    else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        }
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item);
        }
        return item;
      });
    }
    // Sanitize strings
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    }
    // Keep non-string values unchanged
    else {
      sanitized[key] = value;
    }
  });

  return sanitized as T;
}

/**
 * Validate that a string doesn't contain potentially dangerous patterns
 *
 * @param input String to validate
 * @returns True if the string is safe, false otherwise
 */
export function validateSafeString(input: string): boolean {
  if (!input) return true;

  // Check for common XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi,
    /on\w+=/gi,
    /\beval\(/gi,
    /expression\(/gi,
  ];

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b|\d)((\'|\"|\%27|--|\%2D\%2D)\s*(\b|or|and|union|select|insert|drop|update|delete|alter|create|where))/gi,
    /\b(or|and)\b\s+\d+\s*=\s*\d+/gi,
    /;\s*(select|insert|update|delete|drop)/gi,
  ];

  // Check each pattern
  for (const pattern of [...xssPatterns, ...sqlInjectionPatterns]) {
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate email format
 *
 * @param email Email to validate
 * @returns True if the email format is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 *
 * @param password Password to validate
 * @returns Object containing validation result and reasons for failure
 */
export function validatePassword(password: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!password) {
    reasons.push('Password cannot be empty');
    return { valid: false, reasons };
  }

  // Length check
  if (password.length < 8) {
    reasons.push('Password must be at least 8 characters long');
  }

  // Complexity checks
  if (!/[A-Z]/.test(password)) {
    reasons.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    reasons.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    reasons.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    reasons.push('Password must contain at least one special character');
  }

  // Check for common passwords (would normally check against a larger list)
  const commonPasswords = [
    'password', 'admin', '123456', 'qwerty', 'welcome',
    'password123', 'admin123', '12345678', 'abc123', 'letmein'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    reasons.push('Password is too common and easily guessable');
  }

  return {
    valid: reasons.length === 0,
    reasons
  };
}

/**
 * Validate that a URL is safe and properly formatted
 *
 * @param url URL to validate
 * @returns True if the URL is safe and valid, false otherwise
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);

    // Check for allowed protocols (http and https)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Additional checks for potentially dangerous URL patterns
    if (url.includes('javascript:') || url.includes('data:') || url.includes('vbscript:')) {
      return false;
    }

    return true;
  } catch (error) {
    // URL parsing failed, so the URL is invalid
    return false;
  }
}

/**
 * Generate a nonce for CSP (Content Security Policy)
 *
 * @returns A random nonce string
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
