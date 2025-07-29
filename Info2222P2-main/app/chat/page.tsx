"use client"

import '@/lib/encryption/e2ee';
import { useState, useRef, useEffect } from "react"
import { ChatWithDiscussion } from '@/components/chat-with-discussion';


export default function ChatPage() {
  return <ChatWithDiscussion />;
} 