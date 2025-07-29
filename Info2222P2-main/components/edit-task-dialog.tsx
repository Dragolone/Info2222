"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format, parseISO, isValid } from "date-fns"
import { Task } from "@/app/store"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdate
}: EditTaskDialogProps) {
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const { toast } = useToast()

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setEditedTask({ ...task })
    }
  }, [task])

  const handleSubmit = () => {
    if (!task || !editedTask.title) {
      toast({
        title: "Missing information",
        description: "Please provide a task title",
        variant: "destructive",
      })
      return
    }

    if (onTaskUpdate) {
      onTaskUpdate(task.id, editedTask)
    }

    onOpenChange(false)

    toast({
      title: "Task updated",
      description: "Your task has been updated successfully",
    })
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details of your task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-title" className="text-right">
              Title
            </Label>
            <Input
              id="edit-title"
              value={editedTask.title || ''}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">
              Status
            </Label>
            <Select
              value={editedTask.status}
              onValueChange={(value) => setEditedTask({...editedTask, status: value as Task["status"]})}
            >
              <SelectTrigger id="edit-status" className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-priority" className="text-right">
              Priority
            </Label>
            <Select
              value={editedTask.priority}
              onValueChange={(value) => setEditedTask({...editedTask, priority: value as Task["priority"]})}
            >
              <SelectTrigger id="edit-priority" className="col-span-3">
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
            <Label htmlFor="edit-dueDate" className="text-right">
              Due Date
            </Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={editedTask.dueDate || ''}
              onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-assignee" className="text-right">
              Assignee
            </Label>
            <Input
              id="edit-assignee"
              value={editedTask.assignee?.name || 'Unassigned'}
              disabled
              className="col-span-3 bg-muted/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Update Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
