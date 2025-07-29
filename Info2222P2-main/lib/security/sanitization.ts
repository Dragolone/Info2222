import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization options for different contexts
 */
export const SANITIZE_OPTIONS = {
  // For text content that should not contain any HTML
  STRICT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  },

  // For text that may contain basic formatting but no scripts
  BASIC_FORMAT: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  },

  // For markdowns and rich text with controlled tags
  RICH_TEXT: {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'frame', 'object', 'embed', 'form'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  },
};

/**
 * Sanitize text input to prevent XSS attacks
 * @param input Text input to sanitize
 * @param options Sanitization options
 * @returns Sanitized string
 */
export function sanitizeText(input: string | null | undefined, options = SANITIZE_OPTIONS.STRICT): string {
  if (input === null || input === undefined) {
    return '';
  }

  return DOMPurify.sanitize(input.toString(), options);
}

/**
 * Sanitize an object's string values to prevent XSS attacks
 * @param obj Object to sanitize
 * @param options Sanitization options
 * @returns New object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, options = SANITIZE_OPTIONS.STRICT): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key as keyof T] = sanitizeText(value, options) as any;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key as keyof T] = sanitizeObject(value, options);
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeText(item, options);
        } else if (item && typeof item === 'object') {
          return sanitizeObject(item, options);
        }
        return item;
      }) as any;
    } else {
      result[key as keyof T] = value;
    }
  }

  return result;
}

/**
 * Validate and sanitize URL to prevent javascript: exploits and similar
 * @param url URL to validate and sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';

  try {
    // Check if URL is valid
    const urlObj = new URL(url.toString());

    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '';
    }

    return urlObj.toString();
  } catch (e) {
    // If URL is invalid or malformed, return empty string
    return '';
  }
}

/**
 * Escape HTML entities in a string
 * @param input String to escape
 * @returns Escaped string
 */
export function escapeHtml(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return input.toString().replace(/[&<>"'`=\/]/g, char => htmlEntities[char]);
}

/**
 * Sanitize SQL input to prevent SQL injection
 * This is a basic implementation - always use parameterized queries
 * @param input SQL input to sanitize
 * @returns Sanitized SQL string
 */
export function sanitizeSqlInput(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  // This is a basic sanitization - consider this a last line of defense
  // Always use parameterized queries/prepared statements
  return input.toString()
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Sanitize filename to prevent directory traversal and command injection
 * @param filename Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (filename === null || filename === undefined) {
    return '';
  }

  // Remove path traversal sequences and invalid filename characters
  return filename.toString()
    .replace(/[\/\\]/g, '') // Remove slashes
    .replace(/\.\./g, '') // Remove double dots
    .replace(/[<>:"|?*]/g, '') // Remove invalid Windows filename characters
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

/**
 * Normalize and sanitize a JSON string
 * @param jsonString JSON string to sanitize
 * @returns Sanitized and normalized JSON string or empty object if invalid
 */
export function sanitizeJson(jsonString: string | null | undefined): string {
  if (jsonString === null || jsonString === undefined) {
    return '{}';
  }

  try {
    // Parse and stringify to normalize and validate
    const parsed = JSON.parse(jsonString.toString());
    return JSON.stringify(parsed);
  } catch (e) {
    // If JSON is invalid, return empty object
    return '{}';
  }
}
