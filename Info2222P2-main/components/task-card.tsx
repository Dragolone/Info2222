"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MenuIcon, Edit, Trash2, Share2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Define task tag types to match reference design
type TaskTag = "Website" | "Design" | "App" | "Planning" | "Frontend" | undefined;

interface TaskCardProps {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "Low" | "Medium" | "High" | "Critical"
  assignee: {
    name: string
    avatar?: string
    initials: string
  }
  status: "todo" | "in-progress" | "done" | "backlog"
  tags?: TaskTag[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onShare?: (id: string) => void
}

export function TaskCard({
  id,
  title,
  description,
  dueDate,
  priority,
  assignee,
  status,
  tags,
  onEdit,
  onDelete,
  onShare,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Handle SSR - window is not available during server rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If no tags provided, generate random ones based on task title and ID
  const generateTags = (): TaskTag[] => {
    if (tags && tags.length > 0) return tags;

    // Simplified algorithm to deterministically generate tags based on task id
    const possibleTags: TaskTag[] = ["Website", "Design", "App", "Planning", "Frontend"];

    // Add a null check for id
    if (!id) {
      // Return a default tag if id is undefined
      return ["Design"];
    }

    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Get 1-2 tags based on the hash
    const numTags = (hash % 2) + 1;
    const result: TaskTag[] = [];

    for (let i = 0; i < numTags; i++) {
      const tagIndex = (hash + i) % possibleTags.length;
      result.push(possibleTags[tagIndex]);
    }

    return result;
  };

  // Get tags for this task
  const taskTags = generateTags();

  const priorityColor = {
    Low: "status-badge-success",
    Medium: "status-badge-info",
    High: "status-badge-warning",
    Critical: "status-badge-error",
  }

  const statusIndicator = {
    todo: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-warning before:rounded-l before:z-10",
    "in-progress": "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-info before:rounded-l before:z-10",
    done: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-success before:rounded-l before:z-10",
    backlog: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-muted-foreground before:rounded-l before:z-10",
  }

  const isDueSoon = () => {
    // Check if the due date is within 3 days from now
    if (dueDate === "TBD") return false

    const today = new Date()
    const dueDateTime = new Date(dueDate)
    const diffTime = dueDateTime.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays >= 0 && diffDays <= 3
  }

  const isOverdue = () => {
    // Check if the due date has passed
    if (dueDate === "TBD") return false

    const today = new Date()
    const dueDateTime = new Date(dueDate)
    return dueDateTime < today && status !== "done"
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all overflow-hidden relative group animate-fade-in",
          statusIndicator[status],
          status === "done" ? "opacity-85 bg-muted/30" : "",
          isHovered ? "shadow-md" : "",
          isOverdue() && status !== "done" ? "shadow-sm shadow-red-300/50 dark:shadow-red-950/30" : ""
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-task-id={id}
      >
        <CardContent className="p-3 sm:p-4 space-y-2 flex flex-col min-h-[120px]">
          {/* Task Tags - Added to match reference design */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {taskTags.map((tag, index) => (
              <span
                key={`${id}-tag-${index}`}
                className={cn(
                  "kanban-card-tag",
                  `kanban-card-tag-${tag?.toLowerCase()}`
                )}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Card Header */}
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <div className="font-medium text-sm sm:text-base leading-tight break-words flex-1">
              {title}
            </div>

            <div className="flex gap-0.5 items-start ml-1 shrink-0">
              {/* Priority Indicator Dot - Visible by default for important tasks */}
              {(priority === "High" || priority === "Critical") && (
                <div className={cn(
                  "h-2 w-2 rounded-full mt-1.5",
                  priority === "Critical" ? "bg-destructive animate-pulse" : "bg-warning"
                )} />
              )}

              {/* Status Badge for In Progress */}
              {status === "in-progress" && (
                <Badge variant="secondary" className="text-xs py-0 h-5 whitespace-nowrap">
                  Active
                </Badge>
              )}

              {/* Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted/80 transition-colors"
                  >
                    <MenuIcon className="h-3 w-3" />
                    <span className="sr-only">Task menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={() => onEdit && onEdit(id)}
                    className="h-[var(--touch-target-min)] cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onShare && onShare(id)}
                    className="h-[var(--touch-target-min)] cursor-pointer"
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete && onDelete(id)}
                    className="text-destructive focus:text-destructive h-[var(--touch-target-min)] cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm text-muted-foreground line-clamp-2 mb-0.5">
            {description}
          </div>

          {/* Card Footer */}
          <div className="mt-auto flex flex-col gap-1.5">
            {/* Due Date */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue() && status !== "done"
                  ? "text-destructive font-medium"
                  : "text-muted-foreground",
                isDueSoon() && status !== "done"
                  ? "text-warning-foreground font-medium"
                  : ""
              )}
            >
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className={cn(
                "text-ellipsis-1",
                isOverdue() && status !== "done"
                  ? "underline decoration-destructive decoration-dotted underline-offset-2"
                  : ""
              )}>
                {dueDate}
              </span>
            </div>

            {/* Priority and Assignee */}
            <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
              <Badge
                variant="outline"
                className={cn("status-badge", priorityColor[priority], "flex items-center gap-1 text-[10px] px-2 py-0 h-5")}
              >
                {priority === "Critical" && <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>}
                {priority}
              </Badge>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignee.avatar} alt={assignee.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Assigned to: {assignee.name}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

