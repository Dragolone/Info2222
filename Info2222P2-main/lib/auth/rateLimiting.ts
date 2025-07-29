import { prisma } from '@/lib/db/prisma';

/**
 * Rate limiting and account lockout mechanisms
 *
 * This module provides utilities for:
 * 1. Tracking failed login attempts
 * 2. Implementing account lockouts for brute force protection
 * 3. IP-based rate limiting for API endpoints
 */

// Memory store for rate limiting
// In production, this would be a Redis or other distributed store
const attemptStore: Record<string, {
  count: number,
  firstAttempt: number,
  lastAttempt: number,
  locked: boolean,
  lockExpires?: number,
}> = {};

// Configure rate limiting parameters
const MAX_FAILED_ATTEMPTS = 5;  // Number of failed attempts before lockout
const ATTEMPT_WINDOW = 60 * 60 * 1000;  // 1 hour window for tracking attempts
const LOCKOUT_DURATION = 30 * 60 * 1000;  // 30 minutes lockout
const IP_RATE_LIMIT = 100;  // Max requests per IP in RATE_LIMIT_WINDOW
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;  // 1 hour window for IP rate limiting

/**
 * Check if a user account is locked due to too many failed attempts
 * @param username Username to check
 * @returns True if the account is locked
 */
export const isAccountLocked = async (username: string): Promise<boolean> => {
  // Check in-memory store first (for quick access)
  const userKey = `user:${username.toLowerCase()}`;
  const userAttempts = attemptStore[userKey];

  if (userAttempts?.locked) {
    // If lockout has expired, unlock the account
    if (userAttempts.lockExpires && userAttempts.lockExpires < Date.now()) {
      userAttempts.locked = false;
      userAttempts.count = 0;
      delete userAttempts.lockExpires;
      return false;
    }
    return true;
  }

  // If no in-memory record or not locked, check database
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) return false;  // User doesn't exist, don't reveal this

  // Account is locked if failed attempts exceed threshold and last attempt is within window
  return false; // In a real implementation, we would check a lockoutUntil field in the user record
};

/**
 * Record a failed login attempt and lock the account if threshold reached
 * @param username Username that failed to login
 * @param ipAddress IP address of the request
 * @returns True if the account is now locked
 */
export const recordFailedLoginAttempt = async (
  username: string,
  ipAddress: string
): Promise<boolean> => {
  const now = Date.now();
  const userKey = `user:${username.toLowerCase()}`;

  // Initialize or update user attempts
  if (!attemptStore[userKey]) {
    attemptStore[userKey] = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
    };
  } else {
    const userAttempts = attemptStore[userKey];

    // If first attempt is outside window, reset counter
    if (now - userAttempts.firstAttempt > ATTEMPT_WINDOW) {
      userAttempts.count = 1;
      userAttempts.firstAttempt = now;
    } else {
      userAttempts.count += 1;
    }

    userAttempts.lastAttempt = now;

    // Lock account if threshold reached
    if (userAttempts.count >= MAX_FAILED_ATTEMPTS) {
      userAttempts.locked = true;
      userAttempts.lockExpires = now + LOCKOUT_DURATION;

      // Log the lockout event
      await prisma.userSecurityLog.create({
        data: {
          userId: 'unknown', // Would be filled if we had the user ID
          action: 'ACCOUNT_LOCKOUT',
          ipAddress,
          details: `Account locked after ${MAX_FAILED_ATTEMPTS} failed login attempts`,
          success: true,
        },
      }).catch(err => console.error('Failed to log account lockout:', err));

      return true;
    }
  }

  // Also track IP-based attempts (to prevent username enumeration)
  const ipKey = `ip:${ipAddress}`;
  if (!attemptStore[ipKey]) {
    attemptStore[ipKey] = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
    };
  } else {
    const ipAttempts = attemptStore[ipKey];

    // If first attempt is outside window, reset counter
    if (now - ipAttempts.firstAttempt > ATTEMPT_WINDOW) {
      ipAttempts.count = 1;
      ipAttempts.firstAttempt = now;
    } else {
      ipAttempts.count += 1;
    }

    ipAttempts.lastAttempt = now;
  }

  return false;
};

/**
 * Record a successful login and reset failed attempt counter
 * @param username Username that successfully logged in
 */
export const recordSuccessfulLogin = (username: string): void => {
  const userKey = `user:${username.toLowerCase()}`;

  // Reset user attempts on successful login
  if (attemptStore[userKey]) {
    attemptStore[userKey].count = 0;
    attemptStore[userKey].locked = false;
    delete attemptStore[userKey].lockExpires;
  }
};

/**
 * Check if an IP address is rate limited
 * @param ipAddress IP address to check
 * @returns True if the IP is rate limited
 */
export const isIpRateLimited = (ipAddress: string): boolean => {
  const now = Date.now();
  const ipKey = `ip:${ipAddress}`;
  const ipAttempts = attemptStore[ipKey];

  if (!ipAttempts) return false;

  // If first attempt is outside window, reset counter
  if (now - ipAttempts.firstAttempt > RATE_LIMIT_WINDOW) {
    ipAttempts.count = 0;
    ipAttempts.firstAttempt = now;
    return false;
  }

  // Rate limit if threshold reached
  return ipAttempts.count >= IP_RATE_LIMIT;
};

/**
 * Record an API request for rate limiting
 * @param ipAddress IP address making the request
 * @returns True if the IP is now rate limited
 */
export const recordApiRequest = (ipAddress: string): boolean => {
  const now = Date.now();
  const ipKey = `ip:${ipAddress}`;

  // Initialize or update IP attempts
  if (!attemptStore[ipKey]) {
    attemptStore[ipKey] = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
    };
  } else {
    const ipAttempts = attemptStore[ipKey];

    // If first attempt is outside window, reset counter
    if (now - ipAttempts.firstAttempt > RATE_LIMIT_WINDOW) {
      ipAttempts.count = 1;
      ipAttempts.firstAttempt = now;
    } else {
      ipAttempts.count += 1;
    }

    ipAttempts.lastAttempt = now;

    // Rate limit if threshold reached
    if (ipAttempts.count >= IP_RATE_LIMIT) {
      return true;
    }
  }

  return false;
};

// Cleanup function to remove old entries (would be called periodically)
export const cleanupStaleEntries = (): void => {
  const now = Date.now();

  Object.keys(attemptStore).forEach(key => {
    const entry = attemptStore[key];

    // Remove entries that haven't been accessed for longer than the window
    if (now - entry.lastAttempt > Math.max(ATTEMPT_WINDOW, RATE_LIMIT_WINDOW)) {
      delete attemptStore[key];
    }
    // Unlock expired lockouts
    else if (entry.locked && entry.lockExpires && entry.lockExpires < now) {
      entry.locked = false;
      entry.count = 0;
      delete entry.lockExpires;
    }
  });
};
