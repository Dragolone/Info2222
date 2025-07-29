"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Users,
  Filter,
  CheckSquare,
  Clock,
  Milestone,
  Flag
} from "lucide-react"
import { format, parseISO, isAfter, isBefore, addMonths } from "date-fns"
import { cn } from "@/lib/utils"

// Define the interface for roadmap tasks
interface RoadmapTask {
  id: string
  title: string
  description: string
  dueDate: string
  startDate?: string
  priority: "Low" | "Medium" | "High" | "Critical"
  assignee: {
    name: string
    initials: string
  }
  status: "todo" | "in-progress" | "done" | "backlog"
  epic?: string
  project?: string
  quarter?: "Q1" | "Q2" | "Q3" | "Q4"
  isMilestone?: boolean
}

interface RoadmapProps {
  tasks?: any[]
}

interface GroupedTasks {
  [key: string]: {
    title: string
    tasks: RoadmapTask[]
    progress: number
    startDate?: string
    endDate?: string
  }
}

export function Roadmap({ tasks = [] }: RoadmapProps) {
  const [mounted, setMounted] = useState(false)
  const [groupBy, setGroupBy] = useState<"epic" | "project" | "quarter">("quarter")
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [filterBy, setFilterBy] = useState<string[]>([])
  const [formattedTasks, setFormattedTasks] = useState<RoadmapTask[]>([])

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true)
  }, [])

  // Format tasks to ensure they have all required properties
  useEffect(() => {
    if (!mounted) return

    if (tasks.length > 0) {
      const formatted = tasks.map((task: any) => {
        const formattedTask: RoadmapTask = {
          id: task.id,
          title: task.title,
          description: task.description || "",
          dueDate: task.dueDate || new Date().toISOString().split('T')[0],
          startDate: task.startDate,
          priority: task.priority || "Medium",
          assignee: task.assignee || { name: "Unassigned", initials: "UN" },
          status: task.status || "todo",
          epic: task.epic || "Core Product",
          project: task.project || "General",
          quarter: task.quarter || determineQuarter(task.dueDate),
          isMilestone: task.isMilestone || false
        }
        return formattedTask
      })
      setFormattedTasks(formatted)
    } else {
      // Demo data if no tasks provided
      const demoTasks: RoadmapTask[] = [
        {
          id: "task-1",
          title: "API Authentication Overhaul",
          description: "Implement OAuth 2.0 and JWT for all API endpoints",
          dueDate: addMonths(new Date(), 1).toISOString().split('T')[0],
          startDate: new Date().toISOString().split('T')[0],
          priority: "High",
          assignee: { name: "Jane Doe", initials: "JD" },
          status: "in-progress",
          epic: "Security",
          project: "API Refactoring",
          quarter: "Q2",
          isMilestone: false
        },
        {
          id: "task-2",
          title: "Dashboard Redesign",
          description: "Implement the new design system for the dashboard",
          dueDate: addMonths(new Date(), 2).toISOString().split('T')[0],
          startDate: addMonths(new Date(), 1).toISOString().split('T')[0],
          priority: "Medium",
          assignee: { name: "Mike Smith", initials: "MS" },
          status: "todo",
          epic: "User Experience",
          project: "UI Modernization",
          quarter: "Q2",
          isMilestone: false
        },
        {
          id: "task-3",
          title: "Mobile App Beta Launch",
          description: "Release mobile app to beta testers",
          dueDate: addMonths(new Date(), 3).toISOString().split('T')[0],
          priority: "Critical",
          assignee: { name: "Alex Lee", initials: "AL" },
          status: "backlog",
          epic: "Mobile",
          project: "App Development",
          quarter: "Q3",
          isMilestone: true
        },
        {
          id: "task-4",
          title: "Performance Optimization",
          description: "Optimize database queries and frontend loading times",
          dueDate: addMonths(new Date(), 0.5).toISOString().split('T')[0],
          startDate: addMonths(new Date(), -0.5).toISOString().split('T')[0],
          priority: "Medium",
          assignee: { name: "Sarah Johnson", initials: "SJ" },
          status: "in-progress",
          epic: "Infrastructure",
          project: "Performance",
          quarter: "Q1",
          isMilestone: false
        },
        {
          id: "task-5",
          title: "Q2 Release",
          description: "Official Q2 product release with new features",
          dueDate: addMonths(new Date(), 2).toISOString().split('T')[0],
          priority: "Critical",
          assignee: { name: "You", initials: "YO" },
          status: "todo",
          epic: "Product",
          project: "Release",
          quarter: "Q2",
          isMilestone: true
        },
      ]
      setFormattedTasks(demoTasks)
    }
  }, [tasks, mounted])

  // Group tasks by the selected category
  const groupedTasks = useMemo(() => {
    if (!mounted || formattedTasks.length === 0) return {}

    const initialGroups: GroupedTasks = {}

    // Filter tasks if filters are applied
    const filtered = filterBy.length > 0
      ? formattedTasks.filter(task => {
          if (filterBy.includes("milestones") && !task.isMilestone) return false
          if (filterBy.includes("high-priority") && task.priority !== "High" && task.priority !== "Critical") return false
          if (filterBy.includes("my-tasks") && task.assignee.name !== "You") return false
          return true
        })
      : formattedTasks

    // Group tasks
    filtered.forEach(task => {
      const groupKey = String(task[groupBy] || "Ungrouped")

      if (!initialGroups[groupKey]) {
        initialGroups[groupKey] = {
          title: groupKey,
          tasks: [],
          progress: 0,
          startDate: task.startDate || task.dueDate,
          endDate: task.dueDate
        }
      }

      initialGroups[groupKey].tasks.push(task)

      // Update date range for the group
      try {
        if (task.startDate && (!initialGroups[groupKey].startDate || new Date(task.startDate) < new Date(initialGroups[groupKey].startDate))) {
          initialGroups[groupKey].startDate = task.startDate
        }
        if (task.dueDate && (!initialGroups[groupKey].endDate || new Date(task.dueDate) > new Date(initialGroups[groupKey].endDate))) {
          initialGroups[groupKey].endDate = task.dueDate
        }
      } catch (error) {
        console.error("Date comparison error:", error)
      }
    })

    // Calculate progress for each group
    Object.keys(initialGroups).forEach(key => {
      const group = initialGroups[key]
      const totalTasks = group.tasks.length
      const completedTasks = group.tasks.filter((task: any) => task.status === "done").length
      group.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    })

    return initialGroups
  }, [formattedTasks, groupBy, filterBy, mounted])

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      return prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    })
  }

  // Toggle filter
  const toggleFilter = (filter: string) => {
    setFilterBy(prev => {
      return prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    })
  }

  // Determine quarter based on date
  function determineQuarter(dateString?: string): "Q1" | "Q2" | "Q3" | "Q4" {
    if (!dateString) return "Q1"

    try {
      const date = new Date(dateString)
      const month = date.getMonth()

      if (month < 3) return "Q1"
      if (month < 6) return "Q2"
      if (month < 9) return "Q3"
      return "Q4"
    } catch (error) {
      return "Q1"
    }
  }

  // Get color for priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-destructive"
      case "High":
        return "text-orange-500"
      case "Medium":
        return "text-yellow-500"
      case "Low":
        return "text-green-500"
      default:
        return ""
    }
  }

  // Get badge variant for status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "done":
        return "default"
      case "in-progress":
        return "secondary"
      case "todo":
        return "outline"
      case "backlog":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Get color for progress bar
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 50) return "bg-yellow-500"
    return "bg-orange-500"
  }

  // Show loading state when not mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="animate-pulse h-10 w-[150px] bg-muted rounded"></div>
          <div className="animate-pulse h-10 w-32 bg-muted rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg">
              <div className="p-4 animate-pulse flex justify-between">
                <div className="h-6 w-32 bg-muted rounded"></div>
                <div className="h-6 w-48 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="epic">Group by Epic</SelectItem>
              <SelectItem value="project">Group by Project</SelectItem>
              <SelectItem value="quarter">Group by Quarter</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Badge
              variant={filterBy.includes("milestones") ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleFilter("milestones")}
            >
              <Milestone className="h-3 w-3 mr-1" />
              Milestones
            </Badge>

            <Badge
              variant={filterBy.includes("high-priority") ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleFilter("high-priority")}
            >
              <Flag className="h-3 w-3 mr-1" />
              High Priority
            </Badge>

            <Badge
              variant={filterBy.includes("my-tasks") ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleFilter("my-tasks")}
            >
              <Users className="h-3 w-3 mr-1" />
              My Tasks
            </Badge>
          </div>
        </div>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      <ScrollArea className="h-[650px] pr-4">
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([groupId, group]) => (
            <Collapsible
              key={groupId}
              open={expandedGroups.includes(groupId)}
              onOpenChange={() => toggleGroup(groupId)}
              className="border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {expandedGroups.includes(groupId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <h3 className="font-semibold">{group.title}</h3>
                    <Badge variant="outline" className="ml-2">{group.tasks.length}</Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    {group.startDate && group.endDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        <span>
                          {format(new Date(group.startDate), "MMM d")} - {format(new Date(group.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 w-48">
                      <Progress value={group.progress} className={cn("h-2", getProgressColor(group.progress))} />
                      <span className="text-sm font-medium">{group.progress}%</span>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-4 pt-0 space-y-3">
                  {group.tasks.map((task: any) => (
                    <Card key={task.id} className={cn(
                      "border-l-4 transition-all hover:shadow-md",
                      task.isMilestone ? "border-l-purple-500" :
                      task.priority === "Critical" ? "border-l-red-500" :
                      task.priority === "High" ? "border-l-orange-500" :
                      task.priority === "Medium" ? "border-l-yellow-500" :
                      "border-l-green-500"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {task.isMilestone && (
                                <Badge variant="secondary" className="rounded-full bg-purple-100 text-purple-800 hover:bg-purple-100">
                                  <Milestone className="h-3 w-3 mr-1" />
                                  Milestone
                                </Badge>
                              )}
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge variant={getStatusVariant(task.status)} className="ml-2">
                                <span className="whitespace-nowrap">
                                {task.status === "in-progress" ? "In Progress" :
                                 task.status === "todo" ? "To Do" :
                                 task.status === "backlog" ? "Backlog" : "Done"}
                                </span>
                              </Badge>
                            </div>

                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{task.assignee.name}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                              </div>

                              <div className={cn("flex items-center gap-1", getPriorityColor(task.priority))}>
                                <Flag className="h-3 w-3" />
                                <span>{task.priority}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Also export a default version to support dynamic imports
export default Roadmap;
