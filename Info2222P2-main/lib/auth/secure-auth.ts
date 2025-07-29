import * as crypto from 'crypto';
import { validatePassword } from '../security/inputSanitization';
import { SECURITY_CONSTANTS } from '../security';
import { prisma } from '@/lib/db/prisma';
import { logSecurityEvent, SecurityEventType } from '../security/audit';

/**
 * Hash a password using PBKDF2 with a random salt
 *
 * @param password The plaintext password
 * @returns Object containing the hashed password and salt
 */
export async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
}> {
  // Validate password strength before hashing
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(`Weak password: ${validation.reasons.join(', ')}`);
  }

  // Generate a random salt
  const salt = crypto.randomBytes(32).toString('hex');

  // Hash the password using PBKDF2
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      SECURITY_CONSTANTS.PASSWORD_HASH_ITERATIONS,
      SECURITY_CONSTANTS.PASSWORD_HASH_KEYLEN,
      SECURITY_CONSTANTS.PASSWORD_HASH_ALGORITHM,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex'));
      }
    );
  });

  return { hash, salt };
}

/**
 * Verify a password against a stored hash and salt
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param password The plaintext password to verify
 * @param storedHash The stored hash to compare against
 * @param salt The salt used in the original hash
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  try {
    // Hash the password with the same salt
    const hashBuffer = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        SECURITY_CONSTANTS.PASSWORD_HASH_ITERATIONS,
        SECURITY_CONSTANTS.PASSWORD_HASH_KEYLEN,
        SECURITY_CONSTANTS.PASSWORD_HASH_ALGORITHM,
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey);
        }
      );
    });

    const hashCheck = hashBuffer.toString('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hashCheck, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Authenticate a user with email and password
 *
 * @param email User's email
 * @param password User's password
 * @param ip Client IP address for logging
 * @returns User object if authentication successful, null otherwise
 */
export async function authenticateUser(
  email: string,
  password: string,
  ip: string,
  userAgent?: string
): Promise<any | null> {
  try {
    // Fetch user by email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        passwordSalt: true,
        isLocked: true,
        failedLoginAttempts: true,
        lastFailedLoginAttempt: true,
      },
    });

    if (!user) {
      // Log failed login attempt
      logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        undefined,
        ip,
        userAgent,
        { reason: 'User not found', attemptedEmail: email }
      );
      return null;
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockoutEndTime = new Date(
        user.lastFailedLoginAttempt!.getTime() + SECURITY_CONSTANTS.LOCKOUT_DURATION
      );
      const now = new Date();

      if (now < lockoutEndTime) {
        // Account is still locked
        logSecurityEvent(
          SecurityEventType.AUTH_FAILURE,
          user.id,
          ip,
          userAgent,
          { reason: 'Account locked', lockoutEndsAt: lockoutEndTime }
        );
        return null;
      }

      // Lockout period has expired, unlock the account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isLocked: false,
          failedLoginAttempts: 0,
        },
      });
    }

    // Verify password
    const isValid = await verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt
    );

    if (!isValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
        lastFailedLoginAttempt: new Date(),
      };

      // Lock account if max attempts reached
      if (failedAttempts >= SECURITY_CONSTANTS.MAX_FAILED_LOGINS) {
        updateData.isLocked = true;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Log failed attempt
      logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        user.id,
        ip,
        userAgent,
        {
          reason: 'Invalid password',
          failedAttempts,
          accountLocked: failedAttempts >= SECURITY_CONSTANTS.MAX_FAILED_LOGINS
        }
      );

      return null;
    }

    // Authentication successful, reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAttempt: null,
      },
    });

    // Log successful login
    logSecurityEvent(
      SecurityEventType.AUTH_SUCCESS,
      user.id,
      ip,
      userAgent,
      { timestamp: new Date() }
    );

    // Return user without sensitive data
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Generate a secure random token
 *
 * @param length Length of the token in bytes (default: 32)
 * @returns Random token as a hex string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a time-limited token for password reset
 *
 * @param userId User ID for the token
 * @param expiresIn Expiration time in milliseconds (default: 1 hour)
 * @returns Object with token and expiration date
 */
export async function generatePasswordResetToken(
  userId: string,
  expiresIn: number = 60 * 60 * 1000 // 1 hour
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + expiresIn);

  // Store token in database
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Verify a password reset token
 *
 * @param token The token to verify
 * @returns User ID if token is valid, null otherwise
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) return null;

  // Check if token has expired
  if (resetToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.passwordResetToken.delete({
      where: { token },
    });
    return null;
  }

  return resetToken.userId;
}

/**
 * Complete a password reset
 *
 * @param token The reset token
 * @param newPassword The new password
 * @returns True if password was reset, false otherwise
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const userId = await verifyPasswordResetToken(token);

  if (!userId) return false;

  try {
    // Hash the new password
    const { hash, salt } = await hashPassword(newPassword);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hash,
        passwordSalt: salt,
        failedLoginAttempts: 0,
        isLocked: false,
      },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    // Log the password reset
    logSecurityEvent(
      SecurityEventType.AUTH_SUCCESS,
      userId,
      'unknown',
      undefined,
      { action: 'password_reset' }
    );

    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}
