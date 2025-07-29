"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Search,
  PlusCircle,
  MessageSquare,
  LayoutList,
  ChevronDown,
  MessageCircle,
  ArrowUpRight,
  Clock,
  ThumbsUp,
  MessageSquareQuote,
  CheckCircle2,
  User,
  Users,
  Filter,
  SortAsc,
  Send,
  Bold,
  Italic,
  X
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import {
  generateLongTermKeys,
  deriveSessionKey,
  encryptMessage,
  decryptMessage
} from '@/lib/encryption/e2ee'

interface DiscussionThread {
  id: string
  title: string
  preview: string
  author: {
    name: string
    avatar?: string
    isAnonymous: boolean
    userId?: string
  }
  date: Date
  replyCount: number
  isUnread: boolean
  hasRecentActivity: boolean
  category?: string
  tags?: string[]
  isSolved?: boolean
  viewCount?: number
  lastActivityDate?: Date
}

interface DiscussionPost {
  id: string
  author: {
    name: string
    avatar?: string
    isAnonymous: boolean
    userId?: string
  }
  content: string
  date: Date
  likes: number
  isLikedByUser: boolean
  isSolution: boolean
  replies: DiscussionPost[]
  parentId?: string
  edited?: boolean
  lastEditDate?: Date
}

interface ChatWithDiscussionProps {
  activeThreadId?: string;
}

// 在模块顶部，初始化 socket
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://localhost:3001'
const socket: Socket = io(SOCKET_URL, { secure: true })

