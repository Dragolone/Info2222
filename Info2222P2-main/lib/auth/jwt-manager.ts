import jwt, { JwtPayload } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import { SecurityEventType, logSecurityEvent } from '../security/audit';

// Interface for JWT configuration
interface JwtConfig {
  algorithm: jwt.Algorithm;
  expiresIn: jwt.SignOptions['expiresIn'];
  issuer: string;
  audience: string;
  jwtid?: string;
}

// Interface for token verification options
interface VerificationOptions {
  audience?: string;
  issuer?: string;
  ignoreExpiration?: boolean;
  subject?: string;
}

// Interface for JWT secrets rotation configuration
interface SecretRotationConfig {
  primarySecret: string;
  fallbackSecrets: string[];
  keyCreationTimestamp: number;
  rotationEnabled: boolean;
  rotationInterval: number; // milliseconds
  rotationScheduled: boolean;
  nextRotationTimestamp: number;
}

// Default JWT configuration
const DEFAULT_JWT_CONFIG: JwtConfig = {
  algorithm: 'HS256',
  expiresIn: '1d', // 1 day
  issuer: 'teamsync-auth',
  audience: 'teamsync-api',
};

// Default rotation configuration (90 days)
const DEFAULT_ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

// In-memory configuration storage (would be in a secure database in production)
let jwtSecrets: SecretRotationConfig = {
  primarySecret: '',
  fallbackSecrets: [],
  keyCreationTimestamp: Date.now(),
  rotationEnabled: true,
  rotationInterval: DEFAULT_ROTATION_INTERVAL,
  rotationScheduled: false,
  nextRotationTimestamp: 0,
};

// Stored JWT configuration
let jwtConfig: JwtConfig = { ...DEFAULT_JWT_CONFIG };

/**
 * Initialize JWT secrets and configuration
 * Loads from environment or generates if not available
 *
 * @param config Optional JWT configuration
 * @returns True if initialization was successful
 */
