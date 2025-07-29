// WebSocket utilities for real-time document collaboration
import { useEffect, useState, useRef } from 'react';

// Mock WebSocket for development - in production this would be a real WebSocket connection
export class DocumentSocket {
  private static instance: DocumentSocket | null = null;
  private callbacks: Record<string, Array<(data: any) => void>> = {};
  private documentId: string = '';
  private userId: string = '';
  private connected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;

  // Get singleton instance
  public static getInstance(): DocumentSocket {
    if (!DocumentSocket.instance) {
      DocumentSocket.instance = new DocumentSocket();
    }
    return DocumentSocket.instance;
  }

  // Connect to a document
  public connect(documentId: string, userId: string): Promise<void> {
    this.documentId = documentId;
    this.userId = userId;

    // If already connected, return resolved promise
    if (this.connected) {
      return Promise.resolve();
    }

    // Create new connection promise if needed
    if (!this.connectionPromise) {
      this.connectionPromise = new Promise<void>((resolve) => {
        this.connectionResolve = resolve;

        // Simulate connection delay
        setTimeout(() => {
          this.connected = true;
          if (this.connectionResolve) {
            this.connectionResolve();
            this.connectionResolve = null;
          }

          // Emit connection event
          this.emit('connection', {
            connected: true,
            documentId: this.documentId,
            userId: this.userId
          });
        }, 1000);
      });
    }

    return this.connectionPromise;
  }

  // Disconnect from document
  public disconnect(): void {
    if (!this.connected) return;

    this.connected = false;
    this.connectionPromise = null;
    this.emit('connection', {
      connected: false,
      documentId: this.documentId,
      userId: this.userId
    });
  }

  // Subscribe to events
  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }

    this.callbacks[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    };
  }

  // Emit event to all subscribers
  public emit(event: string, data: any): void {
    const callbacks = this.callbacks[event] || [];
    callbacks.forEach(callback => callback(data));
  }

  // Send update to all collaborators
  public sendUpdate(update: any): void {
    if (!this.connected) return;

    // Add metadata to update
    const updateWithMeta = {
      ...update,
      documentId: this.documentId,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };

    // Broadcast to other collaborators with small delay to simulate network
    setTimeout(() => {
      this.emit('document-update', updateWithMeta);
    }, 100);
  }

  // Send cursor update to all collaborators
  public sendCursorUpdate(position: number): void {
    if (!this.connected) return;

    this.sendUpdate({
      type: 'cursor',
      position
    });
  }

  // Send text update to all collaborators
  public sendTextUpdate(content: string): void {
    if (!this.connected) return;

    this.sendUpdate({
      type: 'content',
      content
    });
  }

  // Send title update to all collaborators
  public sendTitleUpdate(title: string): void {
    if (!this.connected) return;

    this.sendUpdate({
      type: 'title',
      title
    });
  }
}

// React hook for document socket
export function useDocumentSocket(documentId: string, userId: string) {
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Record<string, any>>({});
  const socket = useRef<DocumentSocket>(DocumentSocket.getInstance());

  useEffect(() => {
    // Connect to document
    socket.current.connect(documentId, userId).then(() => {
      setConnected(true);
    });

    // Set up event listeners
    const connectionUnsub = socket.current.on('connection', (data) => {
      setConnected(data.connected);
    });

    const updateUnsub = socket.current.on('document-update', (data) => {
      if (data.userId === userId) return; // Ignore own updates

      // Update collaborator info
      setCollaborators(prev => ({
        ...prev,
        [data.userId]: {
          ...(prev[data.userId] || {}),
          id: data.userId,
          lastActive: new Date().getTime()
        }
      }));

      // Handle different update types
      if (data.type === 'cursor') {
        setCollaborators(prev => ({
          ...prev,
          [data.userId]: {
            ...(prev[data.userId] || {}),
            cursor: data.position,
            lastActive: new Date().getTime()
          }
        }));
      }
    });

    // Cleanup function
    return () => {
      connectionUnsub();
      updateUnsub();
      socket.current.disconnect();
    };
  }, [documentId, userId]);

  return {
    connected,
    collaborators,
    sendCursorUpdate: (position: number) => socket.current.sendCursorUpdate(position),
    sendTextUpdate: (content: string) => socket.current.sendTextUpdate(content),
    sendTitleUpdate: (title: string) => socket.current.sendTitleUpdate(title)
  };
}
