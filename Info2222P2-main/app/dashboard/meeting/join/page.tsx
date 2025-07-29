"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Video, VideoOff, Mic, MicOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export default function JoinMeetingPage() {
  const searchParams = useSearchParams()
  const initialMeetingId = searchParams.get("id") || ""

  const [meetingId, setMeetingId] = useState(initialMeetingId)
  const [name, setName] = useState("")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  // Access camera when the component mounts or when videoEnabled changes
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    setIsInitializing(true);

    const getMedia = async () => {
      try {
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        if (videoEnabled) {
          const userStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: audioEnabled
          });

          setStream(userStream);
          currentStream = userStream;

          if (videoRef.current) {
            videoRef.current.srcObject = userStream;
          }
        } else {
          setStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast.error("Could not access camera or microphone");
        setVideoEnabled(false);
      } finally {
        setIsInitializing(false);
      }
    };

    getMedia();

    // Cleanup function
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoEnabled, audioEnabled]);

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault()

    if (!meetingId.trim()) {
      toast.error("Please enter a meeting ID");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Stop the stream before navigating
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    router.push(`/dashboard/meeting/room?id=${meetingId}&name=${encodeURIComponent(name)}&audio=${audioEnabled}&video=${videoEnabled}`)
  }

  return (
    <div className="container max-w-lg py-8 px-4 mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/meeting" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to meetings
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Video className="h-5 w-5 text-primary" />
            Join Meeting
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleJoinMeeting}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="meetingId">Meeting ID</Label>
              <Input
                id="meetingId"
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus={initialMeetingId !== ""}
              />
            </div>

            {/* Video preview */}
            <div className="space-y-2">
              <Label>Video Preview</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                {isInitializing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse text-sm text-muted-foreground">
                      Initializing camera...
                    </div>
                  </div>
                ) : videoEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <VideoOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium">Meeting Options</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {audioEnabled ? (
                    <Mic className="h-4 w-4 text-primary" />
                  ) : (
                    <MicOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="audio" className="cursor-pointer">
                    Turn on microphone
                  </Label>
                </div>
                <Switch
                  id="audio"
                  checked={audioEnabled}
                  onCheckedChange={setAudioEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {videoEnabled ? (
                    <Video className="h-4 w-4 text-primary" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="video" className="cursor-pointer">
                    Turn on camera
                  </Label>
                </div>
                <Switch
                  id="video"
                  checked={videoEnabled}
                  onCheckedChange={setVideoEnabled}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              Join Meeting
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
