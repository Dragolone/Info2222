import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Initialize Prisma
const prisma = new PrismaClient();

// Security events categorization
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login.success',
  LOGIN_FAILURE = 'login.failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password.change',
  PASSWORD_RESET_REQUEST = 'password.reset.request',
  PASSWORD_RESET_COMPLETE = 'password.reset.complete',
  MFA_ENABLED = 'mfa.enabled',
  MFA_DISABLED = 'mfa.disabled',
  MFA_CHALLENGE = 'mfa.challenge',
  SESSION_EXPIRED = 'session.expired',

  // Access events
  ACCESS_DENIED = 'access.denied',
  ACCESS_GRANTED = 'access.granted',
  PERMISSION_CHANGE = 'permission.change',

  // Account events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_DELETED = 'account.deleted',
  ACCOUNT_LOCKED = 'account.locked',
  ACCOUNT_UNLOCKED = 'account.unlocked',
  EMAIL_CHANGED = 'email.changed',

  // Data events
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  SENSITIVE_DATA_ACCESS = 'data.sensitive.access',

  // System events
  CONFIG_CHANGE = 'config.change',
  ENCRYPTION_KEY_ROTATION = 'encryption.key.rotation',
  API_KEY_CREATED = 'api.key.created',
  API_KEY_DELETED = 'api.key.deleted',

  // Security events
  RATE_LIMITED = 'rate.limited',
  SUSPICIOUS_ACTIVITY = 'suspicious.activity',
  BRUTE_FORCE_ATTEMPT = 'brute.force',
  CSRF_VIOLATION = 'csrf.violation',
  XSS_ATTEMPT = 'xss.attempt',
  SQL_INJECTION_ATTEMPT = 'sql.injection',
  AUTH_FAILURE = 'auth.failure',

  // User events
  USER_INVITED = 'user.invited',
  USER_JOINED_GROUP = 'user.joined.group',
  USER_LEFT_GROUP = 'user.left.group',

  // E2EE events
  KEY_GENERATED = 'key.generated',
  KEY_SHARED = 'key.shared',
  KEY_ROTATED = 'key.rotated',
  KEY_REVOKED = 'key.revoked',

  // Websocket events
  WEBSOCKET_CONNECT = 'websocket.connect',
  WEBSOCKET_DISCONNECT = 'websocket.disconnect',

  // Message events
  MESSAGE_ENCRYPTED = 'message.encrypted',
  MESSAGE_DECRYPTED = 'message.decrypted'
}

