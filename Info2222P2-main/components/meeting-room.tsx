"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
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
  X,
  Settings,
  Maximize,
  ScreenShare,
  PencilRuler,
  Send,
  Paperclip,
  UserPlus,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

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

export function MeetingRoom() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [activeSidePanel, setActiveSidePanel] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: "You",
      initials: "YO",
      isSpeaking: false,
      isMuted: false,
      isVideoOn: true,
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
    {
      id: "5",
      name: "Sarah Johnson",
      initials: "SJ",
      isSpeaking: false,
      isMuted: false,
      isVideoOn: false,
      isScreenSharing: false,
    },
    {
      id: "6",
      name: "David Chen",
      initials: "DC",
      isSpeaking: false,
      isMuted: true,
      isVideoOn: true,
      isScreenSharing: false,
    },
    {
      id: "7",
      name: "Emma Wilson",
      initials: "EW",
      isSpeaking: false,
      isMuted: false,
      isVideoOn: false,
      isScreenSharing: false,
    },
    {
      id: "8",
      name: "Robert Miller",
      initials: "RM",
      isSpeaking: false,
      isMuted: true,
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
      sender: { name: "You", initials: "YO" },
      message: "Great! I have some questions about the design requirements.",
      timestamp: "10:03 AM",
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState({
    topic: "Project Sync Meeting",
    id: "123-456-789",
    link: "https://teamsync.com/meeting/123-456-789",
    duration: "1 hour",
    started: new Date(),
  })
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState<Array<{type: string, points: number[][], color: string}>>([]);
  const whiteboardRef = useRef<HTMLCanvasElement>(null);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[][]>([]);

  useEffect(() => {
    // Simulate webcam feed in real implementation
    // This would be replaced with actual WebRTC implementation
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

  const toggleMute = () => setIsMuted(!isMuted)
  const toggleVideo = () => setIsVideoOn(!isVideoOn)
  const toggleSharing = () => setIsSharing(!isSharing)

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
      sender: { name: "You", initials: "YO" },
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

  // Screen sharing logic
  const startScreenShare = () => {
    // In a real app, this would use the Screen Capture API
    setIsSharing(true);

    // Simulate another participant sharing their screen
    const sharingParticipant = participants.find(p => p.id === "2");
    if (sharingParticipant) {
      const updatedParticipants = participants.map(p =>
        p.id === "2" ? { ...p, isScreenSharing: true } : { ...p, isScreenSharing: false }
      );
      setParticipants(updatedParticipants);
    }
  };

  const stopScreenShare = () => {
    setIsSharing(false);

    // Stop all participants from sharing
    const updatedParticipants = participants.map(p =>
      ({ ...p, isScreenSharing: false })
    );
    setParticipants(updatedParticipants);
  };

  // Whiteboard functionality
  const startWhiteboard = () => {
    setIsWhiteboardActive(true);

    // Initialize canvas in next render cycle
    setTimeout(() => {
      if (whiteboardRef.current) {
        const canvas = whiteboardRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.lineWidth = 3;
        }
      }
    }, 100);
  };

  const stopWhiteboard = () => {
    setIsWhiteboardActive(false);
    // In a real app, we might want to save the whiteboard state
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!whiteboardRef.current) return;

    const canvas = whiteboardRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPoints([[x, y]]);

    // Start drawing
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = currentTool === "pen" ? currentColor : "#FFFFFF";
      ctx.lineWidth = currentTool === "pen" ? 3 : 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !whiteboardRef.current) return;

    const canvas = whiteboardRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add point to current stroke
    setCurrentPoints([...currentPoints, [x, y]]);

    // Draw line
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || currentPoints.length === 0) return;

    // Save the current drawing to whiteboard data
    setWhiteboardData([
      ...whiteboardData,
      {
        type: currentTool,
        points: currentPoints,
        color: currentColor
      }
    ]);

    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const clearWhiteboard = () => {
    if (!whiteboardRef.current) return;

    const canvas = whiteboardRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setWhiteboardData([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Meeting header */}
      <div className="border-b p-5 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">{meetingInfo.topic}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Meeting ID: {meetingInfo.id}</span>
            <span>•</span>
            <span>Duration: {getMeetingDuration()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setInviteDialogOpen(true)}>
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Invite participants</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Meeting settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Full screen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid or Whiteboard or Screen Share */}
        <div className="flex-1 p-5 flex flex-col relative">
          {isWhiteboardActive ? (
            <div className="bg-white border rounded-lg flex-1 flex flex-col overflow-hidden">
              <div className="border-b p-3 flex justify-between items-center bg-muted/50">
                <div className="text-lg font-medium">Collaborative Whiteboard</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button
                      variant={currentTool === "pen" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("pen")}
                      className="rounded-none"
                    >
                      <PencilRuler className="h-4 w-4 mr-2" />
                      Pen
                    </Button>
                    <Button
                      variant={currentTool === "eraser" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("eraser")}
                      className="rounded-none"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Eraser
                    </Button>
                  </div>
                  {currentTool === "pen" && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm">Color:</div>
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-8 h-8 rounded overflow-hidden cursor-pointer"
                      />
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={clearWhiteboard}>
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={stopWhiteboard}>
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <canvas
                  ref={whiteboardRef}
                  width={800}
                  height={600}
                  className="absolute top-0 left-0 w-full h-full bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                ></canvas>
              </div>
            </div>
          ) : isSharing ? (
            <div className="flex-1 flex flex-col">
              <div className="text-center py-2 bg-primary text-primary-foreground">
                <div className="flex items-center justify-center gap-2">
                  <ScreenShare className="h-4 w-4" />
                  <span>{participants.find(p => p.isScreenSharing)?.name || "Someone"} is sharing their screen</span>
                </div>
              </div>
              <div className="flex-1 bg-black flex items-center justify-center p-8">
                <div className="w-full h-full bg-muted flex items-center justify-center text-center p-6 rounded-lg">
                  <div>
                    <div className="text-2xl font-semibold mb-2">Screen Share Preview</div>
                    <p className="text-muted-foreground">This is where the shared screen would appear</p>
                    {participants.find(p => p.id === "1")?.isScreenSharing && (
                      <Button className="mt-4" onClick={stopScreenShare}>
                        Stop Sharing
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Improved responsive grid layout for participants */}
              <div className="grid gap-3 flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {participants.map((participant) => (
                  <Card
                    key={participant.id}
                    className={`flex flex-col overflow-hidden h-full
                      ${participant.isSpeaking ? 'ring-2 ring-primary shadow-lg' : ''}`}
                  >
                    <CardContent className="flex-1 p-0 relative">
                      {participant.id === "1" ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          className={`w-full h-full object-cover ${!participant.isVideoOn ? 'hidden' : ''}`}
                        />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center">
                          {!participant.isVideoOn ? (
                            <div className="flex flex-col items-center justify-center">
                              <Avatar className="h-24 w-24 mb-2 border-2 border-primary/30">
                                <AvatarFallback className="text-4xl bg-primary/10">{participant.initials}</AvatarFallback>
                            </Avatar>
                              <span className="text-sm text-muted-foreground">Camera off</span>
                            </div>
                          ) : (
                            <div className="bg-black w-full h-full">
                              {/* Simulated video - in a real app this would be a WebRTC video element */}
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                                <span className="text-xs text-gray-400 opacity-30">Video Feed</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Connection quality indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 text-white text-xs py-1 px-2 rounded-full">
                        <div className="flex items-center">
                          <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-0.5"></div>
                          <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-0.5"></div>
                          <div className="h-1.5 w-1.5 bg-green-500/40 rounded-full"></div>
                        </div>
                        <span className="text-xs">Good</span>
                      </div>

                      {/* Bottom info bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[120px]">
                            {participant.name} {participant.id === "1" && "(You)"}
                          </span>
                          {participant.isSpeaking && (
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                        {participant.isMuted && (
                          <MicOff className="h-4 w-4" />
                        )}
                          {participant.isScreenSharing && (
                            <ScreenShare className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Meeting controls */}
          <div className="p-5 border-t mt-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "outline" : "secondary"}
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isVideoOn ? "secondary" : "outline"}
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={toggleVideo}
                    >
                      {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isVideoOn ? "Turn off camera" : "Turn on camera"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSharing ? "secondary" : "outline"}
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={isSharing ? stopScreenShare : startScreenShare}
                    >
                      <ScreenShare className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isWhiteboardActive ? "secondary" : "outline"}
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={isWhiteboardActive ? stopWhiteboard : startWhiteboard}
                    >
                      <PencilRuler className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isWhiteboardActive ? "Close whiteboard" : "Open whiteboard"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex gap-3">
              <Button
                variant={activeSidePanel === "chat" ? "secondary" : "outline"}
                className="gap-2"
                onClick={() => toggleSidePanel("chat")}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
              <Button
                variant={activeSidePanel === "participants" ? "secondary" : "outline"}
                className="gap-2"
                onClick={() => toggleSidePanel("participants")}
              >
                <Users className="h-4 w-4" />
                Participants
              </Button>
            </div>

            <Button variant="destructive" size="lg" className="gap-2" onClick={() => window.history.back()}>
              <Phone className="h-5 w-5" />
              End Call
            </Button>
          </div>
        </div>

        {/* Side panel */}
        {activeSidePanel && (
          <div className="w-80 border-l flex flex-col">
            {activeSidePanel === "chat" ? (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Meeting Chat</h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{msg.sender.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex gap-2 items-baseline">
                            <span className="font-medium text-sm">{msg.sender.name}</span>
                            <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm mt-1">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t mt-auto">
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
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Participants ({participants.length})</h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/20">
                            <AvatarFallback className={`
                              ${participant.isVideoOn ? 'bg-primary/10' : 'bg-muted'}
                            `}>
                              {participant.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {participant.name} {participant.id === "1" && "(You)"}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {participant.isScreenSharing && (
                                <div className="text-primary flex items-center gap-1">
                                  <ScreenShare className="h-3 w-3" /> Sharing
                                </div>
                              )}
                              {!participant.isVideoOn && (
                                <div className="flex items-center gap-1">
                                  <VideoOff className="h-3 w-3" /> No video
                              </div>
                            )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" />}
                          {participant.isSpeaking && (
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-green-300 animate-ping"></div>
                            </div>
                          )}
                          {participant.id !== "1" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <Button className="w-full" variant="outline" onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite People
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite People</DialogTitle>
            <DialogDescription>
              Share this link to invite others to your meeting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={meetingInfo.link}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(meetingInfo.link);
                toast({
                  title: "Link copied",
                  description: "Meeting link copied to clipboard.",
                });
              }}>
                Copy
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="invite-email">Or invite by email:</Label>
              <Input
                id="invite-email"
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
