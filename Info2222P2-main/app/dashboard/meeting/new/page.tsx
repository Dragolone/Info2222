"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { nanoid } from "nanoid"

export default function NewMeetingPage() {
  const [meetingName, setMeetingName] = useState("My Meeting")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  // Generate a unique meeting ID
  const [meetingId] = useState(() => `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`)
  const meetingLink = `https://teamsync.com/meeting/${meetingId}`

  // Access camera when the component mounts or when videoEnabled changes
  useEffect(() => {
    let currentStream: MediaStream | null = null;

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

  const handleStartMeeting = () => {
    if (!meetingName.trim()) {
      toast.error("Please enter a meeting name");
      return;
    }

    // Stop the stream before navigating
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    router.push(`/dashboard/meeting/room?id=${meetingId}&name=${encodeURIComponent(meetingName)}&audio=${audioEnabled}&video=${videoEnabled}`)
  }

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink)
    setCopied(true)
    toast.success("Meeting link copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
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
            New Meeting
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meetingName">Meeting Name</Label>
            <Input
              id="meetingName"
              placeholder="Enter meeting name"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Meeting ID</Label>
            <div className="flex items-center gap-2">
              <Input
                value={meetingId}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyMeetingLink}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share this ID with participants to join your meeting
            </p>
          </div>

          {/* Video preview */}
          <div className="space-y-2">
            <Label>Video Preview</Label>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              {videoEnabled ? (
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
          <Button onClick={handleStartMeeting} className="w-full">
            Start Meeting
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
