"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Video, Plus, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function MeetingPage() {
  const [meetingId, setMeetingId] = useState("")
  const router = useRouter()

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault()

    if (!meetingId.trim()) {
      toast.error("Please enter a meeting ID")
      return
    }

    router.push(`/dashboard/meeting/join?id=${meetingId}`)
  }

  return (
    <div className="container max-w-5xl py-8 px-4 mx-auto">
      <h1 className="text-2xl font-medium mb-8">Video Meetings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <Link href="/dashboard/meeting/new">
              <Button
                variant="ghost"
                className="w-full h-full py-8 flex flex-col items-center gap-4 rounded-lg hover:bg-primary/5"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Video className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg">New Meeting</h3>
                  <p className="text-sm text-muted-foreground mt-1">Start a video meeting now</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <Link href="/dashboard/meeting/join">
              <Button
                variant="ghost"
                className="w-full h-full py-8 flex flex-col items-center gap-4 rounded-lg hover:bg-primary/5"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg">Join Meeting</h3>
                  <p className="text-sm text-muted-foreground mt-1">Enter a meeting code</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <Link href="/dashboard/meeting/schedule">
              <Button
                variant="ghost"
                className="w-full h-full py-8 flex flex-col items-center gap-4 rounded-lg hover:bg-primary/5"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg">Schedule</h3>
                  <p className="text-sm text-muted-foreground mt-1">Plan a future meeting</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Upcoming Meetings</h2>
          <Link href="/dashboard/calendar">
            <Button variant="ghost" size="sm" className="text-sm" >
              View all
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {/* Meeting list */}
            <div className="space-y-4">
              <MeetingItem
                title="Weekly Team Sync"
                time="Today, 3:00 PM"
                participants={5}
                meetingId="123-456-789"
              />
              <MeetingItem
                title="Product Design Review"
                time="Tomorrow, 10:00 AM"
                participants={3}
                meetingId="234-567-890"
              />
              <MeetingItem
                title="Client Presentation"
                time="Thursday, 2:30 PM"
                participants={8}
                meetingId="345-678-901"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Join with ID</h2>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleJoinMeeting} className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                Join Meeting
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Meeting list item component
function MeetingItem({
  title,
  time,
  participants,
  meetingId
}: {
  title: string;
  time: string;
  participants: number;
  meetingId: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{time} • {participants} participants</p>
        </div>
      </div>
      <Link href={`/dashboard/meeting/join?id=${meetingId}`}>
        <Button size="sm">Join</Button>
      </Link>
    </div>
  )
}
