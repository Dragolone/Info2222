import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useWebSocket from './useWebSocket';
import {
  generateClientKey,
  encryptMessage,
  decryptMessage,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  generateRSAKeyPair,
  encryptKey,
  decryptKey
} from '@/lib/encryption/clientCrypto';

// Type definitions
interface GroupKey {
  groupId: string;
  key: string;
}

interface EncryptedMessage {
  id: string;
  encryptedContent: string;
  iv: string;
  senderId: string;
  senderUsername: string;
  groupId: string;
  createdAt: string;
}

interface DecryptedMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  groupId: string;
  createdAt: string;
}

// Session storage keys
const PRIVATE_KEY_STORAGE = 'e2ee_private_key';
const PUBLIC_KEY_STORAGE = 'e2ee_public_key';
const GROUP_KEYS_STORAGE = 'e2ee_group_keys';

const useE2EEMessage = () => {
  const { data: session } = useSession();
  const { socketState, onMessage, sendMessage } = useWebSocket();

  // State for keys and messages
  const [rsaKeysGenerated, setRsaKeysGenerated] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [groupKeys, setGroupKeys] = useState<GroupKey[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, DecryptedMessage>>({});
  const [pendingDecryption, setPendingDecryption] = useState<EncryptedMessage[]>([]);

  // Initialize RSA keys on mount
  useEffect(() => {
    const initializeKeys = async () => {
      try {
        // Try to load existing keys from session storage
        const storedPublicKey = sessionStorage.getItem(PUBLIC_KEY_STORAGE);
        const storedPrivateKey = sessionStorage.getItem(PRIVATE_KEY_STORAGE);
        const storedGroupKeys = sessionStorage.getItem(GROUP_KEYS_STORAGE);

        if (storedPublicKey && storedPrivateKey) {
          setPublicKey(storedPublicKey);
          setPrivateKey(storedPrivateKey);
          setRsaKeysGenerated(true);

          if (storedGroupKeys) {
            setGroupKeys(JSON.parse(storedGroupKeys));
          }
        } else {
          // Generate new RSA key pair
          const keyPair = await generateRSAKeyPair();
          const pubKey = await exportPublicKey(keyPair.publicKey);
          const privKey = await exportPrivateKey(keyPair.privateKey);

          setPublicKey(pubKey);
          setPrivateKey(privKey);
          setRsaKeysGenerated(true);

          // Store keys in session storage
          sessionStorage.setItem(PUBLIC_KEY_STORAGE, pubKey);
          sessionStorage.setItem(PRIVATE_KEY_STORAGE, privKey);
        }
      } catch (error) {
        console.error('Failed to initialize E2EE keys:', error);
      }
    };

    if (session?.user) {
      initializeKeys();
    }

    return () => {
      // Clean up function if needed
    };
  }, [session]);

  // Save group keys to session storage when they change
  useEffect(() => {
    if (groupKeys.length > 0) {
      sessionStorage.setItem(GROUP_KEYS_STORAGE, JSON.stringify(groupKeys));
    }
  }, [groupKeys]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (socketState === 'authenticated') {
      const unsubscribe = onMessage('new_message', (message: EncryptedMessage) => {
        // Add to pending decryption queue
        setPendingDecryption(prev => [...prev, message]);
      });

      return unsubscribe;
    }
  }, [socketState, onMessage]);

  // Process pending decryption queue
  useEffect(() => {
    const decryptPendingMessages = async () => {
      if (pendingDecryption.length === 0 || !privateKey) return;

      const newDecryptedMessages = { ...decryptedMessages };
      const stillPending: EncryptedMessage[] = [];

      for (const message of pendingDecryption) {
        try {
          // Find the group key
          const groupKey = groupKeys.find(gk => gk.groupId === message.groupId);

          if (groupKey) {
            // Decrypt the message
            const decryptedContent = await decryptMessage(
              message.encryptedContent,
              message.iv,
              groupKey.key
            );

            // Store the decrypted message
            newDecryptedMessages[message.id] = {
              id: message.id,
              content: decryptedContent,
              senderId: message.senderId,
              senderUsername: message.senderUsername,
              groupId: message.groupId,
              createdAt: message.createdAt
            };
          } else {
            // No key available, keep in pending
            stillPending.push(message);
          }
        } catch (error) {
          console.error(`Failed to decrypt message ${message.id}:`, error);
          stillPending.push(message);
        }
      }

      setDecryptedMessages(newDecryptedMessages);
      setPendingDecryption(stillPending);
    };

    decryptPendingMessages();
  }, [pendingDecryption, groupKeys, privateKey, decryptedMessages]);

  // Join a group and set up encryption
  const joinEncryptedGroup = useCallback(async (groupId: string) => {
    if (!publicKey || !privateKey) {
      throw new Error('RSA keys not generated yet');
    }

    try {
      // Check if we already have a key for this group
      const existingKey = groupKeys.find(gk => gk.groupId === groupId);
      if (existingKey) return true;

      // Generate a new AES key for this group
      const groupSymmetricKey = await generateClientKey();

      // Store the key
      setGroupKeys(prev => [...prev, { groupId, key: groupSymmetricKey }]);

      // In a real implementation, we would:
      // 1. Request public keys of all group members from the server
      // 2. Encrypt our symmetric key with each member's public key
      // 3. Send the encrypted keys to the server for distribution

      return true;
    } catch (error) {
      console.error('Failed to join encrypted group:', error);
      return false;
    }
  }, [publicKey, privateKey, groupKeys]);

  // Send an encrypted message
  const sendEncryptedMessage = useCallback(async (
    groupId: string,
    messageContent: string
  ): Promise<string | null> => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Find the group key
      const groupKey = groupKeys.find(gk => gk.groupId === groupId);
      if (!groupKey) {
        throw new Error('No encryption key available for this group');
      }

      // Encrypt the message client-side
      const { encryptedData, iv } = await encryptMessage(messageContent, groupKey.key);

      // Send the encrypted message to the server
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          content: encryptedData,
          iv,
          isE2EE: true, // Flag to indicate this is end-to-end encrypted
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Failed to send encrypted message:', error);
      return null;
    }
  }, [session, groupKeys]);

  // Fetch and decrypt message history
  const fetchAndDecryptMessages = useCallback(async (
    groupId: string,
    limit = 50,
    cursor?: string
  ): Promise<DecryptedMessage[]> => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Find the group key
      const groupKey = groupKeys.find(gk => gk.groupId === groupId);
      if (!groupKey) {
        throw new Error('No encryption key available for this group');
      }

      // Fetch encrypted messages from the server
      const response = await fetch(
        `/api/messages?groupId=${groupId}&limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      const messages: EncryptedMessage[] = result.messages;

      // Decrypt each message
      const decryptedResults: DecryptedMessage[] = [];

      for (const message of messages) {
        try {
          // Check if we've already decrypted this message
          if (decryptedMessages[message.id]) {
            decryptedResults.push(decryptedMessages[message.id]);
            continue;
          }

          // Decrypt the message
          const decryptedContent = await decryptMessage(
            message.encryptedContent,
            message.iv,
            groupKey.key
          );

          const decryptedMessage: DecryptedMessage = {
            id: message.id,
            content: decryptedContent,
            senderId: message.senderId,
            senderUsername: message.senderUsername,
            groupId: message.groupId,
            createdAt: message.createdAt
          };

          decryptedResults.push(decryptedMessage);

          // Update the decrypted messages cache
          setDecryptedMessages(prev => ({
            ...prev,
            [message.id]: decryptedMessage
          }));
        } catch (error) {
          console.error(`Failed to decrypt message ${message.id}:`, error);
          // Add placeholder for failed decryption
          decryptedResults.push({
            id: message.id,
            content: '[Decryption failed]',
            senderId: message.senderId,
            senderUsername: message.senderUsername,
            groupId: message.groupId,
            createdAt: message.createdAt
          });
        }
      }

      return decryptedResults;
    } catch (error) {
      console.error('Failed to fetch and decrypt messages:', error);
      return [];
    }
  }, [session, groupKeys, decryptedMessages]);

  // Share a group key with another user
  const shareGroupKey = useCallback(async (
    groupId: string,
    recipientPublicKeyPEM: string
  ): Promise<boolean> => {
    try {
      // Find the group key
      const groupKey = groupKeys.find(gk => gk.groupId === groupId);
      if (!groupKey) {
        throw new Error('No encryption key available for this group');
      }

      // Import the recipient's public key
      const recipientPublicKey = await importPublicKey(recipientPublicKeyPEM);

      // Encrypt the group key with the recipient's public key
      const encryptedGroupKey = await encryptKey(groupKey.key, recipientPublicKey);

      // In a real implementation, you would send this to the server
      // for the recipient to retrieve
      console.log('Encrypted group key ready to share:', encryptedGroupKey);

      return true;
    } catch (error) {
      console.error('Failed to share group key:', error);
      return false;
    }
  }, [groupKeys]);

  // Receive and decrypt a shared group key
  const receiveGroupKey = useCallback(async (
    groupId: string,
    encryptedGroupKey: string
  ): Promise<boolean> => {
    if (!privateKey) {
      throw new Error('Private key not available');
    }

    try {
      // Import the private key
      const privateKeyObj = await importPrivateKey(privateKey);

      // Decrypt the group key
      const decryptedGroupKey = await decryptKey(encryptedGroupKey, privateKeyObj);

      // Store the group key
      setGroupKeys(prev => [...prev, { groupId, key: decryptedGroupKey }]);

      return true;
    } catch (error) {
      console.error('Failed to receive group key:', error);
      return false;
    }
  }, [privateKey]);

  return {
    // Status
    isReady: rsaKeysGenerated,

    // Key management
    publicKey,
    joinEncryptedGroup,
    shareGroupKey,
    receiveGroupKey,

    // Messaging
    sendEncryptedMessage,
    fetchAndDecryptMessages,
    decryptedMessages,
  };
};

export default useE2EEMessage;
