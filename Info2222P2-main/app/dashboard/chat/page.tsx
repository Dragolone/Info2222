"use client"

import '@/lib/encryption/e2ee';
import { useState, useRef, useEffect } from "react"
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Users, UserPlus, Search, Send, File, Image, Plus, AtSign, MessageCircle, Hash, Bell, CheckCircle2, PlusCircle } from "lucide-react"
import { ChatWithDiscussion } from "@/components/chat-with-discussion"

// Define types for the chat application
interface Message {
  sender: {
    name: string;
    initials: string;
  };
  content: string;
  timestamp: string;
  files?: Array<{
    name: string;
    size: string;
  }>;
}

interface Channel {
  id: string;
  name: string;
  unread: number;
  description: string;
}

interface DirectMessage {
  id: string;
  name: string;
  status: string;
  initials: string;
}

// Add discussion threads type
interface DiscussionThread {
  id: string;
  title: string;
  preview: string;
  author: {
    name: string;
    avatar?: string;
    isAnonymous: boolean;
  };
  date: Date;
  replyCount: number;
  isUnread: boolean;
  hasRecentActivity: boolean;
  category?: string;
  tags?: string[];
  isSolved?: boolean;
}

type ChatType = "channel" | "direct" | "discussions";
interface ActiveChat {
  type: ChatType;
  id: string;
}

