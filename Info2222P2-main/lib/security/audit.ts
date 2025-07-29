import { NextRequest } from 'next/server';
import { getClientIp } from './rateLimit';

// Enum for security event types
export enum SecurityEventType {
  AUTH_SUCCESS = 'authentication_success',
  AUTH_FAILURE = 'authentication_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_INPUT = 'suspicious_input',
  ACCESS_DENIED = 'access_denied',
  API_ABUSE = 'api_abuse',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  E2EE_FAILURE = 'e2ee_failure',
  KEY_GENERATION = 'key_generation',
  KEY_ROTATION = 'key_rotation',
  KEY_REVOCATION = 'key_revocation',
  KEY_SHARING = 'key_sharing',
  CERTIFICATE_ISSUE = 'certificate_issue',
}

// Interface for security events
interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent?: string;
  timestamp: number;
  details: Record<string, any>;
}

// Global storage for security events (in-memory for development, would use a database in production)
const securityEvents: SecurityEvent[] = [];

/**
 * Log a security event
 *
 * @param type Type of security event
 * @param userId Optional user ID associated with the event
 * @param ip IP address associated with the event
 * @param userAgent User agent string from the request
 * @param details Additional details about the event
 * @returns The created security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  userId: string | undefined,
  ip: string,
  userAgent: string | undefined,
  details: Record<string, any>
): SecurityEvent {
  const event: SecurityEvent = {
    type,
    userId,
    ip,
    userAgent,
    timestamp: Date.now(),
    details,
  };

  // Store the event
  securityEvents.push(event);

  // In a production environment, you would also:
  // 1. Write to a secure database or log service
  // 2. Potentially trigger alerts for critical events
  // 3. Forward to a SIEM system if available

  return event;
}

/**
 * Log a security event from a Next.js API request
 *
 * @param type Type of security event
 * @param request Next.js request object
 * @param userId Optional user ID associated with the event
 * @param details Additional details about the event
 * @returns The created security event
 */
export function logSecurityEventFromRequest(
  type: SecurityEventType,
  request: NextRequest,
  userId?: string,
  details: Record<string, any> = {}
): SecurityEvent {
  const ip = getClientIp(request.headers.get('x-forwarded-for')) || request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  return logSecurityEvent(type, userId, ip, userAgent, details);
}

/**
 * Get all security events (for admin dashboards or security analysis)
 *
 * @param options Optional filtering options
 * @returns Array of security events
 */
export function getSecurityEvents(options?: {
  userId?: string;
  type?: SecurityEventType;
  startTime?: number;
  endTime?: number;
  limit?: number;
}): SecurityEvent[] {
  let filteredEvents = [...securityEvents];

  // Apply filters if provided
  if (options) {
    if (options.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === options.userId);
    }

    if (options.type) {
      filteredEvents = filteredEvents.filter(event => event.type === options.type);
    }

    if (options.startTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= options.endTime!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }
  }

  return filteredEvents;
}

/**
 * Check if there are suspicious authentication failures for a user or IP
 * Useful for detecting brute force attacks
 *
 * @param identifier User ID or IP address
 * @param timeWindow Time window in milliseconds to check (default: 15 minutes)
 * @param threshold Number of failures to consider suspicious (default: 5)
 * @returns True if suspicious activity detected, false otherwise
 */
export function detectSuspiciousAuthActivity(
  identifier: string,
  timeWindow: number = 15 * 60 * 1000, // 15 minutes
  threshold: number = 5
): boolean {
  const now = Date.now();
  const startTime = now - timeWindow;

  // Count authentication failures in the time window
  const failures = securityEvents.filter(event =>
    event.type === SecurityEventType.AUTH_FAILURE &&
    (event.userId === identifier || event.ip === identifier) &&
    event.timestamp >= startTime
  );

  return failures.length >= threshold;
}

/**
 * Analysis function to detect potential reconnaissance or scanning activity
 *
 * @param ip IP address to check
 * @param timeWindow Time window in milliseconds to check (default: 10 minutes)
 * @param threshold Number of access denied events to consider suspicious (default: 8)
 * @returns True if reconnaissance activity detected, false otherwise
 */
export function detectReconnaissanceActivity(
  ip: string,
  timeWindow: number = 10 * 60 * 1000, // 10 minutes
  threshold: number = 8
): boolean {
  const now = Date.now();
  const startTime = now - timeWindow;

  // Count access denied events in the time window
  const accessDenied = securityEvents.filter(event =>
    event.type === SecurityEventType.ACCESS_DENIED &&
    event.ip === ip &&
    event.timestamp >= startTime
  );

  return accessDenied.length >= threshold;
}

/**
 * Clear old security events to prevent memory growth
 * In production, you would archive these instead of deleting
 *
 * @param maxAge Maximum age of events to keep in milliseconds (default: 30 days)
 */
export function cleanupOldEvents(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
  const cutoffTime = Date.now() - maxAge;

  // Remove events older than cutoff time
  const oldEventsCount = securityEvents.length;

  // Filter in-place to keep only recent events
  const newEvents = securityEvents.filter(event => event.timestamp >= cutoffTime);

  // Clear the array and add back the filtered events
  securityEvents.length = 0;
  securityEvents.push(...newEvents);

  const removedCount = oldEventsCount - securityEvents.length;

  // In production, you might log this operation or send metrics
  console.log(`Cleaned up ${removedCount} old security events`);
}

// Set up a periodic cleanup (every hour in this example)
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setInterval(cleanupOldEvents, 60 * 60 * 1000); // 1 hour
}
