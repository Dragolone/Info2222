import { LRUCache } from 'lru-cache';

// Interface for rate limit options
interface RateLimitOptions {
  interval: number; // Time frame in milliseconds
  limit: number; // Max number of requests per interval
  uniqueTokenPerInterval: number; // Max number of users with active limits
}

// Interface for rate limit instance
interface RateLimit {
  check: (key: string, limit?: number) => Promise<void>;
}

/**
 * Create a rate limiting function that can be applied to API endpoints
 * Uses a sliding window algorithm with LRU cache for efficient storage
 *
 * @param options Configuration options for the rate limiter
 * @returns Rate limit checking function
 */
export default function rateLimit(options: RateLimitOptions): RateLimit {
  // Default options
  const {
    interval = 60 * 1000, // 1 minute
    limit = 10, // 10 requests per interval
    uniqueTokenPerInterval = 500, // Max number of users
  } = options;

  // Create a cache to store tokens (userIds or IPs) and their request counts
  const tokenCache = new LRUCache<string, number[]>({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  // Return the rate limit checker function
  return {
    /**
     * Check if a request should be rate limited
     *
     * @param key Unique identifier for the requester (userId, IP, etc.)
     * @param requestLimit Optional custom limit for this specific check
     * @throws Error if rate limit is exceeded
     */
    check: async (key: string, requestLimit?: number): Promise<void> => {
      // Use provided limit or default
      const currentLimit = requestLimit || limit;

      // Get current timestamp
      const now = Date.now();

      // Get existing timestamps for this key or create new array
      const timestamps = tokenCache.get(key) || [];

      // Filter out timestamps outside the current interval window
      const windowStart = now - interval;
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);

      // Add current timestamp
      validTimestamps.push(now);

      // Update the cache
      tokenCache.set(key, validTimestamps);

      // Check if limit is exceeded
      if (validTimestamps.length > currentLimit) {
        // Calculate when the rate limit will reset (when the oldest request expires)
        const oldestTimestamp = validTimestamps[0];
        const resetTime = oldestTimestamp + interval;
        const timeToReset = Math.ceil((resetTime - now) / 1000); // in seconds

        throw new Error(`Rate limit exceeded. Try again in ${timeToReset} seconds.`);
      }
    },
  };
}

/**
 * Parse the X-Forwarded-For header to get the client's real IP address
 * Useful for rate limiting based on client IP when behind a proxy
 *
 * @param forwardedFor X-Forwarded-For header value
 * @returns The client's real IP address
 */
export function getClientIp(forwardedFor?: string | null): string {
  if (!forwardedFor) return 'unknown';

  // X-Forwarded-For format: client, proxy1, proxy2, ...
  // Get the leftmost IP which is the client's real IP
  const ips = forwardedFor.split(',');
  return ips[0].trim();
}

/**
 * Create a unique token for rate limiting that combines user ID and IP
 * This prevents sharing of rate limits across different IPs for the same user ID
 *
 * @param userId User ID or other identifier
 * @param ip IP address
 * @returns Combined unique token
 */
export function createRateLimitKey(userId: string, ip: string): string {
  return `${userId}:${ip}`;
}

/**
 * Get exponential backoff time for repeated failures
 * Useful for implementing progressive rate limiting
 *
 * @param failureCount Number of consecutive failures
 * @param baseTime Base time in milliseconds
 * @param maxTime Maximum time in milliseconds
 * @returns Backoff time in milliseconds
 */
export function getExponentialBackoff(
  failureCount: number,
  baseTime: number = 1000,
  maxTime: number = 60 * 60 * 1000 // 1 hour
): number {
  // Calculate exponential backoff: baseTime * 2^failureCount
  const backoff = baseTime * Math.pow(2, failureCount);

  // Add some randomness to prevent synchronized retries
  const jitter = Math.random() * 0.1 * backoff;

  // Return the backoff time, capped at maxTime
  return Math.min(backoff + jitter, maxTime);
}
