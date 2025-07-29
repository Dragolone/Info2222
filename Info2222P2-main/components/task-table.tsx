"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO, isValid } from "date-fns"

interface TaskTableProps {
  tasks: any[]
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskEdit?: (task: any) => void
}

export default function TaskTable({ tasks = [], onTaskUpdate, onTaskEdit }: TaskTableProps) {
  const [mounted, setMounted] = useState(false)
  const [displayTasks, setDisplayTasks] = useState<any[]>([])
  const [sortField, setSortField] = useState<string>("priority")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Set mounted state and initialize tasks
  useEffect(() => {
    setMounted(true)
    setDisplayTasks(sortTasks(tasks, sortField, sortDirection))
  }, [tasks])

  // Sort tasks when sort parameters change
  useEffect(() => {
    if (mounted) {
      setDisplayTasks(sortTasks(tasks, sortField, sortDirection))
    }
  }, [sortField, sortDirection, mounted, tasks])

  // Sort tasks based on field and direction
  const sortTasks = (tasksToSort: any[], field: string, direction: "asc" | "desc") => {
    return [...tasksToSort].sort((a, b) => {
      let valueA = a[field]
      let valueB = b[field]

      // Special handling for date fields
      if (field === "dueDate") {
        // Handle missing dates
        if (!valueA) return direction === "asc" ? 1 : -1
        if (!valueB) return direction === "asc" ? -1 : 1

        try {
          // Try to parse dates
          const dateA = parseISO(valueA)
          const dateB = parseISO(valueB)

          if (isValid(dateA) && isValid(dateB)) {
            return direction === "asc"
              ? Number(dateA) - Number(dateB)
              : Number(dateB) - Number(dateA)
          }
        } catch (error) {
          // Fall back to string comparison if date parsing fails
          return direction === "asc"
            ? String(valueA).localeCompare(String(valueB))
            : String(valueB).localeCompare(String(valueA))
        }
      }

      // Handle priority sorting
      if (field === "priority") {
        const priorityValues = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 }
        valueA = priorityValues[a.priority as keyof typeof priorityValues] || 0
        valueB = priorityValues[b.priority as keyof typeof priorityValues] || 0
      }

      // Handle status sorting
      if (field === "status") {
        const statusValues = { "backlog": 1, "todo": 2, "in-progress": 3, "done": 4 }
        valueA = statusValues[a.status as keyof typeof statusValues] || 0
        valueB = statusValues[b.status as keyof typeof statusValues] || 0
      }

      // Handle assignee sorting (assignee is an object with a name property)
      if (field === "assignee") {
        valueA = a.assignee?.name || "Unassigned"
        valueB = b.assignee?.name || "Unassigned"
      }

      // Default comparison for strings or numbers
      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      } else {
        return direction === "asc"
          ? Number(valueA) - Number(valueB)
          : Number(valueB) - Number(valueA)
      }
    })
  }

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to desc
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Get sort icon based on field and current sort
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    return sortDirection === "asc"
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  // Get status icon based on task status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "todo":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "backlog":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "in-progress":
        return "In Progress"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-500 bg-red-100 dark:bg-red-950/50"
      case "High":
        return "text-orange-500 bg-orange-100 dark:bg-orange-950/50"
      case "Medium":
        return "text-blue-500 bg-blue-100 dark:bg-blue-950/50"
      case "Low":
        return "text-green-500 bg-green-100 dark:bg-green-950/50"
      default:
        return "text-gray-500 bg-gray-100 dark:bg-gray-800"
    }
  }

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: string) => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: newStatus })
    }
  }

  // Return loading state if not mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("title")} className="cursor-pointer">
              <div className="flex items-center">
                Task {getSortIcon("title")}
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
              <div className="flex items-center">
                Status {getSortIcon("status")}
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("priority")} className="cursor-pointer">
              <div className="flex items-center">
                Priority {getSortIcon("priority")}
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("assignee")} className="cursor-pointer">
              <div className="flex items-center">
                Assignee {getSortIcon("assignee")}
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("dueDate")} className="cursor-pointer">
              <div className="flex items-center">
                Due Date {getSortIcon("dueDate")}
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Select
                  value={task.status}
                  onValueChange={(value) => handleStatusChange(task.id, value)}
                >
                  <SelectTrigger className="w-[160px]">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="whitespace-nowrap">{formatStatus(task.status)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <span>Backlog</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="todo">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Todo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="whitespace-nowrap">In Progress</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="done">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Done</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>{task.assignee?.name || "Unassigned"}</TableCell>
              <TableCell>
                {task.dueDate ? (
                  (() => {
                    try {
                      const date = parseISO(task.dueDate)
                      return isValid(date) ? format(date, 'MMM d, yyyy') : task.dueDate
                    } catch (e) {
                      return task.dueDate
                    }
                  })()
                ) : (
                  "No due date"
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onTaskEdit && onTaskEdit(task)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
