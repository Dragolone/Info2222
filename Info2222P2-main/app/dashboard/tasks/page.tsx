"use client"

import { useEffect, useState, Suspense } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart as BarChartIcon,
  FileText,
  Filter,
  LayoutGrid,
  ListChecks,
  Map,
  MoreHorizontal,
  PieChart,
  Settings,
  SlidersHorizontal,
  Star,
  StarOff,
  Table as TableIcon,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore, Task } from "@/app/store"
import { EditTaskDialog } from "@/components/edit-task-dialog"

// Use dynamic imports to ensure proper hydration - KanbanBoard already has DragDropContext integrated
const KanbanWrapper = dynamic(() => import("@/components/kanban-wrapper"), {
  ssr: false,
  loading: () => <ComponentLoader text="Loading board..." />
})

// Load TaskTable without DnD capabilities
const TaskTable = dynamic(() => import("@/components/task-table"), {
  ssr: false,
  loading: () => <ComponentLoader text="Loading table..." />
})

const Roadmap = dynamic(() => import("@/components/roadmap"), {
  ssr: false,
  loading: () => <ComponentLoader text="Loading roadmap..." />
})

const Reports = dynamic(() => import("@/components/reports"), {
  ssr: false,
  loading: () => <ComponentLoader text="Loading reports..." />
})

