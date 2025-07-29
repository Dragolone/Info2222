"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MeetingRoomMinimal } from "@/components/meeting-room-minimal"
import { toast } from "sonner"

export default function MeetingRoomPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const meetingId = searchParams.get("id") || ""
  const name = searchParams.get("name") || ""
  const audioEnabled = searchParams.get("audio") !== "false"
  const videoEnabled = searchParams.get("video") !== "false"

  // If there's no name, redirect to join page with ID prefilled
  useEffect(() => {
    if (!name && meetingId) {
      toast.info("Please enter your name to join the meeting")
      router.replace(`/dashboard/meeting/join?id=${meetingId}`)
      return
    }

    if (!meetingId) {
      toast.error("Invalid meeting ID")
      router.replace("/dashboard/meeting")
      return
    }
  }, [meetingId, name, router])

  // Show nothing during redirect
  if (!meetingId || !name) {
    return null
  }

  return (
    <MeetingRoomMinimal
      meetingId={meetingId}
      userName={name}
      initialAudioEnabled={audioEnabled}
      initialVideoEnabled={videoEnabled}
    />
  )
}
