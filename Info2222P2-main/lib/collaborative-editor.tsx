import { useState, useCallback, useEffect } from 'react';

// Update the default content to demonstrate formatting capabilities
const defaultContent = `# Project Proposal: Team Collaboration Platform

## Overview
This **project proposal** outlines our plan to develop a *collaborative platform* for team productivity.

## Goals
- Increase team efficiency by __20%__
- Reduce meeting time by ~~50%~~ 30%
- <center>Improve customer satisfaction</center>

## Timeline
1. Research phase: 2 weeks
2. Design phase: 3 weeks
3. Development phase: 8 weeks
4. Testing phase: 4 weeks

<right>**Total timeline: 17 weeks**</right>

## Budget
<left>The estimated budget for this project is $75,000 including all resources and contingency.</left>

`;

// Mock user data
const mockUsers = {
  'user1': {
    id: 'user1',
    username: 'Alice Smith',
    color: '#4285F4', // Google blue
  },
  'user2': {
    id: 'user2',
    username: 'Bob Johnson',
    color: '#EA4335', // Google red
  },
  'user3': {
    id: 'user3',
    username: 'Carol Williams',
    color: '#FBBC05', // Google yellow
  },
};

export function useCollaborativeEditor() {
  // Document content
  const [content, setContent] = useState(defaultContent);

  // Connection state
  const [connected, setConnected] = useState(false);
  const [documentId, setDocumentId] = useState('');

  // User state
  const [userId] = useState('user1'); // In a real app, this would come from auth
  const [username] = useState('Alice Smith');
  const [userColor] = useState('#4285F4');

  // Collaborative state
  const [users, setUsers] = useState(mockUsers);
  const [cursors, setKnownCursors] = useState(new Map());

  // Connect to the collaborative session
  const connect = useCallback((docId: string) => {
    setDocumentId(docId);
    setConnected(true);

    // In a real app, this would connect to a WebSocket or similar
    console.log(`Connected to document ${docId}`);

    // Simulate connection delay
    setTimeout(() => {
      setConnected(true);
    }, 500);

    // Return cleanup function
    return () => {
      setConnected(false);
      console.log(`Disconnected from document ${docId}`);
    };
  }, []);

  // Disconnect from the collaborative session
  const disconnect = useCallback(() => {
    if (connected) {
      setConnected(false);
      console.log(`Disconnected from document ${documentId}`);
    }
  }, [connected, documentId]);

  // Insert text at the given position
  const insertText = useCallback((position: number, text: string) => {
    setContent(prev => {
      const newContent = prev.substring(0, position) + text + prev.substring(position);

      // In a real app, we would send this operation to the server
      // for broadcasting to other clients
      console.log(`Insert text at position ${position}: "${text}"`);

      return newContent;
    });
  }, []);

  // Delete text starting at the given position
  const deleteText = useCallback((position: number, length: number) => {
    setContent(prev => {
      const newContent = prev.substring(0, position) + prev.substring(position + length);

      // In a real app, we would send this operation to the server
      // for broadcasting to other clients
      console.log(`Delete ${length} characters at position ${position}`);

      return newContent;
    });
  }, []);

  // Update cursor position
  const setCursor = useCallback((position: number) => {
    // In a real app, we would send this cursor update to the server
    // for broadcasting to other clients
    console.log(`Update cursor position to ${position}`);

    // For now, we just update the local cursors map
    setKnownCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.set(userId, {
        position,
        username,
        color: userColor,
      });
      return newCursors;
    });
  }, [userId, username, userColor]);

  // Return the hook API
  return {
    content,
    connected,
    users,
    cursors,
    userId,
    username,
    userColor,
    connect,
    disconnect,
    insertText,
    deleteText,
    setCursor,
  };
}
