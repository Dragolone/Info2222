"use client"

import React from "react"
import { useState, useRef } from "react"
// Import only essential UI components
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  Folder,
  Trash2,
  MoreHorizontal,
  File,
  Star,
  Upload,
  Plus,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Keeping the same interfaces
interface FileItem {
  id: string
  name: string
  type: "file" | "folder" | "image" | "document" | "archive"
  size?: number
  modified: Date
  starred?: boolean
  shared?: boolean
  owner: {
    name: string
    avatar?: string
    initials: string
  }
  path: string[]
}

interface FileManagerProps {
  initialFileToOpen?: string | null;
}

export function SimpleFileManager({ initialFileToOpen }: FileManagerProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Basic state
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "folder-1",
      name: "Project Documentation",
      type: "folder",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 3),
      owner: {
        name: "You",
        initials: "YO",
      },
      path: [],
      shared: true,
    },
    {
      id: "file-1",
      name: "Project_Requirements.docx",
      type: "document",
      size: 2500000,
      modified: new Date(Date.now() - 1000 * 60 * 30),
      owner: {
        name: "You",
        initials: "YO",
      },
      path: [],
      starred: true,
    },
    {
      id: "file-2",
      name: "Design_Mockups.fig",
      type: "file",
      size: 8500000,
      modified: new Date(Date.now() - 1000 * 60 * 60 * 2),
      owner: {
        name: "Alex Lee",
        initials: "AL",
      },
      path: [],
    },
    {
      id: "file-3",
      name: "Meeting_Screenshot.png",
      type: "image",
      size: 1200000,
      modified: new Date(Date.now() - 1000 * 60 * 120),
      owner: {
        name: "Mike Smith",
        initials: "MS",
      },
      path: [],
    },
  ])

  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—"

    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 Byte"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Get file icon based on type
  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "folder":
        return <Folder className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "archive":
        return <FileArchive className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  // Filter files based on current path
  const filteredFiles = files.filter((file) => {
    // Path filtering
    const pathMatch =
      currentPath.length === 0
        ? file.path.length === 0
        : JSON.stringify(file.path) === JSON.stringify(currentPath)

    // Search filtering
    const searchMatch =
      searchQuery === "" ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase())

    return pathMatch && searchMatch
  })

  // Navigate to a folder
  const navigateToFolder = (folder: FileItem) => {
    setCurrentPath([...folder.path, folder.name])
  }

  // Navigate up one level
  const navigateUp = () => {
    setCurrentPath(currentPath.slice(0, -1))
  }

  // Toggle star status
  const toggleStar = (id: string) => {
    setFiles(
      files.map((file) => (file.id === id ? { ...file, starred: !file.starred } : file))
    )
  }

  // Delete file
  const deleteFile = (id: string) => {
    const file = files.find(f => f.id === id)
    if (file) {
      setFiles(files.filter(f => f.id !== id))
      toast({
        title: "File deleted",
        description: `"${file.name}" has been deleted`,
      })
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Simplified Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentPath.length > 0 && (
            <Button variant="ghost" size="sm" onClick={navigateUp}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder}>
                {index > 0 && <span>/</span>}
                <span>{folder}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
        />
      </div>

      {/* Simple file list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex justify-between">
          <h2 className="text-xl font-bold">Files</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                "border rounded-lg p-3 flex items-center justify-between hover:bg-slate-50 transition-colors",
                file.type === "folder" && "cursor-pointer"
              )}
              onClick={() => file.type === "folder" ? navigateToFolder(file) : null}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-md flex items-center justify-center",
                  file.type === "folder" ? "bg-blue-50" :
                  file.type === "image" ? "bg-green-50" :
                  file.type === "document" ? "bg-amber-50" :
                  "bg-slate-50"
                )}>
                  {getFileIcon(file.type)}
                </div>
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(file.modified)}
                    {file.size ? ` • ${formatFileSize(file.size)}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded hover:bg-slate-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(file.id);
                  }}
                >
                  {file.starred ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-slate-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.id);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
