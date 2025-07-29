"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Share2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TaskCard } from "@/components/task-card"
import { useTaskStore, Task } from "@/app/store"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import type { DropResult, DragStart, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from "react-beautiful-dnd"

// Static content for loading state
const KanbanPlaceholder = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
    {["Backlog", "To Do", "In Progress", "Done"].map((column, index) => (
      <div key={index} className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{column}</h3>
          <div className="bg-muted rounded-full px-2.5 py-0.5 text-sm text-muted-foreground animate-pulse">
            &nbsp;&nbsp;&nbsp;
          </div>
        </div>
        <div className="bg-card/50 border border-border min-h-[200px] rounded-lg p-2">
          {[1, 2].map(item => (
            <div key={item} className="mb-3 bg-card border rounded-md p-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
              <div className="flex justify-between">
                <div className="h-5 bg-muted rounded w-1/4"></div>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

interface KanbanBoardProps {
  onTaskAdd?: (status: string) => void;
}

function KanbanBoard({ onTaskAdd }: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  // Get data and actions from store
  const tasks = useTaskStore(state => state.tasks)
  const columns = useTaskStore(state => state.columns)
  const columnOrder = useTaskStore(state => state.columnOrder)
  const updateTask = useTaskStore(state => state.updateTask)
  const deleteTask = useTaskStore(state => state.deleteTask)
  const moveTask = useTaskStore(state => state.moveTask)
  const addTask = useTaskStore(state => state.addTask)

  // Set mounted state
  useEffect(() => {
    setMounted(true)

    // Add CSS class to body when component mounts
    document.body.classList.add('dnd-enabled');

    // Clean up function
    return () => {
      document.body.classList.remove('dnd-enabled');
    };
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((result: DragStart) => {
    setIsDragging(true)
    // Add a class to the body for visual feedback
    document.body.classList.add('dragging');
    // Change cursor explicitly
    document.body.style.cursor = "grabbing";

    // Add data attribute to dragged item for styling
    const draggedEl = document.querySelector(`[data-rbd-draggable-id="${result.draggableId}"]`);
    if (draggedEl) {
      draggedEl.setAttribute('data-dragging', 'true');
    }
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    setIsDragging(false)
    // Reset cursor and remove dragging class
    document.body.style.cursor = "default";
    document.body.classList.remove('dragging');

    // Remove data attributes
    const draggedElements = document.querySelectorAll('[data-dragging="true"]');
    draggedElements.forEach(el => {
      el.removeAttribute('data-dragging');
    });

    const { destination, source, draggableId } = result

    // Return if dropped outside a droppable area or in the same position
    if (!destination ||
        (destination.droppableId === source.droppableId &&
        destination.index === source.index)) {
      return
    }

    // If dropped in a different column, update task status
    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    )

    // Show toast notification
    toast({
      title: "Task moved",
      description: `Task moved to ${getColumnTitle(destination.droppableId)}`,
    })
  }, [moveTask, toast])

  // Handle task edit
  const handleEditTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setCurrentTask(task)
      setEditDialogOpen(true)
    }
  }, [tasks])

  // Handle task delete
  const handleDeleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setCurrentTask(task)
      setDeleteDialogOpen(true)
    }
  }, [tasks])

  // Handle task share
  const handleShareTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setCurrentTask(task)
      setShareDialogOpen(true)
    }
  }, [tasks])

  // Confirm delete
  const confirmDelete = useCallback(() => {
    if (currentTask) {
      deleteTask(currentTask.id)

      // Show toast notification
      toast({
        title: "Task deleted",
        description: `"${currentTask.title}" has been deleted`,
      })

      // Close dialog
      setDeleteDialogOpen(false)
      setCurrentTask(null)
    }
  }, [currentTask, deleteTask, toast])

  // Save edited task
  const saveTask = useCallback(() => {
    if (currentTask) {
      updateTask(currentTask.id, currentTask)

      // Show toast notification
      toast({
        title: "Task updated",
        description: `"${currentTask.title}" has been updated`,
      })

      // Close dialog
      setEditDialogOpen(false)
      setCurrentTask(null)
    }
  }, [currentTask, updateTask, toast])

  // Share task
  const shareTask = useCallback(() => {
    if (currentTask) {
      // Show toast notification
      toast({
        title: "Task shared",
        description: `"${currentTask.title}" has been shared`,
      })

      // Close dialog
      setShareDialogOpen(false)
    }
  }, [currentTask, toast])

  // Map status to display name
  const getColumnTitle = (status: string) => {
    const column = columns[status];
    return column ? column.title : status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Handle adding a new task
  const handleAddTask = useCallback((status: string) => {
    if (onTaskAdd) {
      onTaskAdd(status);
    } else {
      // Create a new task directly if no external handler
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: "New Task",
        description: "Click to edit this task",
        status: status as Task["status"],
        priority: "Medium",
        assignee: {
          name: "Unassigned",
          initials: "UN"
        }
      };

      addTask(newTask);

      // Show toast notification
      toast({
        title: "Task created",
        description: `New task added to ${getColumnTitle(status)}`,
      });
    }
  }, [onTaskAdd, addTask, toast, getColumnTitle]);

  // Return placeholder while loading
  if (!mounted) {
    return <KanbanPlaceholder />
  }

  // Get tasks for a column
  const getTasksForColumn = (columnId: string) => {
    const column = columns[columnId];
    if (!column) return [];

    return column.taskIds.map(taskId =>
      tasks.find(task => task.id === taskId)
    ).filter(Boolean) as Task[];
  };

  // This is a client-side only component
  return (
    <>
      <style jsx global>{`
        /* Global CSS for drag-and-drop */
        body.dragging {
          cursor: grabbing !important;
        }
        [data-dragging="true"] {
          opacity: 0.8;
          transform: scale(1.02);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          z-index: 50 !important;
        }
        .draggable-task {
          cursor: grab;
        }
      `}</style>

      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        enableDefaultSensors={true}
      >
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 h-full transition-opacity duration-200 ${isDragging ? 'opacity-95' : 'opacity-100'}`}>
          {columnOrder.map((columnId, index) => {
            const column = columns[columnId];
            const columnTasks = getTasksForColumn(columnId);

            return (
              <div key={columnId} className="flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{column.title}</h3>
                  <div className="bg-muted rounded-full px-2.5 py-0.5 text-sm text-muted-foreground">
                    {columnTasks.length}
                  </div>
                </div>

                <Droppable
                  droppableId={columnId}
                  isDropDisabled={false}
                  isCombineEnabled={false}
                  ignoreContainerClipping={false}
                  type="TASK"
                  renderClone={(provided, snapshot, rubric) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        id={columnTasks[rubric.source.index].id}
                        title={columnTasks[rubric.source.index].title}
                        description={columnTasks[rubric.source.index].description || "No description"}
                        dueDate={columnTasks[rubric.source.index].dueDate || "TBD"}
                        priority={columnTasks[rubric.source.index].priority as "Low" | "Medium" | "High" | "Critical"}
                        assignee={columnTasks[rubric.source.index].assignee || {
                          name: "Unassigned",
                          initials: "UN"
                        }}
                        status={columnTasks[rubric.source.index].status as "todo" | "in-progress" | "done" | "backlog"}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onShare={handleShareTask}
                      />
                    </div>
                  )}
                >
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      data-is-dragging-over={snapshot.isDraggingOver}
                      className={`bg-card/50 border-2 min-h-[200px] rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? "border-primary/50 bg-primary/5" : "border-border"
                      }`}
                      style={{
                        transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease",
                        transform: snapshot.isDraggingOver ? "scale(1.01)" : "scale(1)"
                      }}
                    >
                      {columnTasks.map((task, taskIndex) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={taskIndex}
                          isDragDisabled={false}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              data-is-dragging={snapshot.isDragging}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                transform: snapshot.isDragging
                                  ? `${provided.draggableProps.style?.transform} scale(1.02)`
                                  : provided.draggableProps.style?.transform,
                                boxShadow: snapshot.isDragging
                                  ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                                  : "none",
                                zIndex: snapshot.isDragging ? 100 : 1,
                                transition: "box-shadow 0.2s ease, opacity 0.2s ease"
                              }}
                              className="mb-3 draggable-task"
                            >
                              <TaskCard
                                id={task.id}
                                title={task.title}
                                description={task.description || "No description"}
                                dueDate={task.dueDate || "TBD"}
                                priority={task.priority as "Low" | "Medium" | "High" | "Critical"}
                                assignee={task.assignee || {
                                  name: "Unassigned",
                                  initials: "UN"
                                }}
                                status={task.status as "todo" | "in-progress" | "done" | "backlog"}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                onShare={handleShareTask}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleAddTask(columnId)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Task
                      </Button>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Edit Task Dialog */}
      {currentTask && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to the task details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={currentTask.title}
                  onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={currentTask.description}
                  onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <select
                  id="priority"
                  value={currentTask.priority}
                  onChange={(e) => setCurrentTask({...currentTask, priority: e.target.value as "Low" | "Medium" | "High" | "Critical"})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={currentTask.dueDate || ""}
                  onChange={(e) => setCurrentTask({...currentTask, dueDate: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveTask}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Task Dialog */}
      {currentTask && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">{currentTask.title}</p>
              <p className="text-sm text-muted-foreground">{currentTask.description}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Task Dialog */}
      {currentTask && (
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Share Task</DialogTitle>
              <DialogDescription>
                Share this task with team members or via link.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">{currentTask.title}</p>
              <div className="flex mt-4">
                <Input
                  value={`https://app.example.com/tasks/${currentTask.id}`}
                  readOnly
                  className="mr-2"
                />
                <Button onClick={() => {
                  navigator.clipboard.writeText(`https://app.example.com/tasks/${currentTask.id}`);
                  toast({
                    title: "Link copied",
                    description: "Task link has been copied to clipboard",
                  });
                }}>
                  Copy
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={shareTask}>
                Share
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Export default version
export default KanbanBoard;
