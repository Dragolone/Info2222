"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { DropResult, DragStart } from "react-beautiful-dnd"

// Import DragDropContext dynamically to prevent hydration issues
const DragDropContext = dynamic(
  () => import("react-beautiful-dnd").then(mod => mod.DragDropContext),
  { ssr: false }
)

interface DndWrapperProps {
  children: React.ReactNode;
  onDragStart?: (initial: DragStart) => void;
  onDragEnd?: (result: DropResult) => void;
}

// This component ensures drag-and-drop functionality works properly
// by only mounting it client-side
export default function DndWrapper({
  children,
  onDragStart,
  onDragEnd
}: DndWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Only set mounted on client-side to prevent hydration mismatch
    setIsMounted(true)

    // Add sensible default for html/body to prevent scrolling issues during dragging
    if (typeof document !== 'undefined') {
      document.body.style.overflowX = 'hidden';
    }

    // Clean up function
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflowX = '';
      }
    };
  }, [])

  // Return null initially to avoid hydration mismatches
  if (!isMounted) {
    return null;
  }

  const handleDragStart = (initial: DragStart) => {
    if (onDragStart) {
      onDragStart(initial);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (onDragEnd) {
      onDragEnd(result);
    }
  };

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DragDropContext>
  )
}
