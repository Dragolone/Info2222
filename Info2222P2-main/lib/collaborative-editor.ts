import { create } from 'zustand';

// Types for our operational transformation system
export type TextOperation = {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  chars?: string;
  count?: number;
};

export type DocumentChange = {
  operations: TextOperation[];
  userId: string;
  username: string;
  timestamp: number;
  docId: string;
  version: number;
};

export type CursorPosition = {
  userId: string;
  username: string;
  position: number;
  color: string;
};

export type DocumentState = {
  content: string;
  version: number;
  cursors: Map<string, CursorPosition>;
  users: Map<string, { color: string; username: string; lastActive: number }>;
};

// Mock WebSocket for demo purposes (in a real app, we'd connect to a real WebSocket server)
class MockWebSocket {
  private callbacks: Record<string, Function[]> = {};
  private static instance: MockWebSocket | null = null;
  private connected = false;
  private documentState: DocumentState = {
    content: '',
    version: 0,
    cursors: new Map(),
    users: new Map(),
  };
  private pendingChanges: DocumentChange[] = [];

  // Singleton pattern to ensure all clients use the same mock socket
  public static getInstance(): MockWebSocket {
    if (!MockWebSocket.instance) {
      MockWebSocket.instance = new MockWebSocket();
    }
    return MockWebSocket.instance;
  }

  constructor() {
    // Load initial document content - simulating what would come from a server
    this.documentState.content = `# Project Proposal: TeamSync Platform

## Executive Summary

TeamSync is a comprehensive collaboration platform designed to enhance team productivity
and streamline communication. Our solution integrates task management, file sharing,
real-time chat, video conferencing, and a shared calendar into a seamless experience.

## Objectives

- Create a unified workspace that eliminates the need for multiple tools
- Improve team coordination and reduce communication gaps
- Provide robust security and data protection features
- Deliver an intuitive, user-friendly interface that requires minimal training
- Enable seamless integration with existing business systems

## Target Audience

The TeamSync platform is designed for small to medium-sized businesses, remote teams,
and project-based organizations that require effective collaboration tools.`;
  }

  // Simulate connection
  connect() {
    this.connected = true;
    setTimeout(() => {
      this.emit('open', {});
    }, 100);
    return this;
  }

  // Register event listeners
  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
  }

  // Trigger events
  emit(event: string, data: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
    return this;
  }

  // Send data
  send(data: any) {
    const parsedData = JSON.parse(data);

    if (parsedData.type === 'change') {
      // Handle document change
      const change = parsedData.change as DocumentChange;
      this.applyChange(change);

      // Broadcast to all other clients
      setTimeout(() => {
        this.emit('message', {
          data: JSON.stringify({
            type: 'change',
            change
          })
        });
      }, 10);
    } else if (parsedData.type === 'cursor') {
      // Handle cursor update
      const cursor = parsedData.cursor as CursorPosition;
      this.documentState.cursors.set(cursor.userId, cursor);

      // Broadcast to all other clients
      setTimeout(() => {
        this.emit('message', {
          data: JSON.stringify({
            type: 'cursor',
            cursor
          })
        });
      }, 10);
    } else if (parsedData.type === 'join') {
      // Handle user joining
      const { userId, username, color } = parsedData;
      this.documentState.users.set(userId, {
        username,
        color,
        lastActive: Date.now()
      });

      // Send current state to the joining user
      setTimeout(() => {
        this.emit('message', {
          data: JSON.stringify({
            type: 'document',
            document: {
              content: this.documentState.content,
              version: this.documentState.version,
              users: Array.from(this.documentState.users.entries()),
              cursors: Array.from(this.documentState.cursors.entries())
            }
          })
        });
      }, 10);

      // Broadcast new user to all clients
      setTimeout(() => {
        this.emit('message', {
          data: JSON.stringify({
            type: 'user',
            action: 'join',
            user: { userId, username, color }
          })
        });
      }, 20);
    }
  }

  // Apply a change to the document
  private applyChange(change: DocumentChange) {
    let newContent = '';
    let currentPosition = 0;
    const currentContent = this.documentState.content;

    // Process each operation
    for (const op of change.operations) {
      if (op.type === 'retain') {
        const count = op.count || 0;
        newContent += currentContent.slice(currentPosition, currentPosition + count);
        currentPosition += count;
      } else if (op.type === 'insert' && op.chars) {
        newContent += op.chars;
      } else if (op.type === 'delete') {
        const count = op.count || 0;
        currentPosition += count;
      }
    }

    // Add any remaining content
    if (currentPosition < currentContent.length) {
      newContent += currentContent.slice(currentPosition);
    }

    this.documentState.content = newContent;
    this.documentState.version++;
  }

  // Clean up
  close() {
    this.connected = false;
    this.callbacks = {};
  }

  // Check connection status
  isConnected() {
    return this.connected;
  }
}

// Operational Transformation functions
export const transformOperations = (clientOp: TextOperation[], serverOp: TextOperation[]): TextOperation[] => {
  // This is a simplified OT implementation
  // A real implementation would handle more complex cases
  // See algorithms like Jupiter or Google Wave OT for production use

  // For this demo, we'll just return the client operation
  // In a real implementation, this would transform client operations against server operations
  return clientOp;
};

// Create operations for inserting text
export const createInsertOperation = (position: number, text: string): TextOperation[] => {
  return [
    { type: 'retain', position: 0, count: position },
    { type: 'insert', position, chars: text },
  ];
};

