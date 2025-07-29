"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Import KanbanBoardSimple component dynamically to avoid SSR issues
const KanbanBoardSimple = dynamic(() => import("@/components/kanban-board-simple"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
        <p className="text-muted-foreground">Loading board...</p>
      </div>
    </div>
  )
})

interface KanbanWrapperProps {
  onTaskAdd?: (status: string) => void
}

export default function KanbanWrapper({ onTaskAdd }: KanbanWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel')

  useEffect(() => {
    // Only set mounted on client-side
    setMounted(true)

    // Load view mode from localStorage
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('kanban-view');
      if (savedMode === 'list' || savedMode === 'carousel') {
        setViewMode(savedMode as 'carousel' | 'list');
      }
    }
  }, [])

  // Using null conditionally to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return <KanbanBoardSimple onTaskAdd={onTaskAdd} initialViewMode={viewMode} />
}
