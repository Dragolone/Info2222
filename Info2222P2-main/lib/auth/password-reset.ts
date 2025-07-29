import * as crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from './secure-auth';
import { SecurityEventType, logSecurityEvent } from '../security/audit';
import { sanitizeString } from '../security/inputSanitization';

// Token expiration time (24 hours)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

// Maximum number of reset requests within rate limit window
const MAX_RESET_REQUESTS = 3;

// Rate limit window (24 hours in milliseconds)
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

// Interface for password reset token data
interface PasswordResetTokenData {
  userId: string;
  email: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  browserFingerprint?: string;
}

interface PasswordResetToken {
  createdAt: Date;
  token: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  browserFingerprint?: string;
  isUsed: boolean;
}

/**
 * Create a password reset token with strong entropy and contextual binding
 *
 * @param email User's email address
 * @param ipAddress IP address of the requestor
 * @param userAgent User agent string of the requestor
 * @param browserFingerprint Optional browser fingerprint for additional binding
 * @returns Object containing token and expiration time, or error message
 */
export async function createPasswordResetToken(
  email: string,
  ipAddress: string,
  userAgent: string,
  browserFingerprint?: string
): Promise<{ token?: string; expiresAt?: Date; error?: string }> {
  try {
    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email);

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: sanitizedEmail,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      select: {
        id: true,
        email: true,
        isLocked: true,
        passwordResetTokens: {
          orderBy: {
            createdAt: 'desc',
          },
          take: MAX_RESET_REQUESTS,
        },
      },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist (security by obscurity)
      // But still log the attempt
      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        undefined,
        ipAddress,
        userAgent,
        { action: 'password_reset_request', attemptedEmail: sanitizedEmail }
      );

      return {
        // Generic message
        error: 'If your email is registered, you will receive a password reset link shortly',
      };
    }

    // Check if account is locked
    if (user.isLocked) {
      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        user.id,
        ipAddress,
        userAgent,
        { action: 'password_reset_request', reason: 'account_locked' }
      );

      return {
        error: 'Your account is currently locked. Please contact support for assistance.',
      };
    }

    // Check rate limiting (prevent reset request flooding)
    const now = new Date();
    const rateWindowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    const recentRequests = user.passwordResetTokens.filter(
      (token: PasswordResetToken) => new Date(token.createdAt) > rateWindowStart
    );

    if (recentRequests.length >= MAX_RESET_REQUESTS) {
      logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        user.id,
        ipAddress,
        userAgent,
        {
          action: 'password_reset_request',
          recentRequests: recentRequests.length,
          rateLimitWindow: `${RATE_LIMIT_WINDOW / (60 * 60 * 1000)} hours`
        }
      );

      return {
        error: 'Too many password reset requests. Please try again later or contact support.',
      };
    }

    // Generate a secure token with high entropy (64 bytes = 512 bits of entropy)
    const tokenBuffer = crypto.randomBytes(64);

    // Create a context-specific component to bind the token to the request context
    const contextualData = `${user.id}:${ipAddress}:${sanitizeString(userAgent)}`;
    const contextHash = crypto
      .createHash('sha256')
      .update(contextualData)
      .digest();

    // Combine random token with contextual component
    const combinedToken = Buffer.concat([tokenBuffer, contextHash]);

    // Create final token as URL-safe base64 string
    const token = combinedToken.toString('base64url');

    // Set expiration time
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY);

    // Store token in database with IP binding and user agent info
    await prisma.passwordResetToken.create({
      data: {
        token: token,
        userId: user.id,
        expiresAt: expiresAt,
        ipAddress: ipAddress,
        userAgent: userAgent.substring(0, 255), // Limit length for storage
        browserFingerprint: browserFingerprint,
        isUsed: false,
      },
    });

    // Delete any expired tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: now,
        },
      },
    });

    // Log the token creation
    logSecurityEvent(
      SecurityEventType.AUTH_SUCCESS,
      user.id,
      ipAddress,
      userAgent,
      { action: 'password_reset_token_created', expiresAt }
    );

    return { token, expiresAt };
  } catch (error) {
    console.error('Error creating password reset token:', error);

    // Log the error
    logSecurityEvent(
      SecurityEventType.AUTH_FAILURE,
      undefined,
      ipAddress,
      userAgent,
      {
        action: 'password_reset_token_creation_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      }
    );

    return {
      error: 'An error occurred while processing your request. Please try again later.',
    };
  }
}

/**
 * Verify a password reset token with context validation
 *
 * @param token Token to verify
 * @param ipAddress IP address of the requestor
 * @param userAgent User agent string of the requestor
 * @param browserFingerprint Optional browser fingerprint for additional binding
 * @returns Object containing user ID if valid, or error message
 */
