import { z } from 'zod';

/**
 * Password Policy Enforcement
 *
 * This module provides utilities for:
 * 1. Enforcing password complexity requirements
 * 2. Checking passwords against common password lists
 * 3. Password expiration and rotation policies
 */

// Password complexity requirements
export const passwordRequirements = {
  minLength: 8,
  maxLength: 100,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  passwordExpiryDays: 90, // Passwords expire after 90 days
  preventPasswordReuse: 5, // Can't reuse the last 5 passwords
};

// Regular expressions for password validation
const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  numbers: /[0-9]/,
  specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

// Small list of common passwords (in a real app, this would be much more extensive)
const commonPasswords = [
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'admin',
  'welcome',
  'letmein',
];

/**
 * Zod schema for validating passwords
 * Can be used in API endpoints for input validation
 */
export const passwordValidationSchema = z
  .string()
  .min(
    passwordRequirements.minLength,
    `Password must be at least ${passwordRequirements.minLength} characters long`
  )
  .max(
    passwordRequirements.maxLength,
    `Password must be at most ${passwordRequirements.maxLength} characters long`
  )
  .refine(
    (password) => !passwordRequirements.requireUppercase || passwordRegex.uppercase.test(password),
    {
      message: 'Password must contain at least one uppercase letter',
    }
  )
  .refine(
    (password) => !passwordRequirements.requireLowercase || passwordRegex.lowercase.test(password),
    {
      message: 'Password must contain at least one lowercase letter',
    }
  )
  .refine(
    (password) => !passwordRequirements.requireNumbers || passwordRegex.numbers.test(password),
    {
      message: 'Password must contain at least one number',
    }
  )
  .refine(
    (password) => !passwordRequirements.requireSpecialChars || passwordRegex.specialChars.test(password),
    {
      message: 'Password must contain at least one special character',
    }
  )
  .refine(
    (password) => !passwordRequirements.preventCommonPasswords || !isCommonPassword(password),
    {
      message: 'This password is too common and can be easily guessed',
    }
  );

/**
 * Check if a password is on the common password list
 * @param password Password to check
 * @returns True if the password is common, false otherwise
 */
export const isCommonPassword = (password: string): boolean => {
  const lowerPassword = password.toLowerCase();
  return commonPasswords.includes(lowerPassword);
};

/**
 * Calculate password strength score (0-100)
 * @param password Password to evaluate
 * @returns Score from 0-100 indicating password strength
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let score = 0;
  const length = password.length;

  // Base score from length
  if (length >= passwordRequirements.minLength) {
    score += 20;
    // Extra points for longer passwords
    const extraLength = Math.min(length - passwordRequirements.minLength, 12);
    score += extraLength * 2;
  } else {
    // Partial credit for length below minimum
    score += (length / passwordRequirements.minLength) * 20;
  }

  // Character complexity
  if (passwordRegex.uppercase.test(password)) score += 10;
  if (passwordRegex.lowercase.test(password)) score += 10;
  if (passwordRegex.numbers.test(password)) score += 10;
  if (passwordRegex.specialChars.test(password)) score += 10;

  // Variety of characters
  const uniqueChars = new Set(password).size;
  const uniqueRatio = uniqueChars / length;
  score += uniqueRatio * 10;

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/^[a-zA-Z]+\d+$/.test(password)) score -= 5; // Simple word+number pattern
  if (/^[a-zA-Z]+$/.test(password)) score -= 10; // Letters only
  if (/^\d+$/.test(password)) score -= 15; // Numbers only

  // Check against common passwords
  if (isCommonPassword(password)) score = Math.min(score, 30);

  // Ensure score is in range 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Get a password strength category
 * @param score Password strength score (0-100)
 * @returns String category: 'very-weak', 'weak', 'moderate', 'strong', or 'very-strong'
 */
export const getPasswordStrengthCategory = (score: number): string => {
  if (score < 20) return 'very-weak';
  if (score < 40) return 'weak';
  if (score < 60) return 'moderate';
  if (score < 80) return 'strong';
  return 'very-strong';
};

/**
 * Check if a password has expired
 * @param passwordChangedAt Date when the password was last changed
 * @returns True if the password has expired, false otherwise
 */
export const isPasswordExpired = (passwordChangedAt: Date): boolean => {
  if (!passwordRequirements.passwordExpiryDays) return false;

  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + passwordRequirements.passwordExpiryDays);

  return new Date() > expiryDate;
};

/**
 * Check if a new password matches any of the previous passwords
 * @param newPasswordHash Hash of the new password
 * @param previousPasswordHashes Array of previous password hashes
 * @param compareFunction Function to compare password hashes
 * @returns True if the new password matches a previous one, false otherwise
 */
export const isPasswordReused = async (
  newPasswordHash: string,
  previousPasswordHashes: string[],
  compareFunction: (hash1: string, hash2: string) => Promise<boolean>
): Promise<boolean> => {
  if (!passwordRequirements.preventPasswordReuse) return false;

  const recentHashes = previousPasswordHashes.slice(-passwordRequirements.preventPasswordReuse);

  for (const hash of recentHashes) {
    if (await compareFunction(hash, newPasswordHash)) {
      return true;
    }
  }

  return false;
};