// Use Record to allow string indexing
type MessagesRecord = Record<string, Message[]>;

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ActiveChat>({ type: "channel", id: "general" })
  const [newChannelDialog, setNewChannelDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDesc, setNewChannelDesc] = useState("")
  const [newTeammateDialog, setNewTeammateDialog] = useState(false)
  const [newTeammateName, setNewTeammateName] = useState("")
  const [newTeammateEmail, setNewTeammateEmail] = useState("")
  const [showDiscussionBoard, setShowDiscussionBoard] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const [activeView, setActiveView] = useState<ChatType>("channel")
  const [searchQuery, setSearchQuery] = useState("")

  // Discussion threads state
  const [discussionThreads, setDiscussionThreads] = useState<DiscussionThread[]>([
    {
      id: "disc1",
      title: "How to implement real-time collaboration features?",
      preview: "I'm trying to add collaborative editing to our app but facing issues with conflict resolution. Has anyone successfully implemented this before?",
      author: {
        name: "Alex Johnson",
        isAnonymous: false
      },
      date: new Date(2023, 3, 15),
      replyCount: 8,
      isUnread: true,
      hasRecentActivity: true,
      category: "Development",
      tags: ["collaboration", "real-time", "websockets"]
    },
    {
      id: "disc2",
      title: "Best practices for micro-frontend architecture",
      preview: "Our team is considering moving to a micro-frontend approach. I'd appreciate insights from teams who have experience with this pattern.",
      author: {
        name: "Anonymous",
        isAnonymous: true
      },
      date: new Date(2023, 3, 10),
      replyCount: 12,
      isUnread: false,
      hasRecentActivity: true,
      category: "Architecture",
      tags: ["frontend", "micro-frontend", "architecture"],
      isSolved: true
    }
  ])

  // Handler for new discussion creation from the discussion board
  useEffect(() => {
    const handleDiscussionCreated = (event: any) => {
      const { discussion, post } = event.detail;
      if (discussion) {
        setDiscussionThreads(prevThreads => [discussion, ...prevThreads]);
      }
    };

    window.addEventListener('discussionCreated', handleDiscussionCreated);

    return () => {
      window.removeEventListener('discussionCreated', handleDiscussionCreated);
    };
  }, []);

  const [channels, setChannels] = useState<Channel[]>([
    { id: "general", name: "General", unread: 0, description: "Team-wide announcements and discussions" },
    { id: "development", name: "Development", unread: 3, description: "Technical discussions and code sharing" },
    { id: "design", name: "Design", unread: 0, description: "UI/UX design discussions and feedback" },
    { id: "questions", name: "Questions", unread: 5, description: "Ask questions and get help from teammates" },
  ])

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([
    { id: "jd", name: "Jane Doe", status: "online", initials: "JD" },
    { id: "ms", name: "Mike Smith", status: "offline", initials: "MS" },
    { id: "al", name: "Alex Lee", status: "online", initials: "AL" },
    { id: "sj", name: "Sarah Johnson", status: "away", initials: "SJ" },
  ])

  const [messages, setMessages] = useState<MessagesRecord>({
    general: [
      {
        sender: { name: "Jane Doe", initials: "JD" },
        content: "Good morning everyone! Don't forget we have our weekly sync at 2pm today.",
        timestamp: "9:15 AM",
      },
      {
        sender: { name: "Mike Smith", initials: "MS" },
        content: "Thanks for the reminder. I've prepared the progress report for the meeting.",
        timestamp: "9:20 AM",
      },
      {
        sender: { name: "You", initials: "YO" },
        content: "Great, I'm looking forward to seeing the progress we've made this week.",
        timestamp: "9:22 AM",
      },
      {
        sender: { name: "Alex Lee", initials: "AL" },
        content: "I've finished the design mockups for the new features. I'll share them during the meeting.",
        timestamp: "9:30 AM",
        files: [{ name: "design-mockups.fig", size: "4.2 MB" }],
      },
      {
        sender: { name: "Sarah Johnson", initials: "SJ" },
        content: "Has anyone started working on the API documentation yet?",
        timestamp: "9:45 AM",
      },
      {
        sender: { name: "You", initials: "YO" },
        content: "I'm currently working on it. Should be done by the end of the day.",
        timestamp: "9:48 AM",
      },
    ],
    jd: [
      {
        sender: { name: "Jane Doe", initials: "JD" },
        content: "Hi! Can you review the latest design updates?",
        timestamp: "10:15 AM",
      },
      {
        sender: { name: "You", initials: "YO" },
        content: "Sure, I'll take a look right away.",
        timestamp: "10:17 AM",
      },
    ],
    ms: [],
    al: [],
    sj: [],
  })

  // Auto scroll to the latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // socket 相关
  const socketRef = useRef<any>(null);
  useEffect(() => {
    if (activeView === 'direct') {
      if (!socketRef.current) {
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://localhost:3001', { secure: true });
      }
      // 假设当前用户 id 是 'me'，实际项目应从 session 获取
      socketRef.current.emit('join', 'me');
      socketRef.current.on('message', (payload: any) => {
        if (payload.receiverId === 'me') {
          setMessages(prev => {
            const chatId = payload.senderId;
            const chatMessages = prev[chatId] || [];
            return {
              ...prev,
              [chatId]: [...chatMessages, {
                sender: { name: directMessages.find(dm => dm.id === chatId)?.name || chatId, initials: directMessages.find(dm => dm.id === chatId)?.initials || chatId.slice(0,2).toUpperCase() },
                content: payload.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]
            }
          });
        }
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [activeView]);

  // Add a new channel
  const addNewChannel = () => {
    if (!newChannelName.trim()) return;

    const channelId = newChannelName.toLowerCase().replace(/\s+/g, '-');

    // Check if channel already exists
    if (channels.some(c => c.id === channelId)) {
      alert("A channel with this name already exists");
      return;
    }

    const newChannel = {
      id: channelId,
      name: newChannelName.trim(),
      unread: 0,
      description: newChannelDesc.trim() || `Channel for ${newChannelName.trim()} discussions`
    };

    setChannels([...channels, newChannel]);
    setMessages(prev => ({
      ...prev,
      [channelId]: []
    }));

    // Reset fields and close dialog
    setNewChannelName("");
    setNewChannelDesc("");
    setNewChannelDialog(false);

    // Set the new channel as active
    setActiveChat({ type: "channel", id: channelId });
  };

  // Add a new teammate for direct messaging
  const addNewTeammate = () => {
    if (!newTeammateName.trim()) return;

    const teammateId = newTeammateName.toLowerCase().replace(/\s+/g, '');
    const initials = newTeammateName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newTeammate = {
      id: teammateId,
      name: newTeammateName.trim(),
      status: "offline",
      initials: initials
    };

    setDirectMessages([...directMessages, newTeammate]);

    // Reset fields and close dialog
    setNewTeammateName("");
    setNewTeammateEmail("");
    setNewTeammateDialog(false);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    if (activeView === 'direct') {
      // 发送 socket 消息
      const payload = {
        senderId: 'me', // 假设当前用户 id
        receiverId: activeChat.id,
        content: message.trim(),
      };
      socketRef.current?.emit('message', payload);
      setMessages(prev => {
        const chatId = activeChat.id;
        const chatMessages = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: [...chatMessages, {
            sender: { name: 'You', initials: 'YO' },
            content: message.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        }
      });
      setMessage("");
      return;
    }

    const newMsg: Message = {
      sender: { name: "You", initials: "YO" },
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => {
      const chatId = activeChat.id;
      const chatMessages = prev[chatId] || [];

      return {
        ...prev,
        [chatId]: [...chatMessages, newMsg]
      }
    })

    setMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Add a search filter function
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return {
        channels: channels,
        directMessages: directMessages,
        discussionThreads: discussionThreads
      };
    }

    return {
      channels: channels.filter(channel =>
        channel.name.toLowerCase().includes(query) ||
        channel.description.toLowerCase().includes(query)
      ),
      directMessages: directMessages.filter(dm =>
        dm.name.toLowerCase().includes(query)
      ),
      discussionThreads: discussionThreads.filter(thread =>
        thread.title.toLowerCase().includes(query) ||
        thread.preview.toLowerCase().includes(query) ||
        (thread.author.name && !thread.author.isAnonymous &&
         thread.author.name.toLowerCase().includes(query))
      )
    };
  };

  const filteredItems = getFilteredItems();

  // Get the title for the sidebar based on active view
  const getSidebarTitle = () => {
    switch (activeView) {
      case "channel":
        return "Channels";
      case "direct":
        return "Direct Messages";
      case "discussions":
        return "Discussion Board";
      default:
        return "Team Chat";
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar with user profile at the bottom */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">{getSidebarTitle()}</h2>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => {
              if (activeView === "channel") {
                setNewChannelDialog(true);
              } else if (activeView === "direct") {
                setNewTeammateDialog(true);
              } else if (activeView === "discussions") {
                setShowDiscussionBoard(true);
                const event = new CustomEvent('openNewDiscussion');
                window.dispatchEvent(event);
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search bar but no tabs */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 py-2 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {activeView === "channel" && (
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-muted-foreground pb-2">Channels</h3>
              {filteredItems.channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChat.type === "channel" && activeChat.id === channel.id ? "secondary" : "ghost"}
                  className="w-full justify-start py-3 h-auto"
                  onClick={() => {
                    setActiveChat({ type: "channel", id: channel.id });
                    setShowDiscussionBoard(false);
                  }}
                >
                  <span className="truncate"># {channel.name}</span>
                  {channel.unread > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {channel.unread}
                    </Badge>
                  )}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground py-3 h-auto"
                onClick={() => setNewChannelDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </div>
          )}

          {activeView === "direct" && (
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-muted-foreground pb-2">Direct Messages</h3>
              {filteredItems.directMessages.map((dm) => (
                <Button
                  key={dm.id}
                  variant={activeChat.type === "direct" && activeChat.id === dm.id ? "secondary" : "ghost"}
                  className="w-full justify-start py-3 h-auto"
                  onClick={() => {
                    setActiveChat({ type: "direct", id: dm.id });
                    setShowDiscussionBoard(false);
                  }}
                >
                  <div className="flex items-center w-full">
                    <Avatar className="h-7 w-7 mr-2">
                      <AvatarFallback>{dm.initials}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{dm.name}</span>
                    <div
                      className={`ml-auto h-2.5 w-2.5 rounded-full ${
                        dm.status === "online"
                          ? "bg-green-500"
                          : dm.status === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-300"
                      }`}
                    />
                  </div>
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground py-3 h-auto"
                onClick={() => setNewTeammateDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Teammate
              </Button>
            </div>
          )}

          {activeView === "discussions" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm">Discussion Threads</h3>
              </div>

              {filteredItems.discussionThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`rounded-md p-3 cursor-pointer transition-colors ${
                    activeChat.type === "discussions" && activeChat.id === thread.id
                      ? "bg-secondary"
                      : "hover:bg-secondary/50"
                  } ${thread.isUnread ? 'border-l-2 border-primary' : ''}`}
                  onClick={() => {
                    setActiveChat({ type: "discussions", id: thread.id });
                    setShowDiscussionBoard(true);
                    // Trigger custom event to load specific thread
                    const event = new CustomEvent('loadDiscussion', { detail: { threadId: thread.id } });
                    window.dispatchEvent(event);
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm line-clamp-1">{thread.title}</h4>
                    {thread.isSolved && (
                      <span className="text-green-500 flex-shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {thread.preview}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {thread.author.isAnonymous ? "AN" : thread.author.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground truncate max-w-[80px]">
                        {thread.author.isAnonymous ? "Anonymous" : thread.author.name}
                      </span>
                    </div>
                    <div className="flex items-center text-muted-foreground gap-2">
                      <span className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {thread.replyCount}
                      </span>
                      <span>{formatRelativeTime(thread.date)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredItems.discussionThreads.length === 0 && (
                <div className="text-center p-4 text-muted-foreground">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No matching discussions found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No discussions yet</p>
                      <p className="text-xs mt-1">Start a new discussion to begin collaborating with your team</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 mr-2">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">John Doe</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area with tabs moved to the top */}
      <div className="flex-1 flex flex-col">
        {/* Navigation tabs at the top */}
        <div className="border-b flex items-center p-3">
          <div className="flex rounded-lg overflow-hidden border bg-muted/50 mr-auto">
            <Button
              variant={activeView === "channel" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-9 px-4"
              onClick={() => {
                setActiveView("channel");
                setShowDiscussionBoard(false);
              }}
            >
              <Hash className="h-4 w-4 mr-2" />
              Channels
            </Button>
            <Button
              variant={activeView === "direct" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-9 px-4"
              onClick={() => {
                setActiveView("direct");
                setShowDiscussionBoard(false);
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Direct Messages
            </Button>
            <Button
              variant={activeView === "discussions" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-9 px-4 relative"
              onClick={() => {
                setActiveView("discussions");
                setShowDiscussionBoard(true);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Discussion Board
              {discussionThreads.some(d => d.isUnread) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9 ml-2">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {showDiscussionBoard ? (
          <div className="flex-1">
            <ChatWithDiscussion activeThreadId={activeChat.id} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold flex items-center text-lg">
                    {activeChat.type === "channel" ? (
                      <>
                        <span className="text-muted-foreground mr-1">#</span>
                        {channels.find(c => c.id === activeChat.id)?.name || activeChat.id}
                      </>
                    ) : (
                      <>
                        {directMessages.find(dm => dm.id === activeChat.id)?.name || "Chat"}
                      </>
                    )}
                  </h2>
                  {activeChat.type === "channel" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {channels.find(c => c.id === activeChat.id)?.description || ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                {(messages[activeChat.id] || []).map((msg, index) => (
                  <div key={index} className={`flex gap-4 ${msg.sender.name === "You" ? "justify-end" : ""}`}>
                    {msg.sender.name !== "You" && (
                      <Avatar className="h-10 w-10 mt-0.5">
                        <AvatarFallback>{msg.sender.initials}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex-1 max-w-[80%] ${msg.sender.name === "You" ? "ml-auto" : ""}`}>
                      <div className={`flex items-baseline gap-2 ${msg.sender.name === "You" ? "justify-end" : ""}`}>
                        {msg.sender.name !== "You" && <span className="font-medium">{msg.sender.name}</span>}
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                        {msg.sender.name === "You" && <span className="font-medium text-blue-600 dark:text-blue-400">You</span>}
                      </div>
                      <div className={`mt-1.5 ${
                        msg.sender.name === "You"
                          ? "bg-blue-500 text-white dark:bg-blue-600 rounded-2xl rounded-tr-sm py-2.5 px-4"
                          : "bg-muted rounded-2xl rounded-tl-sm py-2.5 px-4"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>

                      {msg.files && msg.files.length > 0 && (
                        <div className={`mt-3 space-y-2 ${msg.sender.name === "You" ? "flex flex-col items-end" : ""}`}>
                          {msg.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className={`flex items-center gap-2 p-2.5 rounded-md max-w-sm ${
                                msg.sender.name === "You"
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-secondary"
                              }`}
                            >
                              <File className={`h-4 w-4 ${msg.sender.name === "You" ? "text-blue-500" : "text-primary"}`} />
                              <div className="flex-1 truncate text-sm">{file.name}</div>
                              <div className="text-xs text-muted-foreground">{file.size}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.sender.name === "You" && (
                      <Avatar className="h-10 w-10 mt-0.5">
                        <AvatarFallback className="bg-blue-500 text-white">{msg.sender.initials}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Message ${activeChat.type === "channel" ? "#" + (channels.find(c => c.id === activeChat.id)?.name || activeChat.id) : directMessages.find(dm => dm.id === activeChat.id)?.name || ""}`}
                    className="pr-20 min-h-[50px] py-3 pl-4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        try { await sendMessage(); } catch (e) { console.error(e); }
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Button size="icon" className="h-[50px] w-[50px]" onClick={async () => { try { await sendMessage(); } catch (e) { console.error(e); } }}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Channel Dialog */}
      <Dialog open={newChannelDialog} onOpenChange={setNewChannelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a New Channel</DialogTitle>
            <DialogDescription>
              Add a new channel for your team to collaborate in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel-name" className="text-right">
                Name
              </Label>
              <Input
                id="channel-name"
                placeholder="e.g. marketing"
                className="col-span-3"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="channel-description"
                placeholder="What is this channel about?"
                className="col-span-3"
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChannelDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNewChannel}>Create Channel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Teammate Dialog */}
      <Dialog open={newTeammateDialog} onOpenChange={setNewTeammateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add a New Teammate</DialogTitle>
            <DialogDescription>
              Invite a team member to join the conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teammate-name" className="text-right">
                Name
              </Label>
              <Input
                id="teammate-name"
                placeholder="Full name"
                className="col-span-3"
                value={newTeammateName}
                onChange={(e) => setNewTeammateName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teammate-email" className="text-right">
                Email
              </Label>
              <Input
                id="teammate-email"
                type="email"
                placeholder="Email address"
                className="col-span-3"
                value={newTeammateEmail}
                onChange={(e) => setNewTeammateEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTeammateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNewTeammate}>Invite Teammate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add a helper function to format relative time
function formatRelativeTime(date: Date) {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`
    }
    return `${diffInHours}h ago`
  }

  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return date.toLocaleDateString()
}

