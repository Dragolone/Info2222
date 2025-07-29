import jwt, { SignOptions } from 'jsonwebtoken';
import { generateNonce } from '../encryption/crypto';

interface JwtPayload {
  sub: string;        // subject (user ID)
  username?: string;  // optional username
  role?: string;      // optional role for authorization
  iat?: number;       // issued at timestamp
  exp?: number;       // expiration timestamp
  jti?: string;       // JWT ID for uniqueness
  nonce?: string;     // prevent replay attacks
}

/**
 * Generate a JWT token for authentication
 * @param userId - The user ID to include in the token
 * @param username - Optional username to include in the token
 * @param role - Optional role for authorization
 * @param expiresIn - Token expiration time (default: from env or 1d)
 * @returns JWT token string
 */
export const generateToken = (
  userId: string,
  username?: string,
  role?: string,
  expiresIn: string = process.env.JWT_EXPIRES_IN || '1d'
): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload: JwtPayload = {
    sub: userId,
    jti: generateNonce(), // Unique token ID
    nonce: generateNonce(), // Prevent replay attacks
  };

  if (username) {
    payload.username = username;
  }

  if (role) {
    payload.role = role;
  }

  return jwt.sign(payload, process.env.JWT_SECRET as jwt.Secret, {
    expiresIn,
  } as SignOptions);
};

/**
 * Verify a JWT token and return the payload
 * @param token - JWT token to verify
 * @returns Decoded JWT payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

/**
 * Decode a JWT token without verification
 * Useful for getting the token's expiration without validating signature
 * @param token - JWT token to decode
 * @returns Decoded JWT payload or null if malformed
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('JWT decoding failed:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 * @param token - JWT token to check
 * @returns true if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // Compare expiration timestamp with current time
  return decoded.exp < Math.floor(Date.now() / 1000);
};

/**
 * Generate a refresh token with longer expiration
 * @param userId - The user ID to include in the token
 * @returns Refresh token string
 */
export const generateRefreshToken = (userId: string): string => {
  return generateToken(userId, undefined, undefined, '7d');
};

/**
 * Extract user ID from a token
 * @param token - JWT token
 * @returns User ID or null if invalid
 */
export const getUserIdFromToken = (token: string): string | null => {
  const decoded = verifyToken(token);
  return decoded?.sub || null;
};
