import * as crypto from 'crypto';

/**
 * Utility functions for encryption and cryptography operations
 * Uses AES-256-GCM for symmetric encryption (messages)
 * Uses RSA for asymmetric encryption (key exchange)
 */

// Constants for encryption
const ALGORITHM = 'aes-256-gcm'; // Using GCM mode for authenticated encryption
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 12 bytes for GCM mode
const AUTH_TAG_LENGTH = 16; // 16 bytes authentication tag for GCM
const PBKDF2_ITERATIONS = 100000; // High iteration count for key derivation
const PBKDF2_DIGEST = 'sha512';

// Interface for encrypted data
export interface EncryptedData {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag (for GCM mode)
  ephemeralPublicKey?: string; // For forward secrecy (when using hybrid encryption)
}

/**
 * Generate a cryptographically secure random encryption key
 *
 * @param length Length of the key in bytes (default: 32 for AES-256)
 * @returns Random encryption key as Buffer
 */
export function generateEncryptionKey(length: number = KEY_LENGTH): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Generate a random initialization vector
 *
 * @returns Random IV as Buffer
 */
export function generateIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH);
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param data Data to encrypt (string)
 * @param key Encryption key (Buffer or string)
 * @param associatedData Optional authenticated associated data
 * @returns Object containing encrypted data, IV, and authentication tag
 */
export function aesEncrypt(
  data: string,
  key: string | Buffer,
  associatedData?: Buffer
): EncryptedData {
  try {
    // Convert string key to Buffer if needed
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;

    // Check key length
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes, got ${keyBuffer.length}`);
    }

    // Generate a random IV
    const iv = generateIV();

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    // If there's authenticated data, set it
    if (associatedData) {
      cipher.setAAD(associatedData);
    }

    // Encrypt data
    let encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encryptedData,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encryptedData Object containing encrypted data, IV, and auth tag
 * @param key Decryption key (Buffer or string)
 * @param associatedData Optional authenticated associated data
 * @returns Decrypted data as string
 */
export function aesDecrypt(
  encryptedData: EncryptedData,
  key: string | Buffer,
  associatedData?: Buffer
): string {
  try {
    // Convert string key to Buffer if needed
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;

    // Check key length
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes, got ${keyBuffer.length}`);
    }

    // Convert IV and auth tag from hex to Buffer
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);

    // Set authentication tag
    decipher.setAuthTag(authTag);

    // If there's authenticated data, set it
    if (associatedData) {
      decipher.setAAD(associatedData);
    }

    // Decrypt data
    let decrypted = decipher.update(encryptedData.encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Handle decryption errors
    if (error.message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error('Failed to authenticate encrypted data. It may have been tampered with.');
    } else {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

/**
 * Derive an encryption key from a password or passphrase
 *
 * @param password Password or passphrase
 * @param salt Salt for key derivation (generates random salt if not provided)
 * @returns Object containing derived key and salt
 */
export function deriveKeyFromPassword(
  password: string,
  salt?: Buffer
): { key: Buffer; salt: Buffer } {
  // Generate random salt if not provided
  const saltBuffer = salt || crypto.randomBytes(16);

  // Derive key using PBKDF2
  const key = crypto.pbkdf2Sync(
    password,
    saltBuffer,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );

  return { key, salt: saltBuffer };
}

// ====== Forward Secrecy Implementation ======

/**
 * Generate an RSA key pair for asymmetric encryption
 *
 * @returns Object containing private and public keys in PEM format
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

/**
 * Generate an ECDH key pair for key exchange (better for forward secrecy)
 *
 * @returns Object containing private and public keys
 */
export function generateECDHKeyPair(): { publicKey: string; privateKey: string } {
  const ecdh = crypto.createECDH('prime256v1'); // P-256 curve
  ecdh.generateKeys();

  return {
    privateKey: ecdh.getPrivateKey('hex'),
    publicKey: ecdh.getPublicKey('hex')
  };
}

/**
 * Compute a shared secret using ECDH
 *
 * @param privateKey Your private key (hex string)
 * @param otherPublicKey Other party's public key (hex string)
 * @returns Shared secret as a hex string
 */
export function computeSharedSecret(
  privateKey: string,
  otherPublicKey: string
): string {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'));

  const publicKeyBuffer = Buffer.from(otherPublicKey, 'hex');
  const sharedSecret = ecdh.computeSecret(publicKeyBuffer);

  return sharedSecret.toString('hex');
}

/**
 * Encrypt a message with forward secrecy using a hybrid approach:
 * 1. Generate ephemeral ECDH key pair
 * 2. Compute shared secret with recipient's public key
 * 3. Derive AES key from shared secret
 * 4. Encrypt message with AES-GCM
 * 5. Include ephemeral public key with the ciphertext
 *
 * @param message Message to encrypt
 * @param recipientPublicKey Recipient's public key (hex string)
 * @returns Encrypted data with ephemeral public key
 */
export function encryptWithForwardSecrecy(
  message: string,
  recipientPublicKey: string
): EncryptedData {
  // Generate ephemeral key pair (used only once)
  const ephemeral = generateECDHKeyPair();

  // Compute shared secret
  const sharedSecret = computeSharedSecret(
    ephemeral.privateKey,
    recipientPublicKey
  );

  // Derive encryption key from shared secret
  const { key } = deriveKeyFromPassword(sharedSecret);

  // Encrypt the message
  const encrypted = aesEncrypt(message, key);

  // Add ephemeral public key to the result
  return {
    ...encrypted,
    ephemeralPublicKey: ephemeral.publicKey
  };
}

/**
 * Decrypt a message that was encrypted with forward secrecy
 *
 * @param encryptedData Encrypted data with ephemeral public key
 * @param privateKey Your private key (hex string)
 * @returns Decrypted message
 */
export function decryptWithForwardSecrecy(
  encryptedData: EncryptedData,
  privateKey: string
): string {
  if (!encryptedData.ephemeralPublicKey) {
    throw new Error('Missing ephemeral public key');
  }

  // Compute shared secret
  const sharedSecret = computeSharedSecret(
    privateKey,
    encryptedData.ephemeralPublicKey
  );

  // Derive encryption key from shared secret
  const { key } = deriveKeyFromPassword(sharedSecret);

  // Decrypt the message
  return aesDecrypt(encryptedData, key);
}

// ====== Key Rotation & Management ======

export interface RotationPolicy {
  maxAge: number; // Maximum key age in milliseconds
  algorithm: string; // Algorithm name
  keySize: number; // Key size in bytes
}

// Default key rotation policy (90 days)
export const DEFAULT_ROTATION_POLICY: RotationPolicy = {
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  algorithm: ALGORITHM,
  keySize: KEY_LENGTH
};

/**
 * Check if a key needs rotation based on creation date and policy
 *
 * @param creationTimestamp When the key was created (milliseconds)
 * @param policy Key rotation policy
 * @returns True if key rotation is needed
 */
export function isKeyRotationNeeded(
  creationTimestamp: number,
  policy: RotationPolicy = DEFAULT_ROTATION_POLICY
): boolean {
  const now = Date.now();
  const keyAge = now - creationTimestamp;

  return keyAge >= policy.maxAge;
}

/**
 * Generate a new key for rotation
 *
 * @param policy Key rotation policy
 * @returns Newly generated key
 */
export function generateRotationKey(
  policy: RotationPolicy = DEFAULT_ROTATION_POLICY
): Buffer {
  return generateEncryptionKey(policy.keySize);
}

/**
 * Generate a cryptographically secure nonce
 * @returns Random nonce as hex string
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}
