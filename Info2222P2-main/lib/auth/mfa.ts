import * as crypto from 'crypto';
import base32Encode from 'base32-encode';
import base32Decode from 'base32-decode';

/**
 * Multi-Factor Authentication Utilities
 * Implements TOTP (Time-based One-Time Password) according to RFC 6238
 */

// Generate a new MFA secret key
export const generateMfaSecret = (): string => {
  // Generate a random 20-byte (160-bit) secret
  const secret = crypto.randomBytes(20);

  // Encode the secret in base32 for easier user input (compatible with auth apps)
  return base32Encode(secret, 'RFC4648');
};

// Generate a TOTP URI that can be converted to a QR code
export const generateTotpUri = (
  secret: string,
  accountName: string,
  issuer: string = 'TeamSync'
): string => {
  // The URI format follows the standard for TOTP:
  // otpauth://totp/ISSUER:ACCOUNT?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}`
    + `&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
};

// Verify a TOTP code
export const verifyTotpCode = (
  secret: string,
  token: string,
  window: number = 1
): boolean => {
  if (!secret || !token) {
    return false;
  }

  // Convert token to number and ensure it's 6 digits
  const tokenNumber = parseInt(token, 10);
  if (isNaN(tokenNumber) || token.length !== 6) {
    return false;
  }

  // Decode the base32 secret
  const secretBytes = Buffer.from(base32Decode(secret, 'RFC4648'));

  // Get the current time step (30 seconds)
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000);
  const currentTimeStep = Math.floor(currentTime / timeStep);

  // Check tokens in the acceptable window
  // For window=1, check current time and one step before and after
  for (let i = -window; i <= window; i++) {
    const timeToCheck = currentTimeStep + i;
    if (generateTotpForTimeStep(secretBytes, timeToCheck) === tokenNumber) {
      return true;
    }
  }

  return false;
};

// Generate TOTP code for a specific time step
const generateTotpForTimeStep = (secret: Buffer, timeStep: number): number => {
  // Convert time step to buffer
  const timeBuffer = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    timeBuffer[7 - i] = (timeStep & (0xff << (i * 8))) >> (i * 8);
  }

  // Generate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(timeBuffer);
  const hmacResult = hmac.digest();

  // Get offset and truncate
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary = ((hmacResult[offset] & 0x7f) << 24)
    | ((hmacResult[offset + 1] & 0xff) << 16)
    | ((hmacResult[offset + 2] & 0xff) << 8)
    | (hmacResult[offset + 3] & 0xff);

  // Get 6-digit code
  return binary % 1000000;
};

// Generate a backup code set (for recovery if user loses their device)
export const generateBackupCodes = (
  count: number = 10,
  length: number = 8
): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate random bytes and convert to hex
    const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
    const code = randomBytes.toString('hex').slice(0, length).toUpperCase();

    // Format as 2 groups of 4 characters for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
};

// Hash backup codes for storage
export const hashBackupCode = (code: string): string => {
  return crypto
    .createHash('sha256')
    .update(code.replace('-', '')) // Remove the dash
    .digest('hex');
};

// Verify a backup code against a list of hashed codes
export const verifyBackupCode = (
  providedCode: string,
  hashedCodes: string[]
): boolean => {
  const hashedProvidedCode = hashBackupCode(providedCode);
  return hashedCodes.includes(hashedProvidedCode);
};