// Severity levels for events
export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Interface for security event data
interface SecurityEventData {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  severity?: SecurityEventSeverity;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

// Get default severity for event type
function getDefaultSeverity(eventType: SecurityEventType): SecurityEventSeverity {
  // Critical events
  if (
    eventType === SecurityEventType.BRUTE_FORCE_ATTEMPT ||
    eventType === SecurityEventType.SUSPICIOUS_ACTIVITY ||
    eventType === SecurityEventType.ACCOUNT_LOCKED ||
    eventType === SecurityEventType.XSS_ATTEMPT ||
    eventType === SecurityEventType.SQL_INJECTION_ATTEMPT
  ) {
    return SecurityEventSeverity.CRITICAL;
  }

  // Error events
  if (
    eventType === SecurityEventType.AUTH_FAILURE ||
    eventType === SecurityEventType.LOGIN_FAILURE ||
    eventType === SecurityEventType.CSRF_VIOLATION ||
    eventType === SecurityEventType.ACCESS_DENIED
  ) {
    return SecurityEventSeverity.ERROR;
  }

  // Warning events
  if (
    eventType === SecurityEventType.RATE_LIMITED ||
    eventType === SecurityEventType.PASSWORD_RESET_REQUEST ||
    eventType === SecurityEventType.KEY_REVOKED ||
    eventType === SecurityEventType.SENSITIVE_DATA_ACCESS
  ) {
    return SecurityEventSeverity.WARNING;
  }

  // Info events (default)
  return SecurityEventSeverity.INFO;
}

/**
 * Sanitize metadata to remove sensitive information
 *
 * @param metadata The metadata object to sanitize
 * @returns Sanitized metadata
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'apiKey', 'key', 'authorization',
    'jwt', 'session', 'cookie', 'encryptedKey', 'privateKey',
  ];

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Check if key contains any sensitive keywords
    const isSensitive = sensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeMetadata(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract IP and user agent from a NextRequest
 *
 * @param req The NextRequest object
 * @returns Object containing IP and user agent
 */
function extractRequestInfo(req: NextRequest): { ip: string; userAgent: string } {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';

  return { ip, userAgent };
}

/**
 * Log security event to the database
 *
 * @param eventData Security event data
 */
async function logToDatabase(eventData: SecurityEventData): Promise<void> {
  try {
    await prisma.securityAuditLog.create({
      data: {
        eventType: eventData.type,
        userId: eventData.userId,
        ipAddress: eventData.ip,
        userAgent: eventData.userAgent,
        severity: eventData.severity,
        metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null,
        timestamp: eventData.timestamp || new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to write security event to database:', error);
    // Fall back to file logging
    logToFile(eventData);
  }
}

/**
 * Log security event to a file (fallback)
 *
 * @param eventData Security event data
 */
function logToFile(eventData: SecurityEventData): void {
  try {
    const timestamp = (eventData.timestamp || new Date()).toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      ...eventData,
      metadata: eventData.metadata ? sanitizeMetadata(eventData.metadata) : {},
    });

    const logDir = process.env.SECURITY_LOG_DIR || path.join(os.tmpdir(), 'security-logs');

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `security-${new Date().toISOString().split('T')[0]}.log`);

    fs.appendFileSync(logFile, logEntry + '\n');
  } catch (error) {
    console.error('Failed to write security event to file:', error);
    console.error('Original event:', eventData);
  }
}

/**
 * Log a security event
 *
 * @param eventType Security event type
 * @param userId Optional user ID
 * @param ip Optional IP address
 * @param userAgent Optional user agent
 * @param metadata Optional metadata
 * @param severity Optional severity level
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  userId?: string,
  ip?: string,
  userAgent?: string,
  metadata?: Record<string, any>,
  severity?: SecurityEventSeverity
): Promise<void> {
  // Determine severity if not provided
  const eventSeverity = severity || getDefaultSeverity(eventType);

  // Sanitize metadata to remove sensitive information
  const sanitizedMetadata = metadata ? sanitizeMetadata(metadata) : undefined;

  const eventData: SecurityEventData = {
    type: eventType,
    userId,
    ip,
    userAgent,
    metadata: sanitizedMetadata,
    severity: eventSeverity,
    timestamp: new Date(),
  };

  // Log to console for development and critical events
  if (process.env.NODE_ENV === 'development' || eventSeverity === SecurityEventSeverity.CRITICAL) {
    console.log(`[SECURITY ${eventSeverity.toUpperCase()}] ${eventType}`, {
      userId,
      ip,
      metadata: sanitizedMetadata,
    });
  }

  // Log to database
  await logToDatabase(eventData);
}

/**
 * Log a security event from a NextRequest
 *
 * @param eventType Security event type
 * @param req NextRequest object
 * @param userId Optional user ID
 * @param metadata Optional metadata
 * @param severity Optional severity level
 */
export async function logSecurityEventFromRequest(
  eventType: SecurityEventType,
  req: NextRequest,
  userId?: string,
  metadata?: Record<string, any>,
  severity?: SecurityEventSeverity
): Promise<void> {
  const { ip, userAgent } = extractRequestInfo(req);

  await logSecurityEvent(
    eventType,
    userId,
    ip,
    userAgent,
    metadata,
    severity
  );
}

/**
 * Get recent security events for a user
 *
 * @param userId User ID
 * @param limit Maximum number of events to return
 * @returns Array of security events
 */
export async function getUserSecurityEvents(userId: string, limit: number = 50): Promise<any[]> {
  try {
    const events = await prisma.securityAuditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return events;
  } catch (error) {
    console.error('Failed to retrieve user security events:', error);
    return [];
  }
}

/**
 * Check for suspicious activity patterns for a user
 *
 * @param userId User ID
 * @returns True if suspicious activity detected
 */
export async function checkForSuspiciousActivity(userId: string): Promise<boolean> {
  try {
    // Count login failures in the last hour
    const loginFailures = await prisma.securityAuditLog.count({
      where: {
        userId,
        eventType: SecurityEventType.LOGIN_FAILURE,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    // Count other suspicious events
    const suspiciousEvents = await prisma.securityAuditLog.count({
      where: {
        userId,
        eventType: {
          in: [
            SecurityEventType.BRUTE_FORCE_ATTEMPT,
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            SecurityEventType.CSRF_VIOLATION,
            SecurityEventType.XSS_ATTEMPT,
            SecurityEventType.SQL_INJECTION_ATTEMPT,
          ],
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // Check for multiple access from different locations
    const recentLogins = await prisma.securityAuditLog.findMany({
      where: {
        userId,
        eventType: SecurityEventType.LOGIN_SUCCESS,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        ipAddress: true,
      },
    });

    const uniqueIPs = new Set(recentLogins.map(login => login.ipAddress));

    // If more than 5 failures or any suspicious events or logins from 3+ different IPs in 24h
    return loginFailures >= 5 || suspiciousEvents > 0 || uniqueIPs.size >= 3;
  } catch (error) {
    console.error('Failed to check for suspicious activity:', error);
    return false;
  }
}