export function ChatWithDiscussion({ activeThreadId }: ChatWithDiscussionProps) {
  // Current user mock data
  const currentUser = {
    id: "user1",
    name: "Current User",
    avatar: undefined
  };

  const [activeTab, setActiveTab] = useState("discussions")
  const [sortOrder, setSortOrder] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false)
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("")
  const [newDiscussionContent, setNewDiscussionContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [activeDiscussion, setActiveDiscussion] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [replyContent, setReplyContent] = useState("")
  const [isReplyAnonymous, setIsReplyAnonymous] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isRichTextEditorOpen, setIsRichTextEditorOpen] = useState(false)
  const [selectedTextFormat, setSelectedTextFormat] = useState<string[]>([])
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null)
  const [messages, setMessages] = useState<Array<{ fromId: string, text: string }>>([])
  const [theirPublicJwk, setTheirPublicJwk] = useState<JsonWebKey | null>(null)

  // Rich text editor state
  const [editorContent, setEditorContent] = useState("")
  const [cursorPosition, setCursorPosition] = useState<{start: number, end: number}>({start: 0, end: 0})

  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Listen for openNewDiscussion event from parent component
  useEffect(() => {
    const handleOpenNewDiscussion = () => {
      setIsNewDiscussionOpen(true);
    };

    window.addEventListener('openNewDiscussion', handleOpenNewDiscussion);

    return () => {
      window.removeEventListener('openNewDiscussion', handleOpenNewDiscussion);
    };
  }, []);

  // Listen for loadDiscussion event from parent component
  useEffect(() => {
    const handleLoadDiscussion = (event: any) => {
      const threadId = event.detail?.threadId;
      if (threadId) {
        handleOpenDiscussion(threadId);
      }
    };

    window.addEventListener('loadDiscussion', handleLoadDiscussion);

    return () => {
      window.removeEventListener('loadDiscussion', handleLoadDiscussion);
    };
  }, []);

  // Watch for activeThreadId prop changes
  useEffect(() => {
    if (activeThreadId) {
      handleOpenDiscussion(activeThreadId);
    }
  }, [activeThreadId]);

  // Scroll to bottom of thread when a discussion is opened or when replies are added
  useEffect(() => {
    if (activeDiscussion && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [activeDiscussion]);

  // 添加 socket 连接和消息监听
  useEffect(() => {
    // 让服务器知道我的用户 ID，加入对应房间
    socket.emit('join', currentUser.id)

    socket.on('connect', () => {
      console.log('✅ Socket connected, id=', socket.id)
    })

    socket.on('message', async (payload) => {
      console.log('👂 Received payload:', payload)
      if (!privateKey) {
        console.error('No private key available for decryption')
        return
      }
      try {
        const text = await decryptMessage(payload, privateKey)
        console.log('🔓 Decrypted text:', text)
        setMessages(prev => [...prev, { fromId: payload.senderId, text }])
      } catch (e) {
        console.error('decryptMessage error', e)
      }
    })

    return () => {
      socket.off('connect')
      socket.off('message')
    }
  }, [privateKey, currentUser.id])

  // Hardcoded discussion threads
  const threadsData: Record<string, {
    thread: DiscussionThread,
    posts: DiscussionPost[]
  }> = {
    'disc1': {
      thread: {
        id: "disc1",
        title: "How to implement real-time collaboration features?",
        preview: "I'm trying to add collaborative editing to our app but facing issues with conflict resolution. Has anyone successfully implemented this before?",
        author: {
          name: "Alex Johnson",
          isAnonymous: false
        },
        date: new Date(2023, 3, 15),
        replyCount: 2,
        isUnread: false,
        hasRecentActivity: true,
        category: "Development",
        tags: ["collaboration", "real-time", "websockets"]
      },
      posts: [
        {
          id: "post1-1",
          author: {
            name: "Alex Johnson",
            isAnonymous: false,
            userId: "user2"
          },
          content: "I'm trying to add collaborative editing to our app but facing issues with conflict resolution. Has anyone successfully implemented this before? I've tried using operational transforms but it seems overly complex for our use case.",
          date: new Date(2023, 3, 15),
          likes: 5,
          isLikedByUser: false,
          isSolution: false,
          replies: []
        },
        {
          id: "post1-2",
          author: {
            name: "Taylor Swift",
            isAnonymous: false,
            userId: "user3"
          },
          content: "We implemented real-time collaboration using Y.js and it worked quite well. The CRDT approach solves many of the conflict resolution problems automatically. Happy to share more details if you're interested!",
          date: new Date(2023, 3, 16),
          likes: 12,
          isLikedByUser: true,
          isSolution: true,
          replies: []
        }
      ]
    },
    'disc2': {
      thread: {
        id: "disc2",
        title: "Best practices for micro-frontend architecture",
        preview: "Our team is considering moving to a micro-frontend approach. I'd appreciate insights from teams who have experience with this pattern.",
        author: {
          name: "Anonymous",
          isAnonymous: true
        },
        date: new Date(2023, 3, 10),
        replyCount: 3,
        isUnread: false,
        hasRecentActivity: true,
        category: "Architecture",
        tags: ["frontend", "micro-frontend", "architecture"],
        isSolved: true
      },
      posts: [
        {
          id: "post2-1",
          author: {
            name: "Anonymous",
            isAnonymous: true
          },
          content: "Our team is considering moving to a micro-frontend approach. I'd appreciate insights from teams who have experience with this pattern. What are the main benefits and challenges you've encountered?",
          date: new Date(2023, 3, 10),
          likes: 8,
          isLikedByUser: false,
          isSolution: false,
          replies: []
        },
        {
          id: "post2-2",
          author: {
            name: "Emily Chen",
            isAnonymous: false,
            userId: "user4"
          },
          content: "We've been using micro-frontends for about a year now. The biggest benefits have been team autonomy and independent deployability. However, be prepared for some challenges with shared dependencies and styling consistency. Happy to share more specific details if you need!",
          date: new Date(2023, 3, 11),
          likes: 15,
          isLikedByUser: false,
          isSolution: true,
          replies: []
        },
        {
          id: "post2-3",
          author: {
            name: "Mike Ross",
            isAnonymous: false,
            userId: "user5"
          },
          content: "To add to what Emily said, we found module federation to be the most flexible approach. Just make sure you have a solid plan for handling shared state and authentication across micro-frontends.",
          date: new Date(2023, 3, 12),
          likes: 7,
          isLikedByUser: false,
          isSolution: false,
          replies: []
        }
      ]
    },
    'disc3': {
      thread: {
        id: "disc3",
        title: "Recommendations for state management libraries in 2023",
        preview: "With so many state management options available now, which one would you recommend for a large-scale React application?",
        author: {
          name: "Sam Lee",
          isAnonymous: false
        },
        date: new Date(2023, 3, 5),
        replyCount: 4,
        isUnread: false,
        hasRecentActivity: false,
        category: "Frontend",
        tags: ["react", "state-management", "redux", "zustand"]
      },
      posts: [
        {
          id: "post3-1",
          author: {
            name: "Sam Lee",
            isAnonymous: false,
            userId: "user6"
          },
          content: "With so many state management options available now (Redux, MobX, Zustand, Jotai, Recoil, etc.), which one would you recommend for a large-scale React application? We're starting a new project and trying to make the right choice from the beginning.",
          date: new Date(2023, 3, 5),
          likes: 10,
          isLikedByUser: false,
          isSolution: false,
          replies: []
        },
        {
          id: "post3-2",
          author: {
            name: "Rachel Green",
            isAnonymous: false,
            userId: "user7"
          },
          content: "For large-scale applications, Redux Toolkit is still a solid choice. The ecosystem is mature, and RTK Query handles async data fetching really well. It has more boilerplate than newer options, but the predictability and dev tools are worth it.",
          date: new Date(2023, 3, 6),
          likes: 6,
          isLikedByUser: false,
          isSolution: false,
          replies: []
        },
        {
          id: "post3-3",
          author: {
            name: "Daniel Park",
            isAnonymous: false,
            userId: "user8"
          },
          content: "I'd recommend Zustand if you're starting fresh. It's much simpler than Redux but still scales well. The API is clean, it works with Immer, and has minimal boilerplate. We migrated from Redux to Zustand on our large app and haven't looked back.",
          date: new Date(2023, 3, 7),
          likes: 13,
          isLikedByUser: true,
          isSolution: true,
          replies: []
        },
        {
          id: "post3-4",
          author: {
            name: "Sam Lee",
            isAnonymous: false,
            userId: "user6"
          },
          content: "Thanks for all the recommendations! We're going to try Zustand for this project based on the feedback. I'll let you know how it goes!",
          date: new Date(2023, 3, 8),
          likes: 4,
          isLikedByUser: false,
          isSolution: false,
          replies: []
        }
      ]
    }
  };

  // State for discussions and active thread
  const [discussions, setDiscussions] = useState<DiscussionThread[]>([
    threadsData["disc1"].thread,
    threadsData["disc2"].thread,
    threadsData["disc3"].thread
  ]);

  const [discussionThread, setDiscussionThread] = useState<{
    thread: DiscussionThread | null,
    posts: DiscussionPost[]
  }>({
    thread: null,
    posts: []
  });

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
      }
      return `${diffInHours}h ago`;
    }

    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  // Handle opening a specific discussion thread
  const handleOpenDiscussion = (discussionId: string) => {
    // Mark the discussion as read
    setDiscussions(discussions.map(d =>
      d.id === discussionId ? { ...d, isUnread: false } : d
    ));

    const discussion = discussions.find(d => d.id === discussionId);
    if (discussion) {
      setActiveDiscussion(discussionId);

      // Load the appropriate hardcoded data
      if (threadsData[discussionId]) {
        setDiscussionThread({
          thread: threadsData[discussionId].thread,
          posts: threadsData[discussionId].posts
        });
      } else {
        // Handle custom created discussions
        setDiscussionThread({
          thread: discussion,
          posts: [{
            id: `post-${discussionId}-1`,
            author: {
              name: discussion.author.name,
              isAnonymous: discussion.author.isAnonymous,
              userId: discussion.author.isAnonymous ? undefined : currentUser.id
            },
            content: discussion.preview,
            date: discussion.date,
            likes: 0,
            isLikedByUser: false,
            isSolution: false,
            replies: []
          }]
        });
      }
    }
  };

  // Handle creating a new discussion
  const handleCreateDiscussion = () => {
    if (newDiscussionTitle.trim() === '' || newDiscussionContent.trim() === '') {
      return; // Don't create empty discussions
    }

    const newDiscussionId = `disc${discussions.length + 1}`;

    const newDiscussion: DiscussionThread = {
      id: newDiscussionId,
      title: newDiscussionTitle,
      preview: newDiscussionContent.slice(0, 120) + (newDiscussionContent.length > 120 ? '...' : ''),
      author: {
        name: isAnonymous ? "Anonymous" : currentUser.name,
        isAnonymous
      },
      date: new Date(),
      replyCount: 0,
      isUnread: false,
      hasRecentActivity: true,
      category: selectedCategory || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    };

    // Create the first post
    const newPost: DiscussionPost = {
      id: `post-${newDiscussionId}-1`,
      author: {
        name: isAnonymous ? "Anonymous" : currentUser.name,
        isAnonymous,
        userId: isAnonymous ? undefined : currentUser.id
      },
      content: newDiscussionContent,
      date: new Date(),
      likes: 0,
      isLikedByUser: false,
      isSolution: false,
      replies: []
    };

    // Update discussions list
    setDiscussions([newDiscussion, ...discussions]);

    // Set as active discussion
    setDiscussionThread({
      thread: newDiscussion,
      posts: [newPost]
    });
    setActiveDiscussion(newDiscussionId);

    // Reset form and close dialog
    setNewDiscussionTitle("");
    setNewDiscussionContent("");
    setIsAnonymous(false);
    setSelectedCategory("");
    setSelectedTags([]);
    setIsNewDiscussionOpen(false);

    // Dispatch a custom event to notify parent component of new discussion
    const event = new CustomEvent('discussionCreated', {
      detail: {
        discussion: newDiscussion,
        post: newPost
      }
    });
    window.dispatchEvent(event);
  };

  // Handle going back to discussions list
  const handleBackToDiscussions = () => {
    setActiveDiscussion(null);
    setDiscussionThread({
      thread: null,
      posts: []
    });
    setReplyContent("");
    setIsReplyAnonymous(false);
  };

  // 添加发送消息的函数
  async function sendMessage(toUserId: string, plainText: string) {
    if (!privateKey || !theirPublicJwk) {
      console.error('No private key or their public key available for encryption')
      return
    }
    try {
      // 派生会话密钥并加密
      const { sessionKey, ephPublicJwk } = await deriveSessionKey(privateKey, theirPublicJwk)
      const { iv, ciphertext } = await encryptMessage(plainText, sessionKey)

      const payload = {
        senderId: currentUser.id,
        receiverId: toUserId,
        ephPublicJwk,
        iv,
        ciphertext
      }
      console.log('🔍 Sending payload:', payload)
      socket.emit('message', payload)
    } catch (e) {
      console.error('sendMessage error', e)
    }
  }

  // 修改提交回复的函数
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !discussionThread.thread) return;

    // 获取接收者ID（这里假设是讨论的发起者）
    const receiverId = discussionThread.thread.author.userId || 'unknown'

    // 发送加密消息
    await sendMessage(receiverId, replyContent)

    const newReply: DiscussionPost = {
      id: `reply-${Date.now()}`,
      author: {
        name: isReplyAnonymous ? "Anonymous" : currentUser.name,
        isAnonymous: isReplyAnonymous,
        userId: isReplyAnonymous ? undefined : currentUser.id
      },
      content: replyContent,
      date: new Date(),
      likes: 0,
      isLikedByUser: false,
      isSolution: false,
      replies: []
    };

    // Update discussions with new reply count
    const updatedDiscussions = discussions.map(d =>
      d.id === activeDiscussion
        ? {
            ...d,
            replyCount: d.replyCount + 1,
            hasRecentActivity: true
          }
        : d
    );
    setDiscussions(updatedDiscussions);

    // Add the reply to the thread
    setDiscussionThread({
      ...discussionThread,
      posts: [...discussionThread.posts, newReply]
    });

    // Reset form
    setReplyContent("");

    // Focus on reply input
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 0);
  };

  // Handle toggling like on a post
  const handleToggleLike = (postId: string) => {
    const updatedPosts = discussionThread.posts.map(post =>
      post.id === postId
        ? {
            ...post,
            likes: post.isLikedByUser ? post.likes - 1 : post.likes + 1,
            isLikedByUser: !post.isLikedByUser
          }
        : post
    );

    setDiscussionThread({
      ...discussionThread,
      posts: updatedPosts
    });
  };

  // Handle marking a post as solution
  const handleMarkAsSolution = (postId: string) => {
    // Update the posts
    const updatedPosts = discussionThread.posts.map(post => ({
      ...post,
      isSolution: post.id === postId
    }));

    setDiscussionThread({
      ...discussionThread,
      posts: updatedPosts
    });

    // Mark the discussion as solved
    setDiscussions(discussions.map(d =>
      d.id === activeDiscussion ? { ...d, isSolved: true } : d
    ));
  };

  return (
    <div className="flex flex-col h-screen border-l">
      {!activeDiscussion ? (
        // Empty state view when no discussion is selected
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-muted/5">
          <MessageCircle className="h-16 w-16 mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-medium text-muted-foreground mb-2">Select a thread</h2>
          <p className="text-sm text-muted-foreground/70 max-w-md">
            Choose a discussion thread from the sidebar to view its content
          </p>
        </div>
      ) : (
        // Discussion thread view
        <div className="flex-1 flex flex-col h-full relative">
          <div className="border-b p-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDiscussions}
              className="gap-1"
            >
              <ArrowUpRight className="h-4 w-4 rotate-180" />
              <span>Back to Discussions</span>
            </Button>
            {discussionThread.thread?.isSolved && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Solved
              </Badge>
            )}
          </div>

          {/* Thread header always visible at the top */}
          <div className="p-5 border-b bg-muted/20">
            <h1 className="text-xl font-semibold">{discussionThread.thread?.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {discussionThread.thread?.author.isAnonymous
                    ? "AN"
                    : discussionThread.thread?.author.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {discussionThread.thread?.author.isAnonymous
                  ? "Anonymous"
                  : discussionThread.thread?.author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {discussionThread.thread?.date && formatRelativeTime(discussionThread.thread.date)}
              </span>
            </div>
          </div>

          {/* Make the content area flex-1 but with fixed height and scroll internally */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Scrollable content area with bottom padding to account for fixed reply box */}
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
              <div className="p-5 space-y-8 pb-20">
                {/* Posts with clear visual separation between original post and replies */}
                {discussionThread.posts.map((post, index) => (
                  <div
                    key={post.id}
                    className={`rounded-lg ${
                      index === 0
                        ? 'border-2 border-primary/20 bg-primary/5 shadow-sm'
                        : post.author.userId === currentUser.id
                        ? 'border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                        : 'border'
                    } p-5`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`${index === 0 ? 'h-10 w-10 ring-2 ring-primary ring-offset-2' : 'h-8 w-8'}`}>
                          <AvatarFallback className={index === 0 ? 'text-base' : 'text-sm'}>
                            {post.author.isAnonymous
                              ? "AN"
                              : post.author.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {post.author.userId === currentUser.id ? (
                              <span className="text-blue-600 dark:text-blue-400">You</span>
                            ) : (
                              post.author.isAnonymous ? "Anonymous" : post.author.name
                            )}
                            {index === 0 && (
                              <Badge variant="outline" className="ml-1 text-xs bg-primary/10 border-primary/30 text-primary font-semibold">
                                Original Poster
                              </Badge>
                            )}
                            {post.isSolution && (
                              <Badge className="ml-1 bg-green-500 text-white">Solution</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(post.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index > 0 &&
                         !discussionThread.posts.some(p => p.isSolution) &&
                         discussionThread.posts[0].author.userId === currentUser.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsSolution(post.id)}
                            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Mark as Solution
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLike(post.id)}
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp
                            className={`h-4 w-4 ${post.isLikedByUser ? 'fill-primary text-primary' : ''}`}
                          />
                          <span>{post.likes}</span>
                        </Button>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none break-words whitespace-pre-line">
                      {post.content}
                    </div>
                  </div>
                ))}

                {/* Separator between posts and replies */}
                {discussionThread.posts.length > 1 && (
                  <div className="flex items-center gap-3 py-2 px-4">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {discussionThread.posts.length - 1} {discussionThread.posts.length - 1 === 1 ? 'Reply' : 'Replies'}
                    </span>
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Reply Form - Sticky to bottom with a semi-transparent background */}
            <div className="sticky bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm p-3 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Reply to this discussion</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Post anonymously</span>
                  <Switch
                    checked={isReplyAnonymous}
                    onCheckedChange={setIsReplyAnonymous}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Textarea
                  ref={replyInputRef}
                  placeholder="Write your reply..."
                  className="min-h-[60px] max-h-[60px] resize-none"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <Button
                  className="self-end px-4"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified New Discussion Dialog */}
      <Dialog open={isNewDiscussionOpen} onOpenChange={setIsNewDiscussionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div>
              <label className="text-sm font-medium block mb-2">Title</label>
              <Input
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value.slice(0, 100))}
                placeholder="What do you want to discuss?"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newDiscussionTitle.length}/100 characters
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Textarea
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
                placeholder="Provide more details about your question or topic..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Category</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                <option value="General">General</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Architecture">Architecture</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
              </select>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous-mode"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <label htmlFor="anonymous-mode" className="text-sm font-medium">
                  Post anonymously
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsNewDiscussionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDiscussion}
              disabled={!newDiscussionTitle.trim() || !newDiscussionContent.trim()}
            >
              Create Discussion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
