"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  MessageSquare,
  Users,
  Share2,
  MoreVertical,
  Copy,
  Check,
  Settings,
  ScreenShare,
  Maximize,
  PlusCircle,
  Hand,
  Layout,
  LayoutGrid
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  name: string
  initials: string
  isSpeaking: boolean
  isMuted: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
}

interface ChatMessage {
  id: string
  sender: {
    name: string
    initials: string
  }
  message: string
  timestamp: string
}

interface MeetingRoomMinimalProps {
  meetingId: string
  userName: string
  initialAudioEnabled: boolean
  initialVideoEnabled: boolean
}

export function MeetingRoomMinimal({
  meetingId,
  userName,
  initialAudioEnabled,
  initialVideoEnabled
}: MeetingRoomMinimalProps) {
  const [isMuted, setIsMuted] = useState(!initialAudioEnabled)
  const [isVideoOn, setIsVideoOn] = useState(initialVideoEnabled)
  const [isSharing, setIsSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [activeSidePanel, setActiveSidePanel] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "speaker">("grid")
  const [copied, setCopied] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: userName,
      initials: userName.split(" ").map(n => n[0]).join("").toUpperCase() || "U",
      isSpeaking: false,
      isMuted: !initialAudioEnabled,
      isVideoOn: initialVideoEnabled,
      isScreenSharing: false,
    },
    {
      id: "2",
      name: "Jane Doe",
      initials: "JD",
      isSpeaking: true,
      isMuted: false,
      isVideoOn: true,
      isScreenSharing: false,
    },
    {
      id: "3",
      name: "Mike Smith",
      initials: "MS",
      isSpeaking: false,
      isMuted: true,
      isVideoOn: true,
      isScreenSharing: false,
    },
    {
      id: "4",
      name: "Alex Lee",
      initials: "AL",
      isSpeaking: false,
      isMuted: false,
      isVideoOn: true,
      isScreenSharing: false,
    },
  ])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: { name: "Jane Doe", initials: "JD" },
      message: "Hi everyone! Let's discuss the project timeline.",
      timestamp: "10:01 AM",
    },
    {
      id: "2",
      sender: { name: "Mike Smith", initials: "MS" },
      message: "I've prepared a presentation for today's meeting.",
      timestamp: "10:02 AM",
    },
    {
      id: "3",
      sender: { name: userName, initials: userName.split(" ").map(n => n[0]).join("").toUpperCase() || "U" },
      message: "Great! I have some questions about the design requirements.",
      timestamp: "10:03 AM",
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState({
    id: meetingId,
    link: `https://teamsync.com/meeting/${meetingId}`,
    started: new Date(),
  })

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simulate webcam feed
    if (localVideoRef.current && isVideoOn) {
      try {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream
            }
          })
          .catch((err) => {
            console.error("Error accessing media devices:", err)
          })
      } catch (error) {
        console.log("Media devices not supported or permission denied")
      }
    }

    return () => {
      // Clean up video stream
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isVideoOn])

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const toggleMute = () => setIsMuted(!isMuted)
  const toggleVideo = () => setIsVideoOn(!isVideoOn)
  const toggleSharing = () => setIsSharing(!isSharing)
  const toggleHandRaise = () => setIsHandRaised(!isHandRaised)

  const toggleSidePanel = (panel: string) => {
    if (activeSidePanel === panel) {
      setActiveSidePanel(null)
    } else {
      setActiveSidePanel(panel)
    }
  }

  const sendMessage = () => {
    if (newMessage.trim() === "") return

    const newChatMessage: ChatMessage = {
      id: `${chatMessages.length + 1}`,
      sender: {
        name: userName,
        initials: userName.split(" ").map(n => n[0]).join("").toUpperCase() || "U"
      },
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages([...chatMessages, newChatMessage])
    setNewMessage("")
  }

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getMeetingDuration = () => {
    const now = new Date()
    const diffMs = now.getTime() - meetingInfo.started.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`
  }

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingInfo.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Meeting link copied to clipboard")
  }

  const endMeeting = () => {
    window.location.href = "/dashboard/meeting"
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Video className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-medium">Meeting</h1>
            <p className="text-xs text-muted-foreground">{getMeetingDuration()} • {participants.length} participants</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyMeetingLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy meeting link"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Invite participants
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView(view === "grid" ? "speaker" : "grid")}
                >
                  {view === "grid" ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <Layout className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {view === "grid" ? "Grid view" : "Speaker view"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 p-4 overflow-hidden">
          <div
            className={cn(
              "grid gap-4 h-full",
              view === "grid"
                ? "grid-cols-1 md:grid-cols-2 auto-rows-fr"
                : "grid-cols-1"
            )}
          >
            {participants.map((participant, index) => (
              <Card
                key={participant.id}
                className={cn(
                  "w-full h-full overflow-hidden relative border-0 shadow-sm",
                  participant.isSpeaking && "ring-2 ring-primary ring-offset-2",
                  view === "speaker" && index !== 0 && "hidden"
                )}
              >
                {participant.isVideoOn ? (
                  <div className="w-full h-full bg-muted/50">
                    {participant.id === "1" ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                        {/* Placeholder for remote participant video */}
                        <div className="text-xs text-muted-foreground">
                          Remote video stream
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/30">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback>{participant.initials}</AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{participant.name}{participant.id === "1" ? " (You)" : ""}</span>
                    {participant.isMuted && <MicOff className="h-3.5 w-3.5 text-white/80" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>

        {/* Side panel */}
        {activeSidePanel && (
          <aside className="w-80 border-l bg-background shrink-0 overflow-hidden flex flex-col">
            {activeSidePanel === "chat" && (
              <>
                <div className="h-14 border-b px-4 flex items-center justify-between">
                  <h2 className="font-medium">Chat</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSidePanel("chat")}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback>{message.sender.initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {message.sender.name}
                              {message.sender.name === userName && " (You)"}
                            </span>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          try { await sendMessage(); } catch (e) { console.error(e); }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button size="icon" onClick={async () => { try { await sendMessage(); } catch (e) { console.error(e); } }}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeSidePanel === "participants" && (
              <>
                <div className="h-14 border-b px-4 flex items-center justify-between">
                  <h2 className="font-medium">Participants ({participants.length})</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSidePanel("participants")}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-0">
                  <div className="divide-y">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{participant.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {participant.name}
                              {participant.id === "1" && " (You)"}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {participant.isSpeaking && (
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              )}
                              <span>{participant.isSpeaking ? "Speaking" : "Not speaking"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {participant.isMuted ? (
                            <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                          )}

                          {participant.isVideoOn ? (
                            <Video className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <VideoOff className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </aside>
        )}
      </div>

      {/* Control bar */}
      <footer className="h-20 border-t bg-background shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMuted ? "secondary" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isMuted ? "Unmute" : "Mute"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isVideoOn ? "outline" : "secondary"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isVideoOn ? "Turn off camera" : "Turn on camera"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSharing ? "secondary" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={toggleSharing}
                >
                  <ScreenShare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSharing ? "Stop sharing" : "Share screen"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isHandRaised ? "secondary" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={toggleHandRaise}
                >
                  <Hand className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isHandRaised ? "Lower hand" : "Raise hand"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeSidePanel === "chat" ? "secondary" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => toggleSidePanel("chat")}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeSidePanel === "participants" ? "secondary" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => toggleSidePanel("participants")}
                >
                  <Users className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Participants
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-8 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={endMeeting}
                >
                  <Phone className="h-5 w-5 rotate-135" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Leave meeting
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </footer>

      {/* Invite dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite people</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting link</label>
              <div className="flex items-center gap-2">
                <Input
                  value={meetingInfo.link}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyMeetingLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting ID</label>
              <div className="flex items-center gap-2">
                <Input
                  value={meetingInfo.id}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInviteDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
