import * as crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import {
  generateEncryptionKey,
  aesEncrypt,
  aesDecrypt,
  generateRsaKeyPair,
  rsaEncrypt,
  rsaDecrypt
} from './crypto';

/**
 * Key Management System
 *
 * Implements:
 * 1. Secure key storage
 * 2. Key rotation policies
 * 3. Perfect forward secrecy
 * 4. Key revocation
 */

// Configuration for key management
const KEY_CONFIG = {
  // How often to rotate keys (in milliseconds)
  rotationInterval: {
    // Rotate message encryption keys every 90 days
    MESSAGE_KEY: 90 * 24 * 60 * 60 * 1000,
    // Rotate session encryption keys every 30 days
    SESSION_KEY: 30 * 24 * 60 * 60 * 1000,
  },
  // How long to keep old keys after rotation (for decryption of old data)
  retentionPeriod: 180 * 24 * 60 * 60 * 1000, // 180 days
};

// Master key used to encrypt other keys (in production, this would be in a secure vault)
// This is a placeholder - in a real system this would be securely stored
const MASTER_KEY = process.env.AES_SECRET_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Create a new encryption key for a specific purpose
 * @param keyType Type of key (e.g., 'AES', 'RSA_PRIVATE', 'RSA_PUBLIC')
 * @param groupId Optional group ID if this is a group-specific key
 * @returns The ID of the newly created key
 */
export const createKey = async (
  keyType: string,
  groupId?: string
): Promise<string> => {
  let keyValue: string;
  let algorithm: string;

  // Generate appropriate key based on type
  if (keyType === 'AES') {
    keyValue = generateEncryptionKey();
    algorithm = 'AES-256-GCM';
  } else if (keyType === 'RSA_KEYPAIR') {
    // For RSA key pairs, we create two separate keys
    const { publicKey, privateKey } = generateRsaKeyPair();

    // Create public key entry
    const publicKeyEntry = await createKeyEntry(
      'RSA_PUBLIC',
      publicKey,
      'RSA-2048',
      groupId
    );

    // Create private key entry
    return await createKeyEntry(
      'RSA_PRIVATE',
      privateKey,
      'RSA-2048',
      groupId,
      publicKeyEntry // Link to the public key
    );
  } else {
    throw new Error(`Unsupported key type: ${keyType}`);
  }

  // Create and store the key
  return await createKeyEntry(keyType, keyValue, algorithm, groupId);
};

/**
 * Create a key entry in the database
 * @param keyType Type of key
 * @param keyValue Raw key value
 * @param algorithm Encryption algorithm
 * @param groupId Optional group ID
 * @param relatedKeyId Optional related key ID (e.g., for RSA key pairs)
 * @returns The ID of the created key
 */
const createKeyEntry = async (
  keyType: string,
  keyValue: string,
  algorithm: string,
  groupId?: string,
  relatedKeyId?: string
): Promise<string> => {
  // Encrypt the key before storing it
  const { encryptedData, iv } = aesEncrypt(keyValue, MASTER_KEY);

  // Set expiration based on rotation interval
  const now = new Date();
  const rotationMs = KEY_CONFIG.rotationInterval[keyType as keyof typeof KEY_CONFIG.rotationInterval]
    || KEY_CONFIG.rotationInterval.MESSAGE_KEY;

  const expiresAt = new Date(now.getTime() + rotationMs);

  // Store the encrypted key
  const key = await prisma.encryptionKey.create({
    data: {
      keyType,
      keyValue: encryptedData,
      iv,
      algorithm,
      expiresAt,
      isRevoked: false,
      groupId,
      relatedKeyId, // Additional field to add to the schema
    },
  });

  return key.id;
};

/**
 * Get the current active key for a specific purpose
 * @param keyType Type of key to retrieve
 * @param groupId Optional group ID for group-specific keys
 * @returns The decrypted key value and key ID
 */
