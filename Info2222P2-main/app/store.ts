// app/store.ts - Zustand store for task management
"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Task type definition
export interface Task {
  id: string
  title: string
  description: string
  status: "backlog" | "todo" | "in-progress" | "done"
  priority: "Low" | "Medium" | "High" | "Critical"
  dueDate?: string
  assignee?: {
    name: string
    avatar?: string
    initials: string
  }
}

// Column type for drag and drop
export interface TaskColumn {
  id: string;
  title: string;
  taskIds: string[];
}

// State interface
interface TaskState {
  tasks: Task[];
  columns: Record<string, TaskColumn>;
  columnOrder: string[];

  // Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => void;
  moveColumn: (sourceIndex: number, destinationIndex: number) => void;
}

// Sample data for initial state
const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Research API endpoints",
    description: "Review and document all available API endpoints for the integration.",
    status: "done",
    priority: "Medium",
    dueDate: "2025-05-15",
    assignee: {
      name: "Alex",
      initials: "AL",
      avatar: "/placeholder.svg?height=32&width=32"
    }
  },
  {
    id: "task-2",
    title: "Design user flow",
    description: "Create wireframes and user flow diagrams for the new feature.",
    status: "done",
    priority: "High",
    dueDate: "2025-05-20",
    assignee: {
      name: "Sam",
      initials: "SM",
      avatar: "/placeholder.svg?height=32&width=32"
    }
  },
  {
    id: "task-3",
    title: "Implement authentication",
    description: "Build the authentication system following security best practices.",
    status: "in-progress",
    priority: "Critical",
    dueDate: "2025-06-01",
    assignee: {
      name: "Taylor",
      initials: "TL",
      avatar: "/placeholder.svg?height=32&width=32"
    }
  },
  {
    id: "task-4",
    title: "Create dashboard layout",
    description: "Implement the responsive dashboard layout based on the design mockups.",
    status: "todo",
    priority: "Medium",
    dueDate: "2025-06-05",
    assignee: {
      name: "Jordan",
      initials: "JD",
      avatar: "/placeholder.svg?height=32&width=32"
    }
  },
  {
    id: "task-5",
    title: "Write documentation",
    description: "Document the codebase and create user guides for the new features.",
    status: "backlog",
    priority: "Low",
    dueDate: "2025-06-10",
    assignee: {
      name: "Unassigned",
      initials: "UN"
    }
  }
];

// Create initial columns structure
function getInitialData(tasks: Task[]) {
  // Group tasks by status
  const tasksByStatus = {
    backlog: tasks.filter(task => task.status === "backlog").map(task => task.id),
    todo: tasks.filter(task => task.status === "todo").map(task => task.id),
    "in-progress": tasks.filter(task => task.status === "in-progress").map(task => task.id),
    done: tasks.filter(task => task.status === "done").map(task => task.id),
  };

  // Create columns
  const columns = {
    backlog: {
      id: "backlog",
      title: "Backlog",
      taskIds: tasksByStatus.backlog,
    },
    todo: {
      id: "todo",
      title: "To Do",
      taskIds: tasksByStatus.todo,
    },
    "in-progress": {
      id: "in-progress",
      title: "In Progress",
      taskIds: tasksByStatus["in-progress"],
    },
    done: {
      id: "done",
      title: "Done",
      taskIds: tasksByStatus.done,
    },
  };

  // Column display order
  const columnOrder = ["backlog", "todo", "in-progress", "done"];

  return { tasks, columns, columnOrder };
}

