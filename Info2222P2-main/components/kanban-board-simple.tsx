"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Share2, LayoutGrid } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TaskCard } from "@/components/task-card"
import { useTaskStore, Task } from "@/app/store"
import { cn } from "@/lib/utils"

// Static content for loading state
const KanbanPlaceholder = () => (
  <div className="kanban-board">
    {["Backlog", "To Do", "In Progress", "Done"].map((column, index) => (
      <div key={index} className="kanban-column animate-pulse">
        <div className="kanban-column-header">
          <h3 className="kanban-column-title">{column}</h3>
          <div className="kanban-column-count">
            &nbsp;&nbsp;&nbsp;
          </div>
        </div>
        <div className="flex-grow">
          {[1, 2, 3].map(item => (
            <div key={item} className="kanban-card mb-3">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
              <div className="flex justify-between">
                <div className="h-5 bg-muted rounded w-1/4"></div>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="kanban-add-card mt-2">
          <div className="h-6 w-full bg-muted rounded"></div>
        </div>
      </div>
    ))}
  </div>
)

interface KanbanBoardProps {
  onTaskAdd?: (status: string) => void;
  initialViewMode?: 'carousel' | 'list';
}

function KanbanBoardSimple({ onTaskAdd, initialViewMode = 'carousel' }: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [dragDirection, setDragDirection] = useState<'above' | 'below' | null>(null)
  const [activeColumnIndex, setActiveColumnIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>(initialViewMode)
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()

  // Get data and actions from store
  const tasks = useTaskStore(state => state.tasks)
  const columns = useTaskStore(state => state.columns)
  const columnOrder = useTaskStore(state => state.columnOrder)
  const updateTask = useTaskStore(state => state.updateTask)
  const deleteTask = useTaskStore(state => state.deleteTask)
  const moveTask = useTaskStore(state => state.moveTask)
  const addTask = useTaskStore(state => state.addTask)

  // Load view mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('kanban-view');
      if (savedMode === 'list' || savedMode === 'carousel') {
        setViewMode(savedMode as 'carousel' | 'list');
      }
    }
  }, []);

  // Update viewMode when initialViewMode changes
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Scroll to column when active column changes on mobile
  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && window.innerWidth < 768) {
      const columnsContainer = document.querySelector('.kanban-board') as HTMLElement;
      const columnElements = document.querySelectorAll('.kanban-column') as NodeListOf<HTMLElement>;

      if (columnsContainer && columnElements && columnElements[activeColumnIndex]) {
        columnsContainer.scrollTo({
          left: columnElements[activeColumnIndex].offsetLeft - 16,
          behavior: 'smooth'
        });
      }
    }
  }, [activeColumnIndex, mounted]);

  // Track column visibility for mobile view
  const handleColumnScroll = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const columnsContainer = document.querySelector('.kanban-board') as HTMLElement;
      if (!columnsContainer) return;

      const containerLeft = columnsContainer.scrollLeft;
      const containerWidth = columnsContainer.clientWidth;
      const columnElements = document.querySelectorAll('.kanban-column') as NodeListOf<HTMLElement>;

      let mostVisibleColumnIndex = 0;
      let maxVisibleWidth = 0;

      columnElements.forEach((column, index) => {
        const columnLeft = column.offsetLeft - columnsContainer.offsetLeft;
        const visibleLeft = Math.max(0, containerLeft - columnLeft);
        const visibleRight = Math.max(0, (columnLeft + column.clientWidth) - containerLeft - containerWidth);
        const visibleWidth = column.clientWidth - visibleLeft - visibleRight;

        if (visibleWidth > maxVisibleWidth) {
          maxVisibleWidth = visibleWidth;
          mostVisibleColumnIndex = index;
        }
      });

      setActiveColumnIndex(mostVisibleColumnIndex);
    }
  }, []);

  // Attach scroll listener for column visibility tracking
  useEffect(() => {
    if (mounted) {
      const columnsContainer = document.querySelector('.kanban-board');
      if (columnsContainer) {
        columnsContainer.addEventListener('scroll', handleColumnScroll);
        // Initial check
        handleColumnScroll();

        return () => {
          columnsContainer.removeEventListener('scroll', handleColumnScroll);
        };
      }
    }
  }, [mounted, handleColumnScroll]);

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Get tasks for a column - ensuring unique IDs and proper task references
  const getTasksForColumn = (columnId: string) => {
    const column = columns[columnId];
    if (!column) return [];

    // Create a Map to deduplicate task IDs
    const taskMap = new Map<string, Task>();

    // First collect all tasks
    const columnTasks = column.taskIds
      .map(taskId => tasks.find(task => task.id === taskId))
      .filter(Boolean) as Task[];

    // Deduplicate by ID
    columnTasks.forEach(task => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, task);
      }
    });

    // Return the array of unique tasks
    return Array.from(taskMap.values());
  };

  // HTML5 Drag and Drop handlers with improved state handling
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation(); // Prevent event bubbling

    // Clear any existing drag state first
    setDragOverTaskId(null);
    setDragDirection(null);
    setDragOverColumnId(null);

    // Set the current dragged task
    setDraggedTaskId(taskId);

    // Find the task and verify it exists
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error("Task not found when starting drag", taskId);
      e.preventDefault();
      return;
    }

    // Set transfer data
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('taskStatus', task.status);
    // Add a timestamp to prevent stale data
    e.dataTransfer.setData('timestamp', Date.now().toString());

    // For visual feedback, we'll apply opacity to the dragged item
    if (e.target instanceof HTMLElement) {
      setTimeout(() => {
        (e.target as HTMLElement).style.opacity = '0.5';
      }, 0);
    }
  };

  // Also add a drag enter handler to improve visual feedback
  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    // Only update if this is a different column
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  // Handle drag over a specific task
  const handleTaskDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Skip if dragging over itself
    if (taskId === draggedTaskId) {
      setDragOverTaskId(null);
      setDragDirection(null);
      return;
    }

    setDragOverTaskId(taskId);

    // Determine if dragging above or below the task based on cursor position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const direction = e.clientY < midY ? 'above' : 'below';
    setDragDirection(direction);
  };

  const handleDrop = (e: React.DragEvent, destinationColumnId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('taskStatus');
    const timestamp = e.dataTransfer.getData('timestamp');

    // Skip if the data is too old (could be a duplicate event)
    if (!timestamp || Date.now() - parseInt(timestamp) > 5000) {
      console.log("Skipping drop - data too old or missing timestamp");
      // Reset drag states
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
      setDragDirection(null);
      return;
    }

    // Validate data integrity
    if (!taskId || !sourceColumnId) {
      console.error("Missing drag data", { taskId, sourceColumnId });
      // Reset drag states
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
      setDragDirection(null);
      return;
    }

    // Skip if source and destination are the same and no specific target task
    if (sourceColumnId === destinationColumnId && !dragOverTaskId) {
      // Reset drag states
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
      setDragDirection(null);
      return;
    }

    // Verify columns exist
    const sourceColumn = columns[sourceColumnId];
    const destinationColumn = columns[destinationColumnId];

    if (!sourceColumn || !destinationColumn) {
      console.error("Column not found", { sourceColumnId, destinationColumnId });
      // Reset drag states
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
      setDragDirection(null);
      return;
    }

    // Verify the task exists in the source column
    const sourceIndex = sourceColumn.taskIds.indexOf(taskId);
    if (sourceIndex === -1) {
      console.error("Task not found in source column", { taskId, sourceColumnId });
      // Reset drag states
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
      setDragDirection(null);
      return;
    }

    // If dropping on a specific task within a column
    if (dragOverTaskId && sourceColumnId === destinationColumnId) {
      let destinationIndex = sourceColumn.taskIds.indexOf(dragOverTaskId);

      // Skip if trying to drop on itself (same task)
      if (taskId === dragOverTaskId || destinationIndex === -1) {
        // Reset drag states
        setDraggedTaskId(null);
        setDragOverColumnId(null);
        setDragOverTaskId(null);
        setDragDirection(null);
        return;
      }

      // If dropping below the target task, increment the destination index
      if (dragDirection === 'below') {
        destinationIndex += 1;
      }

      // Adjust destination index if task is moving down in the same column
      if (sourceIndex < destinationIndex) {
        destinationIndex -= 1;
      }

      // Only move if indexes are different
      if (sourceIndex !== destinationIndex) {
        moveTask(
          taskId,
          sourceColumnId,
          destinationColumnId,
          sourceIndex,
          destinationIndex
        );
      }
    }
    // If dropping directly on a column (moving between columns)
    else if (sourceColumnId !== destinationColumnId) {
      const destinationIndex = 0; // Insert at the top of the new column

      moveTask(
        taskId,
        sourceColumnId,
        destinationColumnId,
        sourceIndex,
        destinationIndex
      );
    }

    // Reset drag states
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverTaskId(null);
    setDragDirection(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
    // Reset all drag states
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverTaskId(null);
    setDragDirection(null);
  };

  // This is a client-side only component
  return (
    <>
      <style jsx global>{`
        /* Global CSS for drag-and-drop */
        .task-card-draggable {
          cursor: grab;
          position: relative;
        }
        .task-card-draggable:active {
          cursor: grabbing;
        }
        .task-card-draggable.drag-over-above::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          height: 4px;
          background-color: hsl(var(--primary));
          border-radius: 2px;
          z-index: 10;
        }
        .task-card-draggable.drag-over-below::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 4px;
          background-color: hsl(var(--primary));
          border-radius: 2px;
          z-index: 10;
        }
        .column-droppable {
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
        }
        .column-droppable.drag-over {
          background-color: rgba(var(--primary), 0.05);
          border-color: hsl(var(--primary) / 0.5);
          transform: scale(1.01);
        }
      `}</style>

      {/* Mobile List View */}
      {viewMode === 'list' ? (
        <div className="md:hidden space-y-4 pb-8">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            const columnTasks = getTasksForColumn(columnId);

            return (
              <div key={columnId} className="border rounded-lg overflow-hidden bg-card">
                <div className="bg-primary text-primary-foreground px-4 py-2.5 flex justify-between items-center sticky top-0 z-10">
                  <h3 className="font-medium flex items-center gap-2">
                    {column.title}
                    <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary-foreground/20 text-primary-foreground px-1.5 text-xs">
                      {columnTasks.length}
                    </span>
                  </h3>
                </div>

                {/* Add card-style button in list view */}
                <div className="px-3 pt-3">
                  <button
                    className="kanban-add-button w-full"
                    onClick={() => handleAddTask(columnId)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs">Add</span>
                  </button>
                </div>

                <div className="p-3 pt-0 space-y-2.5">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                      No tasks yet
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="kanban-card kanban-card-draggable"
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Main Kanban Board - Carousel View or Desktop */
        <div className="kanban-board relative" role="grid" aria-label="Kanban board">
          {columnOrder.map((columnId, index) => {
            const column = columns[columnId];
            const columnTasks = getTasksForColumn(columnId);
            const isDragOver = dragOverColumnId === columnId;

            return (
              <div
                key={columnId}
                className={cn(
                  "kanban-column",
                  isDragOver ? 'drag-over' : '',
                  index === activeColumnIndex ? 'kanban-column-active' : ''
                )}
                role="gridcell"
                aria-label={`${column.title} column with ${columnTasks.length} tasks`}
                data-column-id={columnId}
              >
                <div className="kanban-column-header">
                  <h3 className={cn(
                    "kanban-column-tag",
                    `kanban-column-${columnId}`
                  )}>
                    <span>{column.title}</span>
                    <div className="kanban-column-count">
                      {columnTasks.length}
                    </div>
                  </h3>
                </div>

                {/* New card-style Add Task button below header */}
                <button
                  className="kanban-add-button"
                  onClick={() => handleAddTask(columnId)}
                  aria-label={`Add task to ${column.title}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>

                <div
                  className="flex-grow overflow-y-auto hide-scrollbar pb-2"
                  onDragOver={(e) => handleDragOver(e, columnId)}
                  onDragEnter={(e) => handleDragEnter(e, columnId)}
                  onDrop={(e) => handleDrop(e, columnId)}
                >
                  {columnTasks.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                      No tasks yet
                    </div>
                  )}

                  {columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`kanban-card kanban-card-draggable group ${
                        dragOverTaskId === task.id && dragDirection === 'above' ? 'drag-over-above' : ''
                      } ${
                        dragOverTaskId === task.id && dragDirection === 'below' ? 'drag-over-below' : ''
                      }`}
                      draggable="true"
                      data-task-id={task.id}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        handleDragEnd(e);
                      }}
                      onDragOver={(e) => handleTaskDragOver(e, task.id)}
                      onDrop={(e) => handleDrop(e, columnId)}
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

                      {/* Drag indicators */}
                      <div className={`kanban-drop-indicator ${index === 0 ? 'mt-0' : ''} ${
                        dragOverTaskId === task.id && dragDirection === 'above' ? 'kanban-drop-indicator-visible' : ''
                      }`}></div>

                      {index === columnTasks.length - 1 && (
                        <div className={`kanban-drop-indicator mt-1 ${
                          dragOverTaskId === task.id && dragDirection === 'below' ? 'kanban-drop-indicator-visible' : ''
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile pagination indicator - Shows which column is active in carousel view */}
      {isMobile && viewMode === 'carousel' && (
        <div className="flex justify-center items-center gap-2 mt-3 mb-5">
          {columnOrder.map((columnId, index) => (
            <button
              key={index}
              className={cn(
                "rounded-full transition-all duration-300 focus:outline-none flex items-center justify-center",
                activeColumnIndex === index
                  ? "bg-primary text-primary-foreground font-medium px-3 py-0.5 text-xs h-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5 h-2.5"
              )}
              onClick={() => {
                setActiveColumnIndex(index);
                // Force scroll to selected column
                const columnsContainer = document.querySelector('.kanban-board') as HTMLElement;
                const columnElements = document.querySelectorAll('.kanban-column') as NodeListOf<HTMLElement>;

                if (columnsContainer && columnElements && columnElements[index]) {
                  columnsContainer.scrollTo({
                    left: columnElements[index].offsetLeft - 16,
                    behavior: 'smooth'
                  });
                }
              }}
              aria-label={`Go to ${columns[columnOrder[index]].title} column`}
            >
              {activeColumnIndex === index && columns[columnOrder[index]].title}
            </button>
          ))}
        </div>
      )}

      {/* Enhanced Edit Task Dialog */}
      {currentTask && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[calc(100%-32px)] p-0 overflow-hidden">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">Edit Task</DialogTitle>
                <DialogDescription>
                  Make changes to the task details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={currentTask.title}
                    onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                    className="h-[var(--touch-target-min)]"
                    placeholder="Task title"
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={currentTask.description || ""}
                    onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                    className="min-h-[100px]"
                    placeholder="Describe this task..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <select
                    id="status"
                    value={currentTask.status}
                    onChange={(e) => setCurrentTask({...currentTask, status: e.target.value as Task["status"]})}
                    className="flex h-[var(--touch-target-min)] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress" className="whitespace-nowrap">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <select
                    id="priority"
                    value={currentTask.priority}
                    onChange={(e) => setCurrentTask({...currentTask, priority: e.target.value as "Low" | "Medium" | "High" | "Critical"})}
                    className="flex h-[var(--touch-target-min)] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setCurrentTask({...currentTask, dueDate: e.target.value})}
                    className="h-[var(--touch-target-min)]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 p-4 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-[var(--touch-target-min)] w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={saveTask}
                className="h-[var(--touch-target-min)] w-full sm:w-auto order-1 sm:order-2"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Delete Task Dialog */}
      {currentTask && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] max-w-[calc(100%-32px)] p-0">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl text-destructive">Delete Task</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 p-3 border rounded-md bg-muted/30">
                <h4 className="font-medium">{currentTask.title}</h4>
                {currentTask.description && (
                  <p className="text-sm text-muted-foreground mt-1">{currentTask.description}</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 p-4 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="h-[var(--touch-target-min)] w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="h-[var(--touch-target-min)] w-full sm:w-auto order-1 sm:order-2"
              >
                Delete Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Share Task Dialog */}
      {currentTask && (
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-[400px] max-w-[calc(100%-32px)] p-0">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">Share Task</DialogTitle>
                <DialogDescription>
                  Share this task with team members or via link.
                </DialogDescription>
              </DialogHeader>

              <div className="my-2 p-3 border rounded-md bg-muted/30">
                <h4 className="font-medium">{currentTask.title}</h4>
              </div>

              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="share-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="share-email"
                      type="email"
                      placeholder="colleague@example.com"
                      className="h-[var(--touch-target-min)] flex-1"
                    />
                    <Button className="h-[var(--touch-target-min)]">
                      Invite
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="share-link" className="text-sm font-medium">
                    Share Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="share-link"
                      value={`https://app.example.com/tasks/${currentTask.id}`}
                      readOnly
                      className="h-[var(--touch-target-min)] flex-1 bg-muted/50"
                    />
                    <Button
                      variant="outline"
                      className="h-[var(--touch-target-min)]"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://app.example.com/tasks/${currentTask.id}`);
                        toast({
                          title: "Link copied",
                          description: "Share link has been copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 pt-2 border-t">
              <Button
                onClick={() => setShareDialogOpen(false)}
                className="h-[var(--touch-target-min)] w-full sm:w-auto"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Export default version
export default KanbanBoardSimple;