export const getCurrentKey = async (
  keyType: string,
  groupId?: string
): Promise<{ keyValue: string; keyId: string }> => {
  // Find the most recent non-expired, non-revoked key
  const key = await prisma.encryptionKey.findFirst({
    where: {
      keyType,
      groupId,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!key) {
    // No valid key found, create a new one
    const newKeyId = await createKey(keyType, groupId);
    return getCurrentKey(keyType, groupId);
  }

  // Decrypt the key
  const decryptedKey = aesDecrypt(key.keyValue, key.iv, MASTER_KEY);

  return {
    keyValue: decryptedKey,
    keyId: key.id,
  };
};

/**
 * Get a specific key by ID
 * @param keyId ID of the key to retrieve
 * @returns The decrypted key value
 */
export const getKeyById = async (keyId: string): Promise<string> => {
  const key = await prisma.encryptionKey.findUnique({
    where: {
      id: keyId,
    },
  });

  if (!key) {
    throw new Error(`Key not found: ${keyId}`);
  }

  if (key.isRevoked) {
    throw new Error(`Key has been revoked: ${keyId}`);
  }

  // Decrypt the key
  return aesDecrypt(key.keyValue, key.iv, MASTER_KEY);
};

/**
 * Rotate a key
 * @param keyType Type of key to rotate
 * @param groupId Optional group ID for group-specific keys
 * @returns The ID of the new key
 */
export const rotateKey = async (
  keyType: string,
  groupId?: string
): Promise<string> => {
  // Create a new key
  const newKeyId = await createKey(keyType, groupId);

  // Mark old keys as expired (but keep them for decryption of old data)
  await prisma.encryptionKey.updateMany({
    where: {
      keyType,
      groupId,
      id: {
        not: newKeyId,
      },
      isRevoked: false,
    },
    data: {
      expiresAt: new Date(),
    },
  });

  return newKeyId;
};

/**
 * Revoke a key (for security incidents)
 * @param keyId ID of the key to revoke
 */
export const revokeKey = async (keyId: string): Promise<void> => {
  await prisma.encryptionKey.update({
    where: {
      id: keyId,
    },
    data: {
      isRevoked: true,
    },
  });
};

/**
 * Clean up old keys that are past retention period
 */
export const cleanupOldKeys = async (): Promise<void> => {
  const cutoffDate = new Date(Date.now() - KEY_CONFIG.retentionPeriod);

  await prisma.encryptionKey.deleteMany({
    where: {
      expiresAt: {
        lt: cutoffDate,
      },
    },
  });
};

/**
 * Implement Perfect Forward Secrecy for messaging
 * Uses ephemeral key exchange with Diffie-Hellman
 */
export const generateEphemeralKeyPair = (): {
  privateKey: string;
  publicKey: string;
} => {
  // Create ephemeral Diffie-Hellman parameters
  const dhGroup = crypto.createDiffieHellman(2048);
  dhGroup.generateKeys();

  return {
    privateKey: dhGroup.getPrivateKey('hex'),
    publicKey: dhGroup.getPublicKey('hex'),
  };
};

/**
 * Derive a shared secret using Diffie-Hellman
 * @param privateKey Our private key
 * @param otherPublicKey The other party's public key
 * @returns Shared secret key
 */
export const deriveSharedSecret = (
  privateKey: string,
  otherPublicKey: string
): string => {
  // Recreate the DH parameters using our private key
  const dhGroup = crypto.createDiffieHellman(2048);
  dhGroup.setPrivateKey(Buffer.from(privateKey, 'hex'));

  // Compute the shared secret
  const sharedSecret = dhGroup.computeSecret(
    Buffer.from(otherPublicKey, 'hex')
  );

  // Return the shared secret as a hex string
  return sharedSecret.toString('hex');
};

/**
 * Encrypt a message with perfect forward secrecy
 * @param message Message to encrypt
 * @param recipientPublicKey Recipient's public key
 * @returns Encrypted message, IV, and ephemeral public key
 */
export const encryptWithPFS = (
  message: string,
  recipientPublicKey: string
): {
  encryptedMessage: string;
  iv: string;
  ephemeralPublicKey: string;
} => {
  // Generate ephemeral key pair
  const { privateKey, publicKey } = generateEphemeralKeyPair();

  // Derive shared secret
  const sharedSecret = deriveSharedSecret(privateKey, recipientPublicKey);

  // Use the shared secret to encrypt the message
  const { encryptedData, iv } = aesEncrypt(message, sharedSecret);

  return {
    encryptedMessage: encryptedData,
    iv,
    ephemeralPublicKey: publicKey,
  };
};

/**
 * Decrypt a message with perfect forward secrecy
 * @param encryptedMessage Encrypted message
 * @param iv Initialization vector
 * @param ephemeralPublicKey Sender's ephemeral public key
 * @param privateKey Our private key
 * @returns Decrypted message
 */
export const decryptWithPFS = (
  encryptedMessage: string,
  iv: string,
  ephemeralPublicKey: string,
  privateKey: string
): string => {
  // Derive shared secret
  const sharedSecret = deriveSharedSecret(privateKey, ephemeralPublicKey);

  // Decrypt the message using the shared secret
  return aesDecrypt(encryptedMessage, iv, sharedSecret);
};
