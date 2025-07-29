import * as argon2 from 'argon2';
import * as crypto from 'crypto';

/**
 * Argon2 password hashing utility
 * Uses Argon2id variant which provides a balance of resistance against
 * both side-channel and GPU attacks
 */

// Configuration for Argon2 hashing
const ARGON2_CONFIG = {
  // Memory cost (in KiB)
  memoryCost: 65536, // 64 MB
  // Time cost (number of iterations)
  timeCost: 3,
  // Parallelism factor (number of threads)
  parallelism: 4,
  // Output hash length
  hashLength: 32,
  // Algorithm type (Argon2id combines Argon2i and Argon2d)
  type: argon2.argon2id
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Promise resolving to the hashed password with salt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Generate a cryptographically secure salt
    const salt = crypto.randomBytes(16);

    // Hash the password using Argon2id with our configuration
    const hash = await argon2.hash(password, {
      ...ARGON2_CONFIG,
      salt
    });

    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a password against a stored hash
 * @param hash - The stored password hash
 * @param password - Plain text password to verify
 * @returns Promise resolving to true if the password matches, false otherwise
 */
export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Password verification error:', error);
    // Return false on error rather than throwing
    // This helps prevent timing attacks by consistently
    // returning false for invalid inputs
    return false;
  }
};

/**
 * Generate a secure random string for tokens
 * @param length - Length of the token in bytes (default: 32)
 * @returns Secure random hex string
 */
export const generateSecureToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token for storage (e.g., for password reset tokens)
 * Uses a simpler SHA-256 hash as these are short-lived tokens
 */
export const hashToken = (token: string): string => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Additional timing-safe comparison for tokens
export const timingSafeEqual = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'hex'),
      Buffer.from(b, 'hex')
    );
  } catch (error) {
    // If buffers are of different length, return false
    return false;
  }
};
