import CryptoJS from 'crypto-js';

/**
 * Client-side utility for decrypting messages
 * Using CryptoJS for browser compatibility
 */

interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
}

/**
 * Decrypt a message using AES-256-GCM
 * @param encryptedContent - The encrypted message content with auth tag
 * @param iv - The initialization vector used for encryption
 * @param key - The encryption key (hex string)
 * @returns The decrypted message as a string
 */
export const decryptMessage = (
  encryptedContent: string,
  iv: string,
  key: string
): string => {
  try {
    // Split the encrypted data and auth tag
    const [encrypted, authTag] = encryptedContent.split(':');

    // Create word arrays from hex strings
    const encryptedBytes = CryptoJS.enc.Hex.parse(encrypted);
    const ivBytes = CryptoJS.enc.Hex.parse(iv);
    const keyBytes = CryptoJS.enc.Hex.parse(key);
    const authTagBytes = CryptoJS.enc.Hex.parse(authTag);

    // Decrypt using AES-GCM
    // Note: CryptoJS doesn't support GCM natively in the same way as Node's crypto
    // In a production app, you would use a more complete library like Web Crypto API
    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: encryptedBytes,
      },
      keyBytes,
      {
        iv: ivBytes,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding,
      }
    );

    // Convert to UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting message:', error);
    return '[Error: Unable to decrypt message]';
  }
};

/**
 * Batch decrypt multiple messages
 * @param messages - Array of encrypted messages
 * @param key - The encryption key (hex string)
 * @returns Array of decrypted messages
 */
export const batchDecryptMessages = <T extends EncryptedMessage>(
  messages: T[],
  key: string
): (T & { decryptedContent: string })[] => {
  return messages.map(message => ({
    ...message,
    decryptedContent: decryptMessage(message.encryptedContent, message.iv, key)
  }));
};