// Loading component
function ComponentLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<string>("board")
  const [showProgressSummary, setShowProgressSummary] = useState(false)
  const [favoriteActions, setFavoriteActions] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "todo",
    priority: "Medium"
  })
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'list' | 'carousel'>('carousel')

  // Get data and actions from store
  const tasks = useTaskStore(state => state.tasks)
  const addTask = useTaskStore(state => state.addTask)
  const updateTask = useTaskStore(state => state.updateTask)

  // Set mounted state and initial tab on client side only
  useEffect(() => {
    setMounted(true)
    setActiveTab("board")
  }, [])

  // Load view preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('kanban-view');
      if (savedMode === 'list' || savedMode === 'carousel') {
        setViewMode(savedMode as 'list' | 'carousel');
      }
    }
  }, []);

  // Save view preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanban-view', viewMode);
    }
  }, [viewMode]);

  // Handle adding a new task
  const handleAddTask = (status: string) => {
    setNewTask({
      title: "",
      description: "",
      status: status as Task["status"],
      priority: "Medium"
    })
    setNewTaskDialogOpen(true)
  }

  // Save new task
  const saveNewTask = () => {
    if (!newTask.title) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive"
      })
      return
    }

    const taskToAdd: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || "",
      status: newTask.status as Task["status"],
      priority: newTask.priority as Task["priority"],
      dueDate: newTask.dueDate,
      assignee: newTask.assignee || {
        name: "Unassigned",
        initials: "UN"
      }
    }

    // Add task to store
    addTask(taskToAdd)

    setNewTaskDialogOpen(false)
    toast({
      title: "Task created",
      description: `"${taskToAdd.title}" has been created`,
    })
  }

  // Handle task status update
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    // Update task in store
    updateTask(taskId, updates)

    toast({
      title: "Task updated",
      description: `Task has been updated successfully`,
    })
  }

  // Toggle favorite action
  const toggleFavorite = (actionId: string) => {
    if (favoriteActions.includes(actionId)) {
      setFavoriteActions(favoriteActions.filter(id => id !== actionId))
    } else {
      setFavoriteActions([...favoriteActions, actionId])
    }
  }

  // Toggle for List/Carousel view at the top of tabs
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'carousel' : 'list');

    // Force a rerender of the kanban component if we're on the board tab
    if (activeTab === 'board') {
      setActiveTab("");
      setTimeout(() => setActiveTab('board'), 10);
    }
  };

  // Handle editing a task
  const handleTaskEdit = (task: Task) => {
    setCurrentTask(task)
    setEditTaskDialogOpen(true)
  }

  // Return loading state if not mounted
  if (!mounted) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center animate-pulse">
          <div className="h-10 w-40 bg-muted rounded"></div>
          <div className="h-10 w-32 bg-muted rounded"></div>
        </div>
        <div className="h-[calc(100vh-200px)] bg-muted/20 rounded-lg border border-dashed"></div>
      </div>
    )
  }

  // Render component based on active tab
  const renderTabContent = () => {
    if (!activeTab) return <ComponentLoader text="Initializing..." />

    switch (activeTab) {
      case "board":
        return (
          <Suspense fallback={<ComponentLoader text="Loading board..." />}>
            <KanbanWrapper onTaskAdd={handleAddTask} />
          </Suspense>
        )
      case "table":
        return (
          <Suspense fallback={<ComponentLoader text="Loading table..." />}>
            <TaskTable
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskEdit={handleTaskEdit}
            />
          </Suspense>
        )
      case "roadmap":
        return (
          <Suspense fallback={<ComponentLoader text="Loading roadmap..." />}>
            <Roadmap tasks={tasks} />
          </Suspense>
        )
      case "reports":
        return (
          <Suspense fallback={<ComponentLoader text="Loading reports..." />}>
            <Reports tasks={tasks} />
          </Suspense>
        )
      default:
        return (
          <Suspense fallback={<ComponentLoader text="Loading board..." />}>
            <KanbanWrapper onTaskAdd={handleAddTask} />
          </Suspense>
        )
    }
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">Manage and track your team's tasks</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Favorite actions */}
            {favoriteActions.length > 0 && (
              <div className="flex items-center mr-2 border-r pr-2">
                {favoriteActions.map(action => (
                  <TooltipProvider key={action}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          {action === "settings" && <Settings className="h-4 w-4" />}
                          {action === "filter" && <Filter className="h-4 w-4" />}
                          {action === "chart" && <BarChartIcon className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-9 w-9 ${favoriteActions.includes("filter") ? "bg-primary/10" : ""}`}
                    onClick={() => toggleFavorite("filter")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {favoriteActions.includes("filter") ? "Remove from favorites" : "Add to favorites"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="outline" size="sm" className="h-9" onClick={() => handleAddTask("todo")}>
              Add Task
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowProgressSummary(!showProgressSummary)}>
                  {showProgressSummary ? "Hide" : "Show"} Progress Summary
                </DropdownMenuItem>
                <DropdownMenuItem>Import Tasks</DropdownMenuItem>
                <DropdownMenuItem>Export Tasks</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFavorite("settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                  {favoriteActions.includes("settings") && (
                    <Star className="ml-auto h-4 w-4 text-yellow-500" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tab bar */}
        <Tabs defaultValue="board" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="board" className="flex items-center">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center">
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center">
              <Map className="h-4 w-4 mr-2" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Loading indicator */}
          {loading && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 px-3 py-1 rounded-full z-50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Saving changes...</span>
            </div>
          )}

          {/* View Type tabs - List and Carousel below main tabs */}
          {activeTab === 'board' && (
            <div className="mb-6 sm:hidden block">
              <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => {
                setViewMode(value as 'list' | 'carousel');
                // Force a rerender of the kanban component
                setActiveTab("");
                setTimeout(() => setActiveTab('board'), 10);
              }} className="w-full">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="list" className="flex items-center flex-1 sm:flex-initial">
                    <ListChecks className="h-4 w-4 mr-2" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="carousel" className="flex items-center flex-1 sm:flex-initial">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Carousel
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Tab content */}
          {renderTabContent()}
        </Tabs>
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Enter the details for the new task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-title" className="text-right">
                Title
              </Label>
              <Input
                id="new-title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="new-description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-priority" className="text-right">
                Priority
              </Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({...newTask, priority: value as Task["priority"]})}
              >
                <SelectTrigger id="new-priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-dueDate" className="text-right">
                Due Date
              </Label>
              <Input
                id="new-dueDate"
                type="date"
                value={newTask.dueDate || ""}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        task={currentTask}
        onTaskUpdate={handleTaskUpdate}
      />
    </>
  )
}