export function initializeJwtSecrets(config?: Partial<JwtConfig>): boolean {
  try {
    // Update JWT configuration if provided
    if (config) {
      jwtConfig = { ...jwtConfig, ...config };
    }

    // Try to load from environment variables
    const envSecret = process.env.JWT_SECRET;
    const envFallback = process.env.JWT_FALLBACK_SECRETS;

    if (envSecret) {
      jwtSecrets.primarySecret = envSecret;
      console.log('Loaded JWT secret from environment variable');

      if (envFallback) {
        jwtSecrets.fallbackSecrets = envFallback.split(',');
        console.log(`Loaded ${jwtSecrets.fallbackSecrets.length} fallback secrets from environment`);
      }
    } else {
      // Try to load from file (for development environments)
      try {
        const secretsFilePath = path.join(process.cwd(), 'jwt-secrets.json');
        if (fs.existsSync(secretsFilePath)) {
          const fileData = JSON.parse(fs.readFileSync(secretsFilePath, 'utf8'));
          jwtSecrets.primarySecret = fileData.primarySecret;
          jwtSecrets.fallbackSecrets = fileData.fallbackSecrets || [];
          jwtSecrets.keyCreationTimestamp = fileData.keyCreationTimestamp || Date.now();
          console.log('Loaded JWT secrets from file');
        }
      } catch (fileError) {
        console.warn('Failed to load JWT secrets from file, will generate new secrets');
      }
    }

    // Generate a new secret if none exists
    if (!jwtSecrets.primarySecret) {
      jwtSecrets.primarySecret = generateJwtSecret();
      jwtSecrets.keyCreationTimestamp = Date.now();
      console.log('Generated new JWT secret');

      // Store for development environments (would be in a secure database in production)
      if (process.env.NODE_ENV !== 'production') {
        try {
          const secretsFilePath = path.join(process.cwd(), 'jwt-secrets.json');
          fs.writeFileSync(
            secretsFilePath,
            JSON.stringify({
              primarySecret: jwtSecrets.primarySecret,
              fallbackSecrets: jwtSecrets.fallbackSecrets,
              keyCreationTimestamp: jwtSecrets.keyCreationTimestamp,
            }, null, 2)
          );
          console.log('Saved JWT secrets to file for development');
        } catch (writeError) {
          console.warn('Failed to save JWT secrets to file:', writeError);
        }
      }
    }

    // Set up next rotation timestamp
    jwtSecrets.nextRotationTimestamp = jwtSecrets.keyCreationTimestamp + jwtSecrets.rotationInterval;

    // Schedule key rotation if enabled
    if (jwtSecrets.rotationEnabled && !jwtSecrets.rotationScheduled) {
      scheduleKeyRotation();
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize JWT secrets:', error);

    // Log security event
    logSecurityEvent(
      SecurityEventType.CERTIFICATE_ISSUE,
      undefined,
      'server',
      undefined,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );

    return false;
  }
}

/**
 * Generate a cryptographically secure random JWT secret
 *
 * @param length Length of the secret in bytes (default: 64 bytes = 512 bits)
 * @returns Random secret as a base64 string
 */
function generateJwtSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Schedule key rotation based on rotation interval
 */
function scheduleKeyRotation(): void {
  const now = Date.now();
  const timeUntilNextRotation = Math.max(0, jwtSecrets.nextRotationTimestamp - now);

  // Schedule next rotation
  setTimeout(() => {
    rotateJwtSecrets();
    scheduleKeyRotation();
  }, timeUntilNextRotation);

  jwtSecrets.rotationScheduled = true;

  console.log(`Scheduled JWT key rotation in ${Math.floor(timeUntilNextRotation / (24 * 60 * 60 * 1000))} days`);
}

/**
 * Rotate JWT secrets by generating a new primary secret
 * and moving the old primary to fallbacks
 */
export function rotateJwtSecrets(): void {
  try {
    // Save old primary as fallback
    jwtSecrets.fallbackSecrets.unshift(jwtSecrets.primarySecret);

    // Limit the number of fallback secrets (keep last 3)
    if (jwtSecrets.fallbackSecrets.length > 3) {
      jwtSecrets.fallbackSecrets = jwtSecrets.fallbackSecrets.slice(0, 3);
    }

    // Generate new primary secret
    jwtSecrets.primarySecret = generateJwtSecret();
    jwtSecrets.keyCreationTimestamp = Date.now();
    jwtSecrets.nextRotationTimestamp = jwtSecrets.keyCreationTimestamp + jwtSecrets.rotationInterval;

    // Log the rotation (without exposing the secrets)
    console.log(`Rotated JWT secrets at ${new Date().toISOString()}`);
    console.log(`Next rotation scheduled for ${new Date(jwtSecrets.nextRotationTimestamp).toISOString()}`);

    // Store updated secrets for development environments
    if (process.env.NODE_ENV !== 'production') {
      try {
        const secretsFilePath = path.join(process.cwd(), 'jwt-secrets.json');
        fs.writeFileSync(
          secretsFilePath,
          JSON.stringify({
            primarySecret: jwtSecrets.primarySecret,
            fallbackSecrets: jwtSecrets.fallbackSecrets,
            keyCreationTimestamp: jwtSecrets.keyCreationTimestamp,
          }, null, 2)
        );
      } catch (writeError) {
        console.warn('Failed to save rotated JWT secrets to file:', writeError);
      }
    }

    // Log security event
    logSecurityEvent(
      SecurityEventType.KEY_ROTATION,
      undefined,
      'server',
      undefined,
      {
        service: 'jwt',
        timestamp: jwtSecrets.keyCreationTimestamp,
        nextRotation: jwtSecrets.nextRotationTimestamp
      }
    );
  } catch (error) {
    console.error('Failed to rotate JWT secrets:', error);

    // Log security event
    logSecurityEvent(
      SecurityEventType.KEY_ROTATION,
      undefined,
      'server',
      undefined,
      {
        service: 'jwt',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
}

/**
 * Check if JWT secrets are initialized
 *
 * @returns True if JWT secrets are initialized
 */
export function areJwtSecretsInitialized(): boolean {
  return !!jwtSecrets.primarySecret;
}

/**
 * Create a JWT token
 *
 * @param payload Data to include in the token
 * @param expiresIn Override default expiration time
 * @returns JWT token string
 */
export function createToken(
  payload: object,
  expiresIn?: jwt.SignOptions['expiresIn']
): string {
  if (!areJwtSecretsInitialized()) {
    initializeJwtSecrets();
  }

  const options: jwt.SignOptions = {
    algorithm: jwtConfig.algorithm,
    expiresIn: expiresIn || jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    jwtid: jwtConfig.jwtid || crypto.randomUUID(),
  };

  return jwt.sign(payload, jwtSecrets.primarySecret, options);
}

/**
 * Verify a JWT token
 *
 * @param token Token to verify
 * @param options Verification options
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(
  token: string,
  options?: VerificationOptions
): JwtPayload | null {
  if (!areJwtSecretsInitialized()) {
    initializeJwtSecrets();
  }

  const verifyOptions: jwt.VerifyOptions = {
    algorithms: [jwtConfig.algorithm],
    audience: options?.audience || jwtConfig.audience,
    issuer: options?.issuer || jwtConfig.issuer,
    ignoreExpiration: options?.ignoreExpiration || false,
    subject: options?.subject,
  };

  // Try with primary secret first
  try {
    return jwt.verify(token, jwtSecrets.primarySecret, verifyOptions) as JwtPayload;
  } catch (primaryError) {
    // If primary fails, try with fallback secrets
    for (const fallbackSecret of jwtSecrets.fallbackSecrets) {
      try {
        const payload = jwt.verify(token, fallbackSecret, verifyOptions) as JwtPayload;

        // If verification succeeds with a fallback, re-issue with primary
        console.log('JWT verified with fallback secret, consider reissuing with primary secret');

        return payload;
      } catch (fallbackError) {
        // Continue to next fallback
      }
    }

    // If we get here, all verifications failed
    console.warn('JWT verification failed with all secrets');
    return null;
  }
}

/**
 * Check if a token is expired
 *
 * @param token JWT token to check
 * @returns True if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Decode without verification just to check expiration
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded || !decoded.exp) {
      // Invalid token or missing expiration
      return true;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    // Error decoding token
    return true;
  }
}

/**
 * Refresh a token if it's going to expire soon
 *
 * @param token Current token
 * @param thresholdMs Time threshold in milliseconds (default: 1 hour)
 * @returns New token if refresh needed, original token otherwise
 */
export function refreshTokenIfNeeded(token: string, thresholdMs: number = 60 * 60 * 1000): string {
  try {
    // First verify the token
    const payload = verifyToken(token);

    if (!payload || !payload.exp) {
      // Invalid token or missing expiration
      return token;
    }

    // Check if token is close to expiration
    const expirationMs = payload.exp * 1000;
    const now = Date.now();

    if (expirationMs - now < thresholdMs) {
      // Token is close to expiration, issue a new one
      // Remove standard claims before recreating
      const { iat, exp, nbf, iss, aud, jti, ...customPayload } = payload;

      return createToken(customPayload);
    }

    // Token is still valid for a while
    return token;
  } catch (error) {
    // Error refreshing token, return original
    console.error('Error refreshing token:', error);
    return token;
  }
}
