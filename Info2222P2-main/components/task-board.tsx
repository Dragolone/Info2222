"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/task-card"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PlusCircle, Filter, BarChart } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { CalendarDays, Clock, Users, CheckCircle2, AlertCircle } from "lucide-react"

// Create useIsomorphicLayoutEffect hook
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "Low" | "Medium" | "High" | "Critical"
  assignee: {
    name: string
    avatar: string
    initials: string
  }
  status: "todo" | "in-progress" | "done" | "backlog"
}

interface TaskBoardProps {
  onTaskUpdate?: (tasks: Task[]) => void
  filters?: string[]
  sort?: string
  tasks?: Task[]
  viewMode?: "board" | "table" | "list"
}

export function TaskBoard({ onTaskUpdate, filters = [], sort = "priority", tasks = [], viewMode = "board" }: TaskBoardProps) {
  const initialTasksRef = useRef(false);
  const taskGroupsRef = useRef<{
    todo: Task[]
    "in-progress": Task[]
    done: Task[]
    backlog: Task[]
  }>({
    todo: [
      {
        id: "task-1",
        title: "API documentation",
        description: "Create comprehensive documentation for the new API endpoints",
        dueDate: "Mar 30, 2025",
        priority: "Medium",
        assignee: {
          name: "Mike Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MS",
        },
        status: "todo",
      },
      {
        id: "task-2",
        title: "Fix login issues",
        description: "Address the authentication bugs reported by QA team",
        dueDate: "Mar 26, 2025",
        priority: "Critical",
        assignee: {
          name: "Alex Lee",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "AL",
        },
        status: "todo",
      },
      {
        id: "task-3",
        title: "Update privacy policy",
        description: "Review and update the privacy policy to comply with new regulations",
        dueDate: "Apr 10, 2025",
        priority: "Low",
        assignee: {
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "SJ",
        },
        status: "todo",
      },
    ],
    "in-progress": [
      {
        id: "task-4",
        title: "Update user dashboard",
        description: "Implement new analytics widgets and improve mobile responsiveness",
        dueDate: "Mar 28, 2025",
        priority: "High",
        assignee: {
          name: "Jane Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
        },
        status: "in-progress",
      },
      {
        id: "task-5",
        title: "Create onboarding flow",
        description: "Design and implement a new user onboarding experience",
        dueDate: "Apr 2, 2025",
        priority: "Medium",
        assignee: {
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "SJ",
        },
        status: "in-progress",
      },
      {
        id: "task-6",
        title: "Refactor authentication service",
        description: "Improve code quality and performance of the auth service",
        dueDate: "Apr 5, 2025",
        priority: "Medium",
        assignee: {
          name: "Mike Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MS",
        },
        status: "in-progress",
      },
    ],
    done: [
      {
        id: "task-7",
        title: "Implement analytics dashboard",
        description: "Create a dashboard to visualize user engagement metrics",
        dueDate: "Mar 20, 2025",
        priority: "High",
        assignee: {
          name: "Jane Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
        },
        status: "done",
      },
      {
        id: "task-8",
        title: "Set up CI/CD pipeline",
        description: "Configure automated testing and deployment workflow",
        dueDate: "Mar 15, 2025",
        priority: "Medium",
        assignee: {
          name: "Mike Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MS",
        },
        status: "done",
      },
    ],
    backlog: [
      {
        id: "task-9",
        title: "Design new landing page",
        description: "Create mockups for the new marketing landing page",
        dueDate: "TBD",
        priority: "Medium",
        assignee: {
          name: "Alex Lee",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "AL",
        },
        status: "backlog",
      },
      {
        id: "task-10",
        title: "Implement dark mode",
        description: "Add dark mode support across the entire application",
        dueDate: "TBD",
        priority: "Low",
        assignee: {
          name: "Jane Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
        },
        status: "backlog",
      },
      {
        id: "task-11",
        title: "Optimize database queries",
        description: "Improve performance of slow database operations",
        dueDate: "TBD",
        priority: "Medium",
        assignee: {
          name: "Mike Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MS",
        },
        status: "backlog",
      },
    ],
  });

  const [taskGroups, setTaskGroups] = useState(taskGroupsRef.current);

  // Effect to update task groups when tasks prop changes
  useEffect(() => {
    if (tasks && tasks.length > 0 && !initialTasksRef.current) {
      initialTasksRef.current = true;

      // Group the tasks by status
      const updatedTaskGroups = {
        todo: [] as Task[],
        "in-progress": [] as Task[],
        done: [] as Task[],
        backlog: [] as Task[],
      }

      tasks.forEach(task => {
        if (updatedTaskGroups[task.status]) {
          updatedTaskGroups[task.status].push(task)
        }
      })

      setTaskGroups(updatedTaskGroups)
      taskGroupsRef.current = updatedTaskGroups;
    }
  }, [tasks]);

  const { toast } = useToast()
  const [showProgressSummary, setShowProgressSummary] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Use effect for client-side only code
  useEffect(() => {
    setMounted(true)

    // Send initial task update once on mount
    if (onTaskUpdate) {
      const allTasks = [
        ...taskGroupsRef.current.todo,
        ...taskGroupsRef.current["in-progress"],
        ...taskGroupsRef.current.done,
        ...taskGroupsRef.current.backlog
      ];
      onTaskUpdate(allTasks);
    }
  }, [onTaskUpdate]);

  // Use an effect to notify parent of task updates without causing render loops
  useEffect(() => {
    if (onTaskUpdate && mounted) {
      taskGroupsRef.current = taskGroups;
      const allTasks = [...taskGroups.todo, ...taskGroups["in-progress"], ...taskGroups.done, ...taskGroups.backlog];
      onTaskUpdate(allTasks);
    }
  }, [taskGroups, onTaskUpdate, mounted]);

  // Apply filtering based on the current filters
  const getFilteredTasks = (tasks: Task[]) => {
    if (filters.length === 0) return tasks

    const today = new Date()

    return tasks.filter(task => {
      return filters.some(filter => {
        switch (filter) {
          case "my":
            return task.assignee.name === "You"
          case "unassigned":
            return task.assignee.name === "Unassigned"
          case "completed":
            return task.status === "done"
          case "overdue":
            if (task.status === "done") return false
            if (task.dueDate === "TBD") return false
            const dueDate = new Date(task.dueDate)
            return dueDate < today
          default:
            return false
        }
      })
    })
  }

  // Apply sorting based on the current sort option
  const getSortedTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      if (sort === "priority") {
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      if (sort === "dueDate") {
        if (a.dueDate === "TBD") return 1
        if (b.dueDate === "TBD") return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }

      if (sort === "title") {
        return a.title.localeCompare(b.title)
      }

      if (sort === "assignee") {
        return a.assignee.name.localeCompare(b.assignee.name)
      }

      return 0
    })
  }

  const onDragStart = (result: any) => {
    setIsDragging(true)
    setDraggedTaskId(result.draggableId)

    // Add a class to the body to prevent scrolling while dragging
    document.body.classList.add('dragging-active')

    // Add drag start animation
    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${result.draggableId}"]`)
    if (draggedElement) {
      draggedElement.classList.add('scale-105', 'shadow-lg', 'z-50')
    }

    // Sound effect is optional and handled silently
    try {
      const audio = new Audio('/sounds/drag-start.mp3')
      audio.volume = 0.1
      audio.play().catch(() => {})
    } catch (error) {
      // Ignore errors
    }
  }

  const onDragEnd = (result: DropResult) => {
    setIsDragging(false)
    setDraggedTaskId(null)

    // Remove the class from the body
    document.body.classList.remove('dragging-active')

    // Remove drag animation classes
    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${result.draggableId}"]`)
    if (draggedElement) {
      draggedElement.classList.remove('scale-105', 'shadow-lg', 'z-50')
    }

    const { source, destination } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Get the task that was dragged
    const sourceColumn = source.droppableId as keyof typeof taskGroups
    const destColumn = destination.droppableId as keyof typeof taskGroups

    const sourceItems = [...taskGroups[sourceColumn]]
    const destItems = sourceColumn === destColumn ? sourceItems : [...taskGroups[destColumn]]

    // Remove from source
    const [removed] = sourceItems.splice(source.index, 1)

    // Update task status to match new column
    const updatedTask = {
      ...removed,
      status: destColumn,
    }

    // Add to destination
    destItems.splice(destination.index, 0, updatedTask)

    // Update state with animation
    setTaskGroups(prev => {
      const newGroups = {
        ...prev,
        [sourceColumn]: sourceItems,
        [destColumn]: destItems,
      }

      // Notify parent of the update
      if (onTaskUpdate) {
        const allTasks = [
          ...newGroups.todo,
          ...newGroups["in-progress"],
          ...newGroups.done,
          ...newGroups.backlog
        ]
        onTaskUpdate(allTasks)
      }

      return newGroups
    })

    // Show toast notification
    if (sourceColumn !== destColumn) {
      // Play drop sound
      try {
        const audio = new Audio('/sounds/drop-success.mp3')
        audio.volume = 0.15
        audio.play().catch(() => {})
      } catch (error) {
        // Ignore errors
      }

      toast({
        title: "Task moved",
        description: `"${updatedTask.title}" moved to ${getColumnTitle(destColumn)}`,
      })
    }
  }

  // Calculate progress statistics
  const filteredTaskGroups = {
    todo: getFilteredTasks(taskGroups.todo),
    "in-progress": getFilteredTasks(taskGroups["in-progress"]),
    done: getFilteredTasks(taskGroups.done),
    backlog: getFilteredTasks(taskGroups.backlog),
  }

  const sortedTaskGroups = {
    todo: getSortedTasks(filteredTaskGroups.todo),
    "in-progress": getSortedTasks(filteredTaskGroups["in-progress"]),
    done: getSortedTasks(filteredTaskGroups.done),
    backlog: getSortedTasks(filteredTaskGroups.backlog),
  }

  const allTasks = [...taskGroups.todo, ...taskGroups["in-progress"], ...taskGroups.done, ...taskGroups.backlog]
  const totalTasks = allTasks.length
  const completedTasks = taskGroups.done.length
  const inProgressTasks = taskGroups["in-progress"].length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0

  const handleTaskClick = (task: Task) => {
    setCurrentTask(task)
    setShowTaskDetail(true)
  }

  const updateTask = (updatedTask: Task) => {
    if (!currentTask) return

    const status = currentTask.status
    const taskIndex = taskGroups[status].findIndex(t => t.id === currentTask.id)

    if (taskIndex === -1) return

    const newTaskList = {...taskGroups}

    if (status === updatedTask.status) {
      // Update in the same column
      newTaskList[status][taskIndex] = updatedTask
    } else {
      // Move to a different column
      newTaskList[status].splice(taskIndex, 1)
      newTaskList[updatedTask.status].push(updatedTask)
    }

    setTaskGroups(newTaskList)
    setCurrentTask(updatedTask)

    toast({
      title: "Task updated",
      description: "Your changes have been saved"
    })
  }

  const getColumnTitle = (columnId: string) => {
    switch (columnId) {
      case "backlog":
        return "Backlog"
      case "todo":
        return "To Do"
      case "in-progress":
        return "In Progress"
      case "done":
        return "Done"
      default:
        return columnId.charAt(0).toUpperCase() + columnId.slice(1)
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>
      case "High":
        return <Badge variant="destructive">High</Badge>
      case "Medium":
        return <Badge variant="secondary">Medium</Badge>
      case "Low":
        return <Badge variant="outline">Low</Badge>
      default:
        return null
    }
  }

  // Render task card
  const renderTaskCard = (task: Task) => (
    <Card
      key={task.id}
      className={cn(
        "task-card relative group cursor-pointer transition-all duration-200 hover:shadow-md",
        isDragging && draggedTaskId === task.id && "opacity-50"
      )}
      onClick={() => setEditingTask(task)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-medium leading-none">{task.title}</CardTitle>
          {getPriorityBadge(task.priority)}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{task.assignee.name}</span>
            </div>
            {task.dueDate !== "TBD" && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>{format(new Date(task.dueDate), "MMM d")}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Render board view
  const renderBoardView = () => (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(sortedTaskGroups).map(([columnId, columnTasks]) => {
          const filteredTasks = getFilteredTasks(columnTasks)
          const sortedTasks = getSortedTasks(filteredTasks)

          return (
            <div key={columnId} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{getColumnTitle(columnId)}</h3>
                <Badge variant="outline" className="ml-2">
                  {sortedTasks.length}
                </Badge>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors",
                      snapshot.isDraggingOver ? "bg-primary/5 border-primary" : "border-muted-foreground/20"
                    )}
                  >
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {sortedTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "transition-transform",
                                  snapshot.isDragging && "scale-105 shadow-lg z-50"
                                )}
                              >
                                {renderTaskCard(task)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )

  // Render table view
  const renderTableView = () => (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Priority</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assignee</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td className="p-4 align-middle">
                  {getPriorityBadge(task.priority)}
                </td>
                <td className="p-4 align-middle font-medium">{task.title}</td>
                <td className="p-4 align-middle">
                  <Badge variant="outline" className="whitespace-nowrap">{getColumnTitle(task.status)}</Badge>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                    </Avatar>
                    <span>{task.assignee.name}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  {task.dueDate === "TBD" ? (
                    <span className="text-muted-foreground">TBD</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      <span>{format(new Date(task.dueDate), "MMM d")}</span>
                    </div>
                  )}
                </td>
                <td className="p-4 align-middle">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTask(task)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="cursor-pointer" onClick={() => setEditingTask(task)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{task.title}</h3>
                  {getPriorityBadge(task.priority)}
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
                    <span>{task.dueDate === "TBD" ? "TBD" : format(new Date(task.dueDate), "MMM d")}</span>
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap">{getColumnTitle(task.status)}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render the appropriate view
  const renderView = () => {
    switch (viewMode) {
      case "board":
        return renderBoardView()
      case "table":
        return renderTableView()
      case "list":
        return renderListView()
      default:
        return renderBoardView()
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-3 items-center">
            <Button variant="outline" size="sm" onClick={() => setShowProgressSummary(!showProgressSummary)}>
              <BarChart className="mr-2 h-4 w-4" />
              {showProgressSummary ? "Hide" : "Show"} Progress
            </Button>

            <div className="text-sm text-muted-foreground bg-muted/40 rounded-md px-4 py-1.5">
              <span className="font-medium">{completionPercentage}%</span> completed • <span className="font-medium">{inProgressPercentage}%</span> in progress
            </div>
          </div>
        </div>

        {/* Show a message when a filter is active */}
        {filters.length > 0 && (
          <div className="bg-muted/40 rounded-md px-4 py-3 text-sm flex items-center justify-between">
            <span>
              <strong>Filter active:</strong> Showing {filters.map(filter => {
                if (filter === "my") return "your"
                if (filter === "unassigned") return "unassigned"
                if (filter === "completed") return "completed"
                if (filter === "overdue") return "overdue"
                return ""
              }).join(", ")} tasks
            </span>
            <Button variant="ghost" size="sm" onClick={() => onTaskUpdate && onTaskUpdate(allTasks)}>
              Clear Filter
            </Button>
          </div>
        )}

        {showProgressSummary && (
          <Card className="mb-8 overflow-hidden">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-base font-medium">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">Overall Completion</div>
                    <div className="text-sm font-medium">{completionPercentage}%</div>
                  </div>
                  <Progress value={completionPercentage} className="h-2.5" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium whitespace-nowrap">In Progress</div>
                    <div className="text-sm font-medium">{inProgressPercentage}%</div>
                  </div>
                  <Progress value={inProgressPercentage} className="h-2.5" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center pt-4">
                  <div className="p-4 rounded-lg bg-background border">
                    <div className="text-xs text-muted-foreground">Backlog</div>
                    <div className="text-2xl font-semibold mt-1">{taskGroups.backlog.length}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <div className="text-xs text-muted-foreground">To Do</div>
                    <div className="text-2xl font-semibold mt-1">{taskGroups.todo.length}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">In Progress</div>
                    <div className="text-2xl font-semibold mt-1">{taskGroups["in-progress"].length}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <div className="text-xs text-muted-foreground">Done</div>
                    <div className="text-2xl font-semibold mt-1">{taskGroups.done.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {renderView()}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
        <DialogContent className="sm:max-w-[600px]">
          {currentTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Task Details</span>
                    <Badge variant="outline">{getColumnTitle(currentTask.status)}</Badge>
                  </div>
                  <Badge variant={
                    currentTask.priority === "Critical" ? "destructive" :
                    currentTask.priority === "High" ? "default" :
                    currentTask.priority === "Medium" ? "secondary" : "outline"
                  }>
                    {currentTask.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  View and edit task details
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{currentTask.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <div className="text-sm font-medium mb-2">Assignee</div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {currentTask.assignee.initials}
                      </div>
                      <span>{currentTask.assignee.name}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Due Date</div>
                    <div>{currentTask.dueDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-2">
                  <div className="text-sm font-medium">Status</div>
                  <div className="grid grid-cols-4 gap-2">
                    {["backlog", "todo", "in-progress", "done"].map((status) => (
                      <Button
                        key={status}
                        variant={currentTask.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (currentTask.status !== status) {
                            updateTask({...currentTask, status: status as Task["status"]})
                          }
                        }}
                      >
                        {getColumnTitle(status)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="text-sm font-medium">Add Comment</div>
                  <Textarea placeholder="Write a comment..." className="resize-none h-24" />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setShowTaskDetail(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View and edit task information
            </DialogDescription>
          </DialogHeader>

          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{editingTask.title}</h3>
                {getPriorityBadge(editingTask.priority)}
              </div>

              {editingTask.description && (
                <p className="text-sm text-muted-foreground">{editingTask.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Assignee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{editingTask.assignee.initials}</AvatarFallback>
                    </Avatar>
                    <span>{editingTask.assignee.name}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Due Date</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingTask.dueDate === "TBD" ? (
                      <span className="text-muted-foreground">TBD</span>
                    ) : (
                      <span>{format(new Date(editingTask.dueDate), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Status</span>
                </div>
                <Badge variant="outline">{getColumnTitle(editingTask.status)}</Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Close
            </Button>
            <Button>Edit Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .draggable-task {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .draggable-task.dragging {
          transform: scale(1.05);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
        }

        .droppable-column.drag-over {
          background-color: rgba(var(--primary-rgb), 0.05);
          border-color: hsl(var(--primary));
          transition: all 0.2s ease;
        }

        .droppable-column {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        @keyframes pulse-border {
          0% { border-color: hsl(var(--border)); }
          50% { border-color: hsl(var(--primary)); }
          100% { border-color: hsl(var(--border)); }
        }

        .column-highlight {
          animation: pulse-border 2s infinite;
        }

        .task-card {
          cursor: grab;
        }

        .task-card:active {
          cursor: grabbing;
        }
      `}</style>
    </>
  )
}

// Helper function
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}