export async function verifyPasswordResetToken(
  token: string,
  ipAddress: string,
  userAgent: string,
  browserFingerprint?: string
): Promise<{ userId?: string; email?: string; error?: string }> {
  try {
    // Find token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isLocked: true,
          },
        },
      },
    });

    // Check if token exists
    if (!resetToken) {
      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        undefined,
        ipAddress,
        userAgent,
        { action: 'password_reset_verification', reason: 'invalid_token' }
      );

      return {
        error: 'Invalid or expired password reset token.',
      };
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: {
          token,
        },
      });

      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        resetToken.userId,
        ipAddress,
        userAgent,
        { action: 'password_reset_verification', reason: 'expired_token' }
      );

      return {
        error: 'Password reset token has expired. Please request a new one.',
      };
    }

    // Check if token has already been used
    if (resetToken.isUsed) {
      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        resetToken.userId,
        ipAddress,
        userAgent,
        { action: 'password_reset_verification', reason: 'used_token' }
      );

      return {
        error: 'This password reset token has already been used.',
      };
    }

    // Check if account is locked
    if (resetToken.user.isLocked) {
      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        resetToken.userId,
        ipAddress,
        userAgent,
        { action: 'password_reset_verification', reason: 'account_locked' }
      );

      return {
        error: 'Your account is currently locked. Please contact support for assistance.',
      };
    }

    // Verify IP address if strict validation is required
    // For better UX, we can make this a warning instead of an error
    // This handles cases where users might be on mobile networks with changing IPs
    if (resetToken.ipAddress !== ipAddress) {
      // Log suspicious activity but don't necessarily block
      logSecurityEvent(
        SecurityEventType.SUSPICIOUS_INPUT,
        resetToken.userId,
        ipAddress,
        userAgent,
        {
          action: 'password_reset_verification',
          warning: 'ip_address_mismatch',
          tokenIp: resetToken.ipAddress,
          currentIp: ipAddress
        }
      );

      // For high-security applications, you might want to return an error here
      // return { error: 'Password reset must be completed from the same device that requested it.' };
    }

    // Verify user agent for major differences
    // We don't expect an exact match, but major components should be similar
    const tokenUserAgentParts = resetToken.userAgent.split(' ');
    const currentUserAgentParts = userAgent.split(' ');

    // Check for significant user agent differences (browser family, OS, etc.)
    const majorDifference = !tokenUserAgentParts.some((part: string) =>
      currentUserAgentParts.some((current: string) => current.includes(part.substring(0, 5)))
    );

    if (majorDifference) {
      // Log suspicious activity
      logSecurityEvent(
        SecurityEventType.SUSPICIOUS_INPUT,
        resetToken.userId,
        ipAddress,
        userAgent,
        {
          action: 'password_reset_verification',
          warning: 'user_agent_mismatch',
          tokenUserAgent: resetToken.userAgent,
          currentUserAgent: userAgent
        }
      );

      // For high-security applications, you might want to return an error here
      // return { error: 'Password reset must be completed from the same browser that requested it.' };
    }

    // Check browser fingerprint if provided
    if (resetToken.browserFingerprint && browserFingerprint &&
        resetToken.browserFingerprint !== browserFingerprint) {
      // Log suspicious activity
      logSecurityEvent(
        SecurityEventType.SUSPICIOUS_INPUT,
        resetToken.userId,
        ipAddress,
        userAgent,
        {
          action: 'password_reset_verification',
          warning: 'fingerprint_mismatch'
        }
      );

      // For high-security applications, you might want to return an error here
      // return { error: 'Password reset must be completed from the same browser that requested it.' };
    }

    // Token is valid
    return {
      userId: resetToken.userId,
      email: resetToken.user.email,
    };
  } catch (error) {
    console.error('Error verifying password reset token:', error);

    // Log the error
    logSecurityEvent(
      SecurityEventType.AUTH_FAILURE,
      undefined,
      ipAddress,
      userAgent,
      {
        action: 'password_reset_verification_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    return {
      error: 'An error occurred while verifying your password reset token.',
    };
  }
}

/**
 * Reset password using a valid token
 *
 * @param token Reset token
 * @param newPassword New password
 * @param ipAddress IP address of the requestor
 * @param userAgent User agent string of the requestor
 * @returns Object indicating success or error
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  ipAddress: string,
  userAgent: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // First verify the token
    const { userId, error } = await verifyPasswordResetToken(token, ipAddress, userAgent);

    if (error || !userId) {
      return { error: error || 'Invalid reset token' };
    }

    // Hash the new password
    const { hash, salt } = await hashPassword(newPassword);

    // Update user's password and unlock account
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash: hash,
        passwordSalt: salt,
        failedLoginAttempts: 0,
        isLocked: false,
        lastPasswordChange: new Date(),
      },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: {
        token,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Log password change
    logSecurityEvent(
      SecurityEventType.AUTH_SUCCESS,
      userId,
      ipAddress,
      userAgent,
      { action: 'password_reset_complete' }
    );

    // Force logout on all devices (optional, for extra security)
    // This would invalidate all of the user's sessions
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);

    // Log the error
    logSecurityEvent(
      SecurityEventType.AUTH_FAILURE,
      undefined,
      ipAddress,
      userAgent,
      {
        action: 'password_reset_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    return {
      error: 'An error occurred while resetting your password. Please try again.',
    };
  }
}
