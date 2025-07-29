"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, isToday, isBefore, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { ArrowLeft, CalendarIcon, Clock, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { nanoid } from "nanoid"

export default function ScheduleMeetingPage() {
  const [meetingName, setMeetingName] = useState("")
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [participants, setParticipants] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [meetingId] = useState(() => `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  // Generate time options for the select dropdown (every 15 minutes)
  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      timeOptions.push(`${formattedHour}:${formattedMinute}`)
    }
  }

  const validateForm = () => {
    if (!meetingName.trim()) {
      toast.error("Please enter a meeting name")
      return false
    }

    if (!date) {
      toast.error("Please select a date")
      return false
    }

    // Check if date is in the past
    if (isBefore(startOfDay(date), startOfDay(new Date()))) {
      toast.error("Meeting date cannot be in the past")
      return false
    }

    if (!startTime) {
      toast.error("Please select a start time")
      return false
    }

    return true
  }

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // In a real app, this would send data to the server
      // For demo, we'll just simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success("Meeting scheduled successfully")

      // Navigate back to the meetings page
      router.push("/dashboard/meeting")
    } catch (error) {
      toast.error("Failed to schedule meeting")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId)
    setCopied(true)
    toast.success("Meeting ID copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return "Select a date"

    if (isToday(date)) {
      return "Today"
    }

    return format(date, "PPP")
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
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule Meeting
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleScheduleMeeting}>
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
                  onClick={copyMeetingId}
                  className="shrink-0"
                  type="button"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Participants will use this ID to join the meeting
              </p>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime} required>
                  <SelectTrigger id="startTime" className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Participants</Label>
              <Input
                id="participants"
                placeholder="Enter email addresses (separated by comma)"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Participants will receive an invitation email with meeting details
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
