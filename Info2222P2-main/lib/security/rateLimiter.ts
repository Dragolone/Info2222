import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';
import { SecurityEventType, logSecurityEventFromRequest } from './audit';

// Initialize Redis client if available
let redisClient: Redis | null = null;

// Try to connect to Redis if REDIS_URL is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
  }
}

// Fallback in-memory store when Redis is unavailable
const memoryStore: Map<string, { count: number; resetAt: number }> = new Map();

// Rate limit configuration for different actions
export enum RateLimitType {
  LOGIN = 'login',
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password-reset',
  API_REQUEST = 'api-request',
  MESSAGE_SEND = 'message-send',
  GROUP_CREATE = 'group-create'
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum number of requests in the time window
  message: string;   // Error message when rate limited
}

// Default rate limit configurations
const rateLimitConfigs: Record<RateLimitType, RateLimitConfig> = {
  [RateLimitType.LOGIN]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: 'Too many login attempts, please try again later'
  },
  [RateLimitType.REGISTRATION]: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations
    message: 'Too many registration attempts, please try again later'
  },
  [RateLimitType.PASSWORD_RESET]: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset attempts
    message: 'Too many password reset attempts, please try again later'
  },
  [RateLimitType.API_REQUEST]: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests
    message: 'Rate limit exceeded, please slow down your requests'
  },
  [RateLimitType.MESSAGE_SEND]: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 messages
    message: 'Message rate limit exceeded, please slow down'
  },
  [RateLimitType.GROUP_CREATE]: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // 10 group creations
    message: 'Group creation rate limit exceeded, please try again later'
  }
};

/**
 * Generate a unique rate limit key based on the request
 *
 * @param req NextRequest object
 * @param type Rate limit type
 * @param customIdentifier Optional custom identifier
 * @returns Rate limit key string
 */
function getRateLimitKey(req: NextRequest, type: RateLimitType, customIdentifier?: string): string {
  // Get client IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  if (customIdentifier) {
    return `ratelimit:${type}:${customIdentifier}:${ip}`;
  }

  return `ratelimit:${type}:${ip}`;
}

/**
 * Increment a rate limit counter in Redis or memory
 *
 * @param key Rate limit key
 * @param windowMs Time window in milliseconds
 * @returns Current count of requests
 */
async function incrementCounter(key: string, windowMs: number): Promise<number> {
  // Try Redis first if available
  if (redisClient && redisClient.status === 'ready') {
    try {
      // Increment counter
      const count = await redisClient.incr(key);

      // If this is the first request, set expiration time
      if (count === 1) {
        await redisClient.pexpire(key, windowMs);
      }

      return count;
    } catch (error) {
      console.error('Redis error when incrementing counter:', error);
      // Fall back to memory store on Redis error
    }
  }

  // Use in-memory store as fallback
  const now = Date.now();
  const record = memoryStore.get(key);

  // If record exists and is still valid
  if (record && record.resetAt > now) {
    record.count += 1;
    memoryStore.set(key, record);
    return record.count;
  }

  // Create new record with expiration
  memoryStore.set(key, {
    count: 1,
    resetAt: now + windowMs
  });

  // Clean up expired records occasionally
  if (Math.random() < 0.01) {
    cleanupMemoryStore();
  }

  return 1;
}

/**
 * Clean up expired rate limit records from memory store
 */
function cleanupMemoryStore() {
  const now = Date.now();

  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Check if a request has exceeded its rate limit
 *
 * @param req NextRequest object
 * @param type Rate limit type
 * @param customIdentifier Optional custom identifier
 * @returns Object indicating if rate limited and remaining requests
 */
export async function checkRateLimit(
  req: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): Promise<{ limited: boolean; remaining: number; resetMs: number }> {
  const config = rateLimitConfigs[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const key = getRateLimitKey(req, type, customIdentifier);
  const count = await incrementCounter(key, config.windowMs);

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, config.max - count);
  const resetMs = config.windowMs;

  // Check if rate limited
  const limited = count > config.max;

  // Log rate limit hits
  if (limited) {
    logSecurityEventFromRequest(
      SecurityEventType.RATE_LIMITED,
      req,
      undefined,
      { type, count, limit: config.max }
    );
  }

  return { limited, remaining, resetMs };
}

/**
 * Middleware to apply rate limiting to a request handler
 *
 * @param req NextRequest object
 * @param type Rate limit type
 * @param handler Request handler function
 * @param customIdentifier Optional custom identifier
 * @returns NextResponse from handler or rate limit error
 */
export async function withRateLimit(
  req: NextRequest,
  type: RateLimitType,
  handler: () => Promise<NextResponse>,
  customIdentifier?: string
): Promise<NextResponse> {
  const { limited, remaining, resetMs } = await checkRateLimit(req, type, customIdentifier);

  if (limited) {
    const config = rateLimitConfigs[type];
    const resetSeconds = Math.ceil(resetMs / 1000);

    return NextResponse.json(
      { error: config.message },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetSeconds.toString(),
          'Retry-After': resetSeconds.toString()
        }
      }
    );
  }

  // Add rate limit headers to the response
  const response = await handler();
  const newHeaders = new Headers(response.headers);

  newHeaders.set('X-RateLimit-Limit', rateLimitConfigs[type].max.toString());
  newHeaders.set('X-RateLimit-Remaining', remaining.toString());
  newHeaders.set('X-RateLimit-Reset', Math.ceil(resetMs / 1000).toString());

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Apply custom rate limit configuration
 *
 * @param type Rate limit type to configure
 * @param config New rate limit configuration
 */
export function configureRateLimit(type: RateLimitType, config: Partial<RateLimitConfig>): void {
  if (!rateLimitConfigs[type]) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  rateLimitConfigs[type] = {
    ...rateLimitConfigs[type],
    ...config
  };
}