// Create operations for deleting text
export const createDeleteOperation = (position: number, length: number): TextOperation[] => {
  return [
    { type: 'retain', position: 0, count: position },
    { type: 'delete', position, count: length },
  ];
};

// State management with Zustand
interface CollaborativeEditorState {
  connected: boolean;
  documentId: string | null;
  content: string;
  version: number;
  userId: string;
  username: string;
  userColor: string;
  cursors: Map<string, CursorPosition>;
  users: Map<string, { color: string; username: string; lastActive: number }>;
  pendingOperations: TextOperation[][];
  socket: MockWebSocket | null;

  // Actions
  connect: (docId: string) => void;
  disconnect: () => void;
  setContent: (content: string) => void;
  setCursor: (position: number) => void;
  applyOperation: (operations: TextOperation[]) => void;
  insertText: (position: number, text: string) => void;
  deleteText: (position: number, length: number) => void;
}

export const useCollaborativeEditor = create<CollaborativeEditorState>((set, get) => ({
  connected: false,
  documentId: null,
  content: '',
  version: 0,
  userId: `user_${Math.floor(Math.random() * 10000)}`,
  username: 'Anonymous User',
  userColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  cursors: new Map(),
  users: new Map(),
  pendingOperations: [],
  socket: null,

  connect: (docId: string) => {
    const socket = MockWebSocket.getInstance().connect();

    socket.on('open', () => {
      // Send join message
      socket.send(JSON.stringify({
        type: 'join',
        userId: get().userId,
        username: get().username,
        color: get().userColor,
      }));

      set({
        connected: true,
        documentId: docId,
        socket
      });
    });

    socket.on('message', (event: any) => {
      const data = JSON.parse(event.data);

      if (data.type === 'document') {
        // Initial document state
        const { content, version, users, cursors } = data.document;
        set({
          content,
          version,
          users: new Map(users),
          cursors: new Map(cursors)
        });
      } else if (data.type === 'change') {
        // Document changes
        const change = data.change as DocumentChange;

        // Skip if this is our own change
        if (change.userId === get().userId) return;

        // Apply the change
        let newContent = '';
        let currentPosition = 0;
        const currentContent = get().content;

        for (const op of change.operations) {
          if (op.type === 'retain') {
            const count = op.count || 0;
            newContent += currentContent.slice(currentPosition, currentPosition + count);
            currentPosition += count;
          } else if (op.type === 'insert' && op.chars) {
            newContent += op.chars;
          } else if (op.type === 'delete') {
            const count = op.count || 0;
            currentPosition += count;
          }
        }

        // Add any remaining content
        if (currentPosition < currentContent.length) {
          newContent += currentContent.slice(currentPosition);
        }

        set({
          content: newContent,
          version: change.version
        });
      } else if (data.type === 'cursor') {
        // Cursor updates
        const cursor = data.cursor as CursorPosition;

        // Skip if this is our own cursor
        if (cursor.userId === get().userId) return;

        // Update cursor position
        const cursors = new Map(get().cursors);
        cursors.set(cursor.userId, cursor);
        set({ cursors });
      } else if (data.type === 'user') {
        // User joined or left
        const { action, user } = data;
        const users = new Map(get().users);

        if (action === 'join') {
          users.set(user.userId, {
            username: user.username,
            color: user.color,
            lastActive: Date.now()
          });
        } else if (action === 'leave') {
          users.delete(user.userId);

          // Also remove cursor
          const cursors = new Map(get().cursors);
          cursors.delete(user.userId);
          set({ cursors });
        }

        set({ users });
      }
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({
      connected: false,
      documentId: null,
      socket: null,
      content: '',
      cursors: new Map(),
      users: new Map(),
      pendingOperations: []
    });
  },

  setContent: (content: string) => {
    set({ content });
  },

  setCursor: (position: number) => {
    const { userId, username, userColor, socket, connected } = get();
    if (!connected || !socket) return;

    const cursor: CursorPosition = {
      userId,
      username,
      position,
      color: userColor
    };

    // Send cursor update
    socket.send(JSON.stringify({
      type: 'cursor',
      cursor
    }));

    // Update local state
    const cursors = new Map(get().cursors);
    cursors.set(userId, cursor);
    set({ cursors });
  },

  applyOperation: (operations: TextOperation[]) => {
    const { socket, connected, documentId, userId, username, version } = get();
    if (!connected || !socket || !documentId) return;

    // Package the operations into a change
    const change: DocumentChange = {
      operations,
      userId,
      username,
      timestamp: Date.now(),
      docId: documentId,
      version: version + 1
    };

    // Send the change
    socket.send(JSON.stringify({
      type: 'change',
      change
    }));

    // Apply the change locally
    let newContent = '';
    let currentPosition = 0;
    const currentContent = get().content;

    for (const op of operations) {
      if (op.type === 'retain') {
        const count = op.count || 0;
        newContent += currentContent.slice(currentPosition, currentPosition + count);
        currentPosition += count;
      } else if (op.type === 'insert' && op.chars) {
        newContent += op.chars;
      } else if (op.type === 'delete') {
        const count = op.count || 0;
        currentPosition += count;
      }
    }

    // Add any remaining content
    if (currentPosition < currentContent.length) {
      newContent += currentContent.slice(currentPosition);
    }

    set({
      content: newContent,
      version: version + 1
    });
  },

  insertText: (position: number, text: string) => {
    const operations = createInsertOperation(position, text);
    get().applyOperation(operations);
  },

  deleteText: (position: number, length: number) => {
    const operations = createDeleteOperation(position, length);
    get().applyOperation(operations);
  }
}));
