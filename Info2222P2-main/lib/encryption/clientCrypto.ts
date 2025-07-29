/**
 * Client-side encryption utilities for end-to-end encryption
 * Uses the Web Crypto API for cryptographic operations
 */

// Convert string to Uint8Array
export const stringToBuffer = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Convert Uint8Array to string
export const bufferToString = (buffer: Uint8Array): string => {
  return new TextDecoder().decode(buffer);
};

// Convert Uint8Array to hex string
export const bufferToHex = (buffer: Uint8Array): string => {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Convert hex string to Uint8Array
export const hexToBuffer = (hex: string): Uint8Array => {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
};

// Generate a random encryption key
export const generateClientKey = async (): Promise<string> => {
  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    const exported = await window.crypto.subtle.exportKey('raw', key);
    return bufferToHex(new Uint8Array(exported));
  } catch (error) {
    console.error('Error generating client key:', error);
    throw new Error('Failed to generate client key');
  }
};

// Derive an encryption key from a password or shared secret
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  try {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      stringToBuffer(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error deriving key:', error);
    throw new Error('Failed to derive key');
  }
};

// Import a key from hex format
export const importKeyFromHex = async (hexKey: string): Promise<CryptoKey> => {
  try {
    const keyData = hexToBuffer(hexKey);

    return window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error importing key:', error);
    throw new Error('Failed to import key');
  }
};

// Encrypt a message with AES-GCM
export const encryptMessage = async (
  message: string,
  hexKey: string
): Promise<{ encryptedData: string; iv: string }> => {
  try {
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Import the key
    const key = await importKeyFromHex(hexKey);

    // Encrypt the message
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      key,
      stringToBuffer(message)
    );

    // Return the encrypted data and IV as hex strings
    return {
      encryptedData: bufferToHex(new Uint8Array(encryptedBuffer)),
      iv: bufferToHex(iv),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt a message with AES-GCM
export const decryptMessage = async (
  encryptedHex: string,
  ivHex: string,
  hexKey: string
): Promise<string> => {
  try {
    // Convert hex strings to buffers
    const encryptedData = hexToBuffer(encryptedHex);
    const iv = hexToBuffer(ivHex);

    // Import the key
    const key = await importKeyFromHex(hexKey);

    // Decrypt the message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      key,
      encryptedData
    );

    // Convert the decrypted buffer to a string
    return bufferToString(new Uint8Array(decryptedBuffer));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

// Generate RSA key pair for asymmetric encryption
export const generateRSAKeyPair = async (): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> => {
  try {
    return window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error generating RSA key pair:', error);
    throw new Error('Failed to generate RSA key pair');
  }
};

// Export public key to PEM format
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  try {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
  } catch (error) {
    console.error('Error exporting public key:', error);
    throw new Error('Failed to export public key');
  }
};

// Export private key to PEM format
export const exportPrivateKey = async (privateKey: CryptoKey): Promise<string> => {
  try {
    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
  } catch (error) {
    console.error('Error exporting private key:', error);
    throw new Error('Failed to export private key');
  }
};

// Import public key from PEM format
export const importPublicKey = async (pem: string): Promise<CryptoKey> => {
  try {
    // Remove header, footer, and newlines
    const pemContents = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\n/g, '');

    const binaryDer = atob(pemContents);
    const buffer = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      buffer[i] = binaryDer.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
      'spki',
      buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
  } catch (error) {
    console.error('Error importing public key:', error);
    throw new Error('Failed to import public key');
  }
};

// Import private key from PEM format
export const importPrivateKey = async (pem: string): Promise<CryptoKey> => {
  try {
    // Remove header, footer, and newlines
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '');

    const binaryDer = atob(pemContents);
    const buffer = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      buffer[i] = binaryDer.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
      'pkcs8',
      buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
  } catch (error) {
    console.error('Error importing private key:', error);
    throw new Error('Failed to import private key');
  }
};

// Encrypt a symmetric key with RSA for key exchange
export const encryptKey = async (
  symmetricKey: string,
  publicKey: CryptoKey
): Promise<string> => {
  try {
    const data = hexToBuffer(symmetricKey);
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );

    return bufferToHex(new Uint8Array(encryptedData));
  } catch (error) {
    console.error('Error encrypting key:', error);
    throw new Error('Failed to encrypt key');
  }
};

// Decrypt a symmetric key with RSA for key exchange
export const decryptKey = async (
  encryptedKey: string,
  privateKey: CryptoKey
): Promise<string> => {
  try {
    const data = hexToBuffer(encryptedKey);
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      data
    );

    return bufferToHex(new Uint8Array(decryptedData));
  } catch (error) {
    console.error('Error decrypting key:', error);
    throw new Error('Failed to decrypt key');
  }
};

// Verify certificate
export const verifyCertificate = (): boolean => {
  try {
    // TODO: Implement certificate verification
    return true;
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return false;
  }
};

// Secure password transmission
export const securePasswordTransmission = async (password: string): Promise<string> => {
  try {
    const constantTimeEquals = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    };

    const validatePassword = (pwd: string): boolean => {
      return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
    };

    if (!validatePassword(password)) {
      throw new Error('Password does not meet security requirements');
    }

    // TODO: Implement secure password transmission
    return password;
  } catch (error) {
    console.error('Error in secure password transmission:', error);
    throw new Error('Failed to transmit password securely');
  }
};
