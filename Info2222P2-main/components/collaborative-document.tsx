"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  MoreVertical,
  Clock,
  History,
  Users,
  UserPlus,
  Share2,
  Eye,
  PencilLine,
  FileText,
  Star,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  initials: string
  color: string
}

interface DocumentVersion {
  id: string
  date: Date
  user: User
  comment?: string
}

interface Comment {
  id: string
  user: User
  text: string
  timestamp: Date
  resolved: boolean
}

export function CollaborativeDocument() {
  const [activeTab, setActiveTab] = useState("edit")
  const [documentName, setDocumentName] = useState("Project Proposal")
  const [isRenaming, setIsRenaming] = useState(false)
  const [versions, setVersions] = useState<DocumentVersion[]>([
    {
      id: "v3",
      date: new Date(2023, 8, 15, 14, 30),
      user: {
        id: "user1",
        name: "Alex Johnson",
        email: "alex@example.com",
        initials: "AJ",
        color: "#4f46e5",
      },
      comment: "Added implementation timeline",
    },
    {
      id: "v2",
      date: new Date(2023, 8, 14, 16, 45),
      user: {
        id: "user2",
        name: "Sarah Miller",
        email: "sarah@example.com",
        initials: "SM",
        color: "#0ea5e9",
      },
      comment: "Updated project objectives",
    },
    {
      id: "v1",
      date: new Date(2023, 8, 13, 10, 20),
      user: {
        id: "user3",
        name: "John Doe",
        email: "john@example.com",
        initials: "JD",
        color: "#84cc16",
      },
      comment: "Initial document creation",
    },
  ])
  const [activeUsers, setActiveUsers] = useState<User[]>([
    {
      id: "user1",
      name: "Alex Johnson",
      email: "alex@example.com",
      initials: "AJ",
      color: "#4f46e5",
    },
    {
      id: "user2",
      name: "Sarah Miller",
      email: "sarah@example.com",
      initials: "SM",
      color: "#0ea5e9",
    },
    {
      id: "user4",
      name: "You",
      email: "you@example.com",
      initials: "YO",
      color: "#ec4899",
    },
  ])
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "c1",
      user: {
        id: "user2",
        name: "Sarah Miller",
        email: "sarah@example.com",
        initials: "SM",
        color: "#0ea5e9",
      },
      text: "Could we elaborate more on the technical requirements in this section?",
      timestamp: new Date(2023, 8, 15, 11, 30),
      resolved: false,
    },
    {
      id: "c2",
      user: {
        id: "user1",
        name: "Alex Johnson",
        email: "alex@example.com",
        initials: "AJ",
        color: "#4f46e5",
      },
      text: "The timeline seems a bit ambitious. Should we add more buffer time?",
      timestamp: new Date(2023, 8, 15, 13, 15),
      resolved: true,
    },
  ])

  const toggleCommentResolution = (commentId: string) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment
      )
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Document header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-500" />
          {isRenaming ? (
            <Input
              className="h-7 py-1 px-2 w-64"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onBlur={() => setIsRenaming(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsRenaming(false)
                if (e.key === "Escape") setIsRenaming(false)
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:underline"
              onClick={() => setIsRenaming(true)}
            >
              {documentName}
            </h1>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Star className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4 mr-2" />
                Version History
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Document Versions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {versions.map((version, index) => (
                <DropdownMenuItem key={version.id} className="py-2 px-3">
                  <div className="flex flex-col w-full gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {index === 0 ? "Current" : `Version ${versions.length - index}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {version.date.toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback style={{ backgroundColor: version.user.color }}>
                          {version.user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{version.user.name}</span>
                    </div>
                    {version.comment && (
                      <span className="text-xs text-muted-foreground mt-1">
                        "{version.comment}"
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">People with access</h3>
                  <div className="space-y-2">
                    {activeUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback style={{ backgroundColor: user.color }}>
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Editor <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editor</DropdownMenuItem>
                            <DropdownMenuItem>Commenter</DropdownMenuItem>
                            <DropdownMenuItem>Viewer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Remove access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Add people</h3>
                  <div className="flex gap-2">
                    <Input placeholder="Email address or name" className="flex-1" />
                    <Button>Invite</Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Share link</h3>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value="https://teamsync.com/docs/project-proposal"
                      className="flex-1"
                    />
                    <Button variant="outline">Copy</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <div className="flex justify-between w-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Anyone with the link <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>Anyone with the link</DropdownMenuItem>
                      <DropdownMenuItem>Restricted access</DropdownMenuItem>
                      <DropdownMenuItem>Only invited people</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button type="submit">Done</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center border rounded-md px-1">
            {activeUsers.slice(0, 3).map((user, i) => (
              <Avatar key={user.id} className="h-8 w-8 border-2 border-background" style={{ marginLeft: i > 0 ? "-8px" : "0" }}>
                <AvatarFallback style={{ backgroundColor: user.color }}>
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main document area */}
        <div className="flex-1 flex flex-col">
          {/* Document toolbar */}
          <div className="border-b p-2 flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-32">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">
                  <PencilLine className="h-4 w-4 mr-1" /> Edit
                </TabsTrigger>
                <TabsTrigger value="view">
                  <Eye className="h-4 w-4 mr-1" /> View
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center">
              <div className="flex items-center border-r pr-2 mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center border-r pr-2 mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center border-r pr-2 mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-1" /> Last edit was 5 minutes ago
            </div>
          </div>

          {/* Document content */}
          <TabsContent value="edit" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto p-8 space-y-6">
                <h1 className="text-3xl font-bold">Project Proposal: TeamSync Platform</h1>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Executive Summary</h2>
                  <p>
                    TeamSync is a comprehensive collaboration platform designed to enhance team productivity
                    and streamline communication. Our solution integrates task management, file sharing,
                    real-time chat, video conferencing, and a shared calendar into a seamless experience.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Objectives</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Create a unified workspace that eliminates the need for multiple tools</li>
                    <li>Improve team coordination and reduce communication gaps</li>
                    <li>Provide robust security and data protection features</li>
                    <li>Deliver an intuitive, user-friendly interface that requires minimal training</li>
                    <li>Enable seamless integration with existing business systems</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Target Audience</h2>
                  <p>
                    The TeamSync platform is designed for small to medium-sized businesses, remote teams,
                    and project-based organizations that require effective collaboration tools. It's
                    particularly valuable for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Software development teams</li>
                    <li>Marketing and creative agencies</li>
                    <li>Distributed workforces</li>
                    <li>Project management offices</li>
                    <li>Cross-functional business teams</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Key Features</h2>

                  <h3 className="text-xl font-medium">Task Management</h3>
                  <p>
                    A Kanban-style board for visualizing workflows, with support for task assignments,
                    due dates, priorities, and status tracking. Includes progress metrics and deadline
                    reminders.
                  </p>

                  <h3 className="text-xl font-medium">File Sharing</h3>
                  <p>
                    Secure document storage with version control, collaborative editing, and granular
                    permission settings. Supports all major file formats and includes preview capabilities.
                  </p>

                  <h3 className="text-xl font-medium">Communication Tools</h3>
                  <p>
                    Integrated messaging system with channels, direct messages, thread support, and
                    file sharing. Video conferencing with screen sharing, recording, and breakout rooms.
                  </p>

                  <h3 className="text-xl font-medium">Shared Calendar</h3>
                  <p>
                    Team calendar for scheduling meetings, tracking events, and managing deadlines.
                    Supports recurring events, notifications, and external calendar integration.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Implementation Timeline</h2>
                  <p>The project will be delivered in phases over a 6-month period:</p>

                  <div className="border rounded-md p-4 space-y-3">
                    <div>
                      <h4 className="font-medium">Phase 1: Core Development (Months 1-2)</h4>
                      <p className="text-sm">
                        User authentication, basic task management, file storage, and messaging functionality.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Phase 2: Advanced Features (Months 3-4)</h4>
                      <p className="text-sm">
                        Video conferencing, shared calendar, document collaboration, and reporting tools.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Phase 3: Integration & Optimization (Months 5-6)</h4>
                      <p className="text-sm">
                        Third-party integrations, API development, performance optimization, and security enhancements.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Budget Considerations</h2>
                  <p>
                    The total estimated budget for this project is $150,000, covering development costs,
                    infrastructure, testing, and initial marketing efforts. A detailed breakdown is
                    available in the appendix.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Conclusion</h2>
                  <p>
                    The TeamSync platform represents a significant opportunity to address the growing
                    needs of remote and distributed teams. By combining essential collaboration tools
                    into a single, intuitive interface, we can deliver substantial value to organizations
                    seeking to improve their team productivity and communication.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="view" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto p-8 space-y-6">
                <h1 className="text-3xl font-bold">Project Proposal: TeamSync Platform</h1>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Executive Summary</h2>
                  <p>
                    TeamSync is a comprehensive collaboration platform designed to enhance team productivity
                    and streamline communication. Our solution integrates task management, file sharing,
                    real-time chat, video conferencing, and a shared calendar into a seamless experience.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Objectives</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Create a unified workspace that eliminates the need for multiple tools</li>
                    <li>Improve team coordination and reduce communication gaps</li>
                    <li>Provide robust security and data protection features</li>
                    <li>Deliver an intuitive, user-friendly interface that requires minimal training</li>
                    <li>Enable seamless integration with existing business systems</li>
                  </ul>
                </div>

                {/* Content continues similarly to edit mode but without editable elements */}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>

        {/* Comments panel */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Comments & Suggestions
            </h2>
            <Button variant="ghost" size="sm">
              + Add Comment
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`border rounded-md p-3 ${
                    comment.resolved ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback style={{ backgroundColor: comment.user.color }}>
                          {comment.user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{comment.user.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {comment.timestamp.toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className={`text-sm ${comment.resolved ? "text-muted-foreground" : ""}`}>
                    {comment.text}
                  </p>
                  <div className="flex justify-between mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleCommentResolution(comment.id)}
                    >
                      {comment.resolved ? "Reopen" : "Resolve"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Reply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