// Create the store
export const useTaskStore = create<TaskState>()(
  persist(
    (set) => {
      const initialData = getInitialData(initialTasks);

      return {
        // Initial state
        tasks: initialData.tasks,
        columns: initialData.columns,
        columnOrder: initialData.columnOrder,

        // Actions
        addTask: (task) => set((state) => {
          // Create a new task and add it to the tasks array
          const newTasks = [...state.tasks, task];

          // Add task ID to the correct column
          const column = state.columns[task.status];
          const newColumn = {
            ...column,
            taskIds: [...column.taskIds, task.id],
          };

          return {
            tasks: newTasks,
            columns: {
              ...state.columns,
              [task.status]: newColumn,
            },
          };
        }),

        updateTask: (id, updates) => set((state) => {
          const taskIndex = state.tasks.findIndex(task => task.id === id);
          if (taskIndex === -1) return state;

          const oldTask = state.tasks[taskIndex];
          const newTask = { ...oldTask, ...updates };
          const newTasks = [...state.tasks];
          newTasks[taskIndex] = newTask;

          // If status has changed, update columns
          if (updates.status && oldTask.status !== updates.status) {
            // Remove from old column
            const oldColumn = state.columns[oldTask.status];
            const newOldColumn = {
              ...oldColumn,
              taskIds: oldColumn.taskIds.filter(taskId => taskId !== id),
            };

            // Add to new column
            const newColumn = state.columns[updates.status];
            const newUpdatedColumn = {
              ...newColumn,
              taskIds: [...newColumn.taskIds, id],
            };

            return {
              tasks: newTasks,
              columns: {
                ...state.columns,
                [oldTask.status]: newOldColumn,
                [updates.status]: newUpdatedColumn,
              },
            };
          }

          return { tasks: newTasks };
        }),

        deleteTask: (id) => set((state) => {
          const taskToDelete = state.tasks.find(task => task.id === id);
          if (!taskToDelete) return state;

          // Remove task from tasks array
          const newTasks = state.tasks.filter(task => task.id !== id);

          // Remove task from column
          const column = state.columns[taskToDelete.status];
          const newColumn = {
            ...column,
            taskIds: column.taskIds.filter(taskId => taskId !== id),
          };

          return {
            tasks: newTasks,
            columns: {
              ...state.columns,
              [taskToDelete.status]: newColumn,
            },
          };
        }),

        moveTask: (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => set((state) => {
          // First, ensure the task exists
          const taskExists = state.tasks.some(task => task.id === taskId);
          if (!taskExists) {
            console.error(`Task with ID ${taskId} not found`);
            return state;
          }

          // Same column move
          if (sourceColumnId === destinationColumnId) {
            const column = state.columns[sourceColumnId];
            // Filter out any duplicate taskIds that might exist
            const uniqueTaskIds = Array.from(new Set(column.taskIds));
            // Find the correct source index in case it changed due to deduplication
            const actualSourceIndex = uniqueTaskIds.indexOf(taskId);
            if (actualSourceIndex === -1) return state;

            // Remove and reinsert at the destination
            uniqueTaskIds.splice(actualSourceIndex, 1);
            uniqueTaskIds.splice(destinationIndex, 0, taskId);

            const newColumn = {
              ...column,
              taskIds: uniqueTaskIds,
            };

            return {
              columns: {
                ...state.columns,
                [sourceColumnId]: newColumn,
              },
            };
          }

          // Moving between columns
          const sourceColumn = state.columns[sourceColumnId];
          const destinationColumn = state.columns[destinationColumnId];

          if (!sourceColumn || !destinationColumn) {
            console.error("Column not found", { sourceColumnId, destinationColumnId });
            return state;
          }

          // First, remove the task from ALL columns to prevent duplicates
          const updatedColumns = { ...state.columns };

          // Process each column
          Object.keys(updatedColumns).forEach(colId => {
            // Filter out the task from all columns
            if (colId !== destinationColumnId) {
              updatedColumns[colId] = {
                ...updatedColumns[colId],
                taskIds: updatedColumns[colId].taskIds.filter(id => id !== taskId)
              };
            }
          });

          // Now add to destination column (making sure it's not already there)
          const destinationTaskIds = Array.from(
            new Set([...updatedColumns[destinationColumnId].taskIds])
          );

          // Insert at the specified index
          if (!destinationTaskIds.includes(taskId)) {
            destinationTaskIds.splice(destinationIndex, 0, taskId);
          }

          updatedColumns[destinationColumnId] = {
            ...updatedColumns[destinationColumnId],
            taskIds: destinationTaskIds
          };

          // Update task status
          const updatedTasks = state.tasks.map(task =>
            task.id === taskId
              ? { ...task, status: destinationColumnId as Task["status"] }
              : task
          );

          return {
            tasks: updatedTasks,
            columns: updatedColumns
          };
        }),

        moveColumn: (sourceIndex, destinationIndex) => set((state) => {
          const newColumnOrder = Array.from(state.columnOrder);
          const [removed] = newColumnOrder.splice(sourceIndex, 1);
          newColumnOrder.splice(destinationIndex, 0, removed);

          return { columnOrder: newColumnOrder };
        }),
      };
    },
    {
      name: 'task-storage', // unique name for localStorage
    }
  )
);
