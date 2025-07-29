"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  Folder,
  FilePlus,
  FolderPlus,
  Search,
  SlidersHorizontal,
  Download,
  Share,
  Trash2,
  MoreHorizontal,
  File,
  Clock,
  Star,
  StarOff,
  Eye,
  Upload,
  RefreshCw,
  Check,
  X,
  LayoutGrid,
  List,
  Save,
  Edit,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CircleAlert,
  CircleCheck,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Minus,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { FilePreview } from "@/components/file-preview"

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

export function FileManager({ initialFileToOpen }: FileManagerProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "folder-1",
      name: "Project Documentation",
      type: "folder",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      owner: {
        name: "You",
        initials: "YO",
      },
      path: [],
      shared: true,
    },
    {
      id: "folder-2",
      name: "Meeting Notes",
      type: "folder",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      owner: {
        name: "Jane Doe",
        initials: "JD",
      },
      path: [],
      shared: true,
    },
    {
      id: "file-1",
      name: "Project_Requirements.docx",
      type: "document",
      size: 2500000, // ~2.5 MB
      modified: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      owner: {
        name: "You",
        initials: "YO",
      },
      path: [],
      starred: true,
      shared: true,
    },
    {
      id: "file-2",
      name: "Design_Mockups.fig",
      type: "file",
      size: 8500000, // ~8.5 MB
      modified: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      owner: {
        name: "Alex Lee",
        initials: "AL",
      },
      path: [],
      shared: true,
    },
    {
      id: "file-3",
      name: "Meeting_Screenshot.png",
      type: "image",
      size: 1200000, // ~1.2 MB
      modified: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      owner: {
        name: "Mike Smith",
        initials: "MS",
      },
      path: [],
    },
    {
      id: "file-4",
      name: "Technical_Specifications.pdf",
      type: "document",
      size: 4800000, // ~4.8 MB
      modified: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      owner: {
        name: "You",
        initials: "YO",
      },
      path: [],
      starred: true,
    },
    {
      id: "file-5",
      name: "Project_Resources.zip",
      type: "archive",
      size: 15700000, // ~15.7 MB
      modified: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      owner: {
        name: "Jane Doe",
        initials: "JD",
      },
      path: [],
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  // Add state for file preview
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Add state for file editor
  const [editingFile, setEditingFile] = useState<FileItem | null>(null)
  const [editingContent, setEditingContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  // Add state for text editor features
  const [fontFormatting, setFontFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left' as 'left' | 'center' | 'right',
  })

  // Add state for edit mode
  const [editMode, setEditMode] = useState<'edit' | 'view'>('edit')

  // Add state for font size
  const [fontSize, setFontSize] = useState(12)

  // Menu items for each dropdown
  const fileMenuItems = [
    { label: "New", action: "file.new" },
    { label: "Open", action: "file.open" },
    { label: "Save", action: "file.save", shortcut: "⌘S" },
    { label: "Download", action: "file.download" },
    { label: "Print", action: "file.print", shortcut: "⌘P" },
    { label: "Close", action: "file.close" },
  ]

  const editMenuItems = [
    { label: "Undo", action: "edit.undo", shortcut: "⌘Z" },
    { label: "Redo", action: "edit.redo", shortcut: "⌘⇧Z" },
    { label: "Cut", action: "edit.cut", shortcut: "⌘X" },
    { label: "Copy", action: "edit.copy", shortcut: "⌘C" },
    { label: "Paste", action: "edit.paste", shortcut: "⌘V" },
    { label: "Select All", action: "edit.selectAll", shortcut: "⌘A" },
  ]

  const viewMenuItems = [
    { label: "Full Screen", action: "view.fullscreen", shortcut: "F11" },
    { label: "Zoom In", action: "view.zoomIn", shortcut: "⌘+" },
    { label: "Zoom Out", action: "view.zoomOut", shortcut: "⌘-" },
    { label: "Reset Zoom", action: "view.resetZoom", shortcut: "⌘0" },
  ]

  const formatMenuItems = [
    { label: "Bold", action: "format.bold", shortcut: "⌘B" },
    { label: "Italic", action: "format.italic", shortcut: "⌘I" },
    { label: "Underline", action: "format.underline", shortcut: "⌘U" },
    { label: "Align Left", action: "format.alignLeft" },
    { label: "Align Center", action: "format.alignCenter" },
    { label: "Align Right", action: "format.alignRight" },
  ]

  // Add font size options
  const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48]

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

  // Toggle star status
  const toggleStar = (id: string) => {
    setFiles(
      files.map((file) => (file.id === id ? { ...file, starred: !file.starred } : file))
    )

    const file = files.find(f => f.id === id)
    if (file) {
      toast({
        title: file.starred ? "Removed from starred" : "Added to starred",
        description: `"${file.name}" ${file.starred ? "removed from" : "added to"} starred items`,
      })
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

  // Filter files based on search and current view
  const filterFiles = (view: string) => {
    let filtered = files.filter((file) => {
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

    // Additional filtering based on current view
    switch (view) {
      case "starred":
        return filtered.filter((file) => file.starred)
      case "shared":
        return filtered.filter((file) => file.shared)
      case "recent":
        return [...filtered].sort((a, b) => b.modified.getTime() - a.modified.getTime()).slice(0, 5)
      default:
        return filtered
    }
  }

  // Simulate upload
  const simulateUpload = (fileNames: string[] = []) => {
    setUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 10

        if (newProgress >= 100) {
          clearInterval(interval)

          // Add a new file after a small delay
          setTimeout(() => {
            const newFiles = fileNames.length > 0
              ? fileNames.map((name, index) => createNewFile(name))
              : [createNewFile()]

            setFiles([...files, ...newFiles])
            setUploading(false)

            toast({
              title: `Upload complete`,
              description: `${newFiles.length} file${newFiles.length > 1 ? 's' : ''} uploaded successfully`,
            })
          }, 500)

          return 100
        }

        return newProgress
      })
    }, 200)
  }

  // Create a new file object
  const createNewFile = (name?: string) => {
    const fileName = name || `Uploaded_File_${new Date().toISOString().slice(0, 10)}.pdf`
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''

    let fileType: FileItem['type'] = 'file'
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExtension)) {
      fileType = 'image'
    } else if (['doc', 'docx', 'pdf', 'txt'].includes(fileExtension)) {
      fileType = 'document'
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension)) {
      fileType = 'archive'
    }

    return {
      id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: fileName,
      type: fileType,
      size: Math.floor(Math.random() * 10000000) + 100000, // Random size between 100KB and 10MB
      modified: new Date(),
      owner: {
        name: "You",
        initials: "YO",
      },
      path: currentPath,
    } as FileItem
  }

  // Navigate to a folder
  const navigateToFolder = (folder: FileItem) => {
    setCurrentPath([...folder.path, folder.name])
  }

  // Navigate up one level
  const navigateUp = () => {
    setCurrentPath(currentPath.slice(0, -1))
  }

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setUploading(true)
    let progress = 0

    // Simulate upload progress
    const interval = setInterval(() => {
      progress += Math.random() * 20
      setUploadProgress(Math.min(progress, 100))

      if (progress >= 100) {
        clearInterval(interval)

        // Add selected files to the list
        const newFiles = selectedFiles.map((file, index) => ({
          id: `new-file-${Date.now()}-${index}`,
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
          modified: new Date(),
          owner: {
            name: "You",
            initials: "YO"
          },
          path: currentPath
        }))

        setFiles(prev => [...prev, ...newFiles])
        setUploading(false)
        setUploadProgress(0)

        toast({
          title: "Files uploaded",
          description: `${selectedFiles.length} file(s) have been uploaded`,
        })
      }
    }, 200)
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return

    setUploading(true)
    let progress = 0

    // Simulate upload progress
    const interval = setInterval(() => {
      progress += Math.random() * 20
      setUploadProgress(Math.min(progress, 100))

      if (progress >= 100) {
        clearInterval(interval)

        // Add dropped files to the list
        const newFiles = droppedFiles.map((file, index) => ({
          id: `new-file-${Date.now()}-${index}`,
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
          modified: new Date(),
          owner: {
            name: "You",
            initials: "YO"
          },
          path: currentPath
        }))

        setFiles(prev => [...prev, ...newFiles])
        setUploading(false)
        setUploadProgress(0)

        toast({
          title: "Files uploaded",
          description: `${droppedFiles.length} file(s) have been uploaded`,
        })
      }
    }, 200)
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

  // Render the file list item with preview button
  const renderFileListItem = (file: FileItem) => {
    const isDocument = file.type === "document"
    const isImage = file.type === "image"
    const isFolder = file.type === "folder"
    const isPreviewable = isDocument || isImage
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

    return (
      <tr key={file.id} className="hover:bg-muted/50 transition-colors">
        <td className="pl-4 py-4 whitespace-nowrap w-[60%]">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-md flex items-center justify-center",
              isFolder ? "bg-blue-50" :
              isImage ? "bg-green-50" :
              fileExtension === 'pdf' ? "bg-red-50" :
              isDocument ? "bg-amber-50" :
              "bg-slate-50"
            )}>
              {getFileIcon(file.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {formatDate(file.modified)}
                  {file.size ? ` • ${formatFileSize(file.size)}` : ""}
                  {file.shared && " • Shared"}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {file.owner.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{file.owner.name}</span>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(file.modified)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
          {formatFileSize(file.size)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(file.id);
              }}
            >
              {file.starred ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background text-foreground">
                {isFolder ? (
                  <DropdownMenuItem onClick={() => navigateToFolder(file)} className="py-2">
                    <Eye className="h-5 w-5 mr-3" />
                    Open
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleFileOpen(file)} className="py-2">
                      <Eye className="h-5 w-5 mr-3" />
                      Open
                    </DropdownMenuItem>
                    {isPreviewable && (
                      <DropdownMenuItem onClick={() => {
                        setPreviewFile(file);
                        setPreviewOpen(true);
                      }} className="py-2">
                        <FileText className="h-5 w-5 mr-3" />
                        Preview
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleFileDownload(file)} className="py-2">
                      <Download className="h-5 w-5 mr-3" />
                      Download
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2">
                  <Share className="h-5 w-5 mr-3" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-red-500 py-2">
                  <Trash2 className="h-5 w-5 mr-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
    )
  }

  // Render the file grid item with preview button
  const renderFileGridItem = (file: FileItem) => {
    const isDocument = file.type === "document"
    const isImage = file.type === "image"
    const isFolder = file.type === "folder"
    const isPreviewable = isDocument || isImage
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

    return (
      <Card
        key={file.id}
        className={cn(
          "overflow-hidden transition-all hover:shadow-md",
          isFolder && "hover:bg-muted cursor-pointer"
        )}
        onClick={() => isFolder ? navigateToFolder(file) : null}
      >
        <div
          className={cn(
            "h-36 flex items-center justify-center",
            isFolder ? "bg-blue-50" :
            isImage ? "bg-green-50" :
            fileExtension === 'pdf' ? "bg-red-50" :
            isDocument ? "bg-amber-50" :
            "bg-slate-50"
          )}
        >
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className={cn(
              "h-16 w-16 flex items-center justify-center",
              isFolder ? "text-blue-500" :
              isImage ? "text-green-500" :
              fileExtension === 'pdf' ? "text-red-500" :
              isDocument ? "text-amber-500" :
              "text-slate-500"
            )}>
              {getFileIcon(file.type)}
            </div>
            <div className="mt-2 font-medium text-sm line-clamp-1 max-w-full">
              {file.name}
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {file.owner.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{file.owner.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(file.id);
              }}
            >
              {file.starred ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(file.modified)}</span>
            </div>
            <span>{formatFileSize(file.size)}</span>
          </div>

          <div className="mt-2 flex justify-center border-t pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background text-foreground">
                {isFolder ? (
                  <DropdownMenuItem onClick={() => navigateToFolder(file)} className="py-2">
                    <Eye className="h-5 w-5 mr-3" />
                    Open
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleFileOpen(file)} className="py-2">
                      <Eye className="h-5 w-5 mr-3" />
                      Open
                    </DropdownMenuItem>
                    {isPreviewable && (
                      <DropdownMenuItem onClick={() => {
                        setPreviewFile(file);
                        setPreviewOpen(true);
                      }} className="py-2">
                        <FileText className="h-5 w-5 mr-3" />
                        Preview
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleFileDownload(file)} className="py-2">
                      <Download className="h-5 w-5 mr-3" />
                      Download
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2">
                  <Share className="h-5 w-5 mr-3" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-red-500 py-2">
                  <Trash2 className="h-5 w-5 mr-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle file opening for editing
  const handleFileOpen = (file: FileItem) => {
    if (!file) return;

    setEditingFile(file)
    setIsEditorOpen(true)

    toast({
      title: "Opening file",
      description: `Loading ${file.name}...`,
    })

    // Generate mock content based on file type
    let mockContent = ""
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

    if (['txt', 'md'].includes(fileExtension)) {
      mockContent = `# ${file.name}\n\nThis is a sample text file content.\nYou can edit this content and save your changes.\n\n## Sample Section\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies ultricies, nunc nunc ultricies nunc, eget ultricies nisl nunc eget nisl.`
    } else if (['doc', 'docx'].includes(fileExtension)) {
      mockContent = `Document Title: ${file.name}\n\nThis is a sample document with formatted text. In a real implementation, this would contain the actual document content with formatting.\n\nHeading 1\n\nSample paragraph text with placeholder content. This is where the actual document content would appear.\n\nHeading 2\n\n- Bullet point 1\n- Bullet point 2\n- Bullet point 3`
    } else if (fileExtension === 'pdf') {
      mockContent = `[This is a read-only PDF preview]\n\nTitle: ${file.name}\n\nThis content represents the text extracted from a PDF document. In a real implementation, this would contain the actual text content extracted from the PDF file.\n\nPage 1\n\nThis is sample content from page 1 of the PDF document.`
    } else {
      mockContent = `Content of ${file.name}\n\nThis is a sample file content for demonstration purposes.\nIn a real implementation, this would be the actual content of the file.`
    }

    // Set the content with a small delay to simulate loading
    setTimeout(() => {
      setEditingContent(mockContent)
      setOriginalContent(mockContent)
      setHasUnsavedChanges(false)
    }, 500)
  }

  // Handle saving edited file
  const handleSaveFile = () => {
    // Simulate saving file
    toast({
      title: "File saved",
      description: `${editingFile?.name} has been saved`,
    })
    setHasUnsavedChanges(false)
    setOriginalContent(editingContent)

    // Update modified date for the file
    if (editingFile) {
      setFiles(
        files.map((file) =>
          file.id === editingFile.id
            ? { ...file, modified: new Date() }
            : file
        )
      )
    }
  }

  // Handle discarding changes
  const handleDiscardChanges = () => {
    if (hasUnsavedChanges) {
      if (confirm("Discard unsaved changes?")) {
        setEditingContent(originalContent)
        setHasUnsavedChanges(false)
        closeEditor()
      }
    } else {
      closeEditor()
    }
  }

  // Close editor
  const closeEditor = () => {
    setIsEditorOpen(false)
    setEditingFile(null)
    setEditingContent("")
    setOriginalContent("")
  }

  // Track changes to editingContent
  useEffect(() => {
    if (originalContent && editingContent !== originalContent) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [editingContent, originalContent])

  // Handle file download
  const handleFileDownload = (file: FileItem) => {
    setIsDownloading(file.id)

    // Simulate download process
    toast({
      title: "Download started",
      description: `Downloading ${file.name}...`,
    })

    // Create a fake progress simulation
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20

      if (progress >= 100) {
        clearInterval(interval)

        // Create a download link
        const element = document.createElement("a")
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

        // Create a fake blob based on file type
        let content = ""

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
          // For images, we'll use a sample image URL
          element.href = "https://images.unsplash.com/photo-1682687982360-3fbccf6a753a?q=80&w=800&h=600&auto=format&fit=crop"
          element.download = file.name
          element.click()
          setIsDownloading(null)

          toast({
            title: "Download complete",
            description: `${file.name} has been downloaded`,
          })
          return
        } else if (['doc', 'docx', 'pdf', 'txt', 'md'].includes(fileExtension)) {
          content = `This is a sample content for the file: ${file.name}`
        } else if (['html', 'htm'].includes(fileExtension)) {
          content = `<!DOCTYPE html><html><head><title>${file.name}</title></head><body><h1>Sample HTML</h1><p>This is a sample HTML file.</p></body></html>`
        } else if (['json'].includes(fileExtension)) {
          content = JSON.stringify({ name: file.name, description: "Sample file", created: new Date().toISOString() }, null, 2)
        } else if (['js', 'jsx', 'ts', 'tsx', 'css'].includes(fileExtension)) {
          content = `// Sample code file: ${file.name}\n\nconsole.log('Hello, world!');\n`
        } else {
          content = `Sample content for ${file.name}`
        }

        const blob = new Blob([content], { type: "text/plain" })
        element.href = URL.createObjectURL(blob)
        element.download = file.name
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)

        setIsDownloading(null)
        toast({
          title: "Download complete",
          description: `${file.name} has been downloaded`,
        })
      }
    }, 200)
  }

  // Format selected text with the specified style
  const formatText = (format: 'bold' | 'italic' | 'underline' | 'align', value?: any) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editingContent.substring(start, end)

    // If no selection and not alignment, return
    if (start === end && format !== 'align') {
      toast({
        title: "No text selected",
        description: "Please select some text to format"
      })
      return
    }

    let newContent = editingContent
    let replacement = selectedText

    // Helper function to check if text has formatting
    const hasFormatting = (text: string, formatType: string) => {
      switch (formatType) {
        case 'bold':
          return text.startsWith('**') && text.endsWith('**')
        case 'italic':
          return text.startsWith('_') && text.endsWith('_')
        case 'underline':
          return text.startsWith('<u>') && text.endsWith('</u>')
        default:
          return false
      }
    }

    // Helper function to remove formatting
    const removeFormatting = (text: string, formatType: string) => {
      switch (formatType) {
        case 'bold':
          return text.slice(2, -2)
        case 'italic':
          return text.slice(1, -1)
        case 'underline':
          return text.slice(3, -4)
        default:
          return text
      }
    }

    // Apply formatting based on type
    switch (format) {
      case 'bold':
      case 'italic':
      case 'underline':
        const hasFormat = hasFormatting(selectedText, format)
        if (hasFormat) {
          // Remove formatting
          replacement = removeFormatting(selectedText, format)
          setFontFormatting(prev => ({ ...prev, [format]: false }))
        } else {
          // Add formatting
          const marker = format === 'bold' ? '**' : format === 'italic' ? '_' : '<u>'
          const endMarker = format === 'underline' ? '</u>' : marker
          replacement = `${marker}${selectedText}${endMarker}`
          setFontFormatting(prev => ({ ...prev, [format]: true }))
        }
        break

      case 'align':
        const alignValue = value as 'left' | 'center' | 'right'
        const alignRegex = /<div style="text-align: (.*?)">(.*?)<\/div>/
        const match = selectedText.match(alignRegex)

        if (match && match[1] === alignValue) {
          // Remove alignment if it's the same
          replacement = match[2]
          setFontFormatting(prev => ({ ...prev, align: 'left' }))
        } else {
          // Apply new alignment
          replacement = `<div style="text-align: ${alignValue}">${match ? match[2] : selectedText}</div>`
          setFontFormatting(prev => ({ ...prev, align: alignValue }))
        }
        break
    }

    // Update content
    newContent = editingContent.substring(0, start) + replacement + editingContent.substring(end)
    setEditingContent(newContent)

    // Restore selection
    setTimeout(() => {
      textarea.focus()
      const newStart = start
      const newEnd = start + replacement.length
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }

  // Handle keyboard shortcuts
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save: Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (hasUnsavedChanges) {
        handleSaveFile()
      }
    }

    // Format shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          handleMenuAction('format.bold')
          break
        case 'i':
          e.preventDefault()
          handleMenuAction('format.italic')
          break
        case 'u':
          e.preventDefault()
          handleMenuAction('format.underline')
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            handleMenuAction('edit.redo')
          } else {
            handleMenuAction('edit.undo')
          }
          break
        case 'y':
          e.preventDefault()
          handleMenuAction('edit.redo')
          break
        case 'a':
          e.preventDefault()
          handleMenuAction('edit.selectAll')
          break
        case 'p':
          e.preventDefault()
          handleMenuAction('file.print')
          break
        case '=':
        case '+':
          e.preventDefault()
          handleMenuAction('view.zoomIn')
          break
        case '-':
          e.preventDefault()
          handleMenuAction('view.zoomOut')
          break
        case '0':
          e.preventDefault()
          handleMenuAction('view.resetZoom')
          break
      }
    }

    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const value = e.currentTarget.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      setEditingContent(newValue)
      // Move cursor after the inserted tab
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2
      }, 0)
    }
  }

  // Handle menu options
  const handleMenuAction = (action: string) => {
    const [category, command] = action.split('.')

    switch (category) {
      case 'file':
        switch (command) {
          case 'new':
            toast({
              title: "Create new document",
              description: "This feature would create a new document"
            })
            break
          case 'save':
            handleSaveFile()
            break
          case 'download':
            handleFileDownload(editingFile!)
            break
          case 'print':
            toast({
              title: "Print document",
              description: "This would open the print dialog in a real implementation"
            })
            break
          case 'close':
            handleDiscardChanges()
            break
        }
        break

      case 'edit':
        switch (command) {
          case 'undo':
            document.execCommand('undo')
            break
          case 'redo':
            document.execCommand('redo')
            break
          case 'cut':
            document.execCommand('cut')
            break
          case 'copy':
            document.execCommand('copy')
            break
          case 'paste':
            document.execCommand('paste')
            break
          case 'selectAll':
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement
            textarea?.select()
            break
        }
        break

      case 'view':
        switch (command) {
          case 'fullscreen':
            try {
              const editorElem = document.getElementById('editor-container')
              if (editorElem) {
                if (document.fullscreenElement) {
                  document.exitFullscreen()
                } else {
                  editorElem.requestFullscreen()
                }
              }
            } catch (error) {
              console.error("Fullscreen API error:", error)
            }
            break
          case 'zoomIn':
            handleFontSizeChange(Math.min(32, fontSize + 2))
            break
          case 'zoomOut':
            handleFontSizeChange(Math.max(8, fontSize - 2))
            break
          case 'resetZoom':
            handleFontSizeChange(16)
            break
        }
        break

      case 'format':
        switch (command) {
          case 'bold':
          case 'italic':
          case 'underline':
            formatText(command)
            break
          case 'alignLeft':
          case 'alignCenter':
          case 'alignRight':
            formatText('align', command.replace('align', '').toLowerCase())
            break
        }
        break
    }
  }

  // Toggle edit mode
  const toggleEditMode = (mode: 'edit' | 'view') => {
    if (mode === editMode) return
    setEditMode(mode)

    // Save changes when switching to view mode
    if (mode === 'view' && hasUnsavedChanges) {
      handleSaveFile()
    }
  }

  // Function to handle font size changes
  const handleFontSizeChange = (newSize: number) => {
    const size = Math.max(8, Math.min(32, newSize))
    setFontSize(size)

    // Update the textarea font size immediately
    if (textareaRef.current) {
      textareaRef.current.style.fontSize = `${size}px`
    }
  }

  // Add getFileType function
  const getFileType = (filename: string): FileItem["type"] => {
    const extension = filename.split('.').pop()?.toLowerCase()
    if (!extension) return "file"

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const documentExtensions = ['doc', 'docx', 'pdf', 'txt', 'rtf']
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz']

    if (imageExtensions.includes(extension)) return "image"
    if (documentExtensions.includes(extension)) return "document"
    if (archiveExtensions.includes(extension)) return "archive"
    return "file"
  }

  // Add editor rendering functions
  const renderEditorHeader = () => {
    if (!editingFile) return null;

    return (
      <div className="border-b border-gray-800 p-2 flex items-center justify-between bg-black">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={closeEditor}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{editingFile.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => toggleEditMode(editMode === 'edit' ? 'view' : 'edit')}>
            {editMode === 'edit' ? 'View' : 'Edit'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDiscardChanges}>
            Discard
          </Button>
          <Button size="sm" onClick={handleSaveFile}>
            Save
          </Button>
        </div>
      </div>
    )
  }

  const renderEditorToolbar = () => {
    return (
      <div className="flex items-center gap-2 p-2 border-b bg-background">
        <div className="flex items-center gap-1 mr-4 border-r pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-[100px] justify-between">
                {fontSize}px
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[100px]">
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  className="justify-between"
                >
                  {size}px
                  {fontSize === size && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant={fontFormatting.bold ? "secondary" : "ghost"}
          size="icon"
          onClick={() => formatText('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={fontFormatting.italic ? "secondary" : "ghost"}
          size="icon"
          onClick={() => formatText('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={fontFormatting.underline ? "secondary" : "ghost"}
          size="icon"
          onClick={() => formatText('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-2" />
        <Button
          variant={fontFormatting.align === 'left' ? "secondary" : "ghost"}
          size="icon"
          onClick={() => formatText('align', 'left')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={fontFormatting.align === 'center' ? "secondary" : "ghost"}
          size="icon"
          onClick={() => formatText('align', 'center')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={fontFormatting.align === 'right' ? "secondary" : "ghost"}
          size="icon"
          onClick={() => formatText('align', 'right')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const renderEditorContent = () => {
    return (
      <div className="flex-1 p-4 bg-background">
        <textarea
          ref={textareaRef}
          className="w-full h-full resize-none focus:outline-none bg-background text-foreground font-mono"
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '1.5',
            padding: '1rem',
            fontFamily: 'inherit',
          }}
        />
      </div>
    )
  }

  // Handle initial file opening
  useEffect(() => {
    if (initialFileToOpen) {
      const fileToOpen = files.find(f => f.path.join('/') === initialFileToOpen)
      if (fileToOpen) {
        handleFileOpen(fileToOpen)
      }
    }
  }, [initialFileToOpen])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* File Manager Header */}
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder}>
                {index > 0 && <span className="text-gray-400">/</span>}
                <button
                  onClick={() => navigateToFolder({ id: folder, name: folder, type: "folder", modified: new Date(), owner: { name: "You", initials: "YO" }, path: currentPath.slice(0, index + 1) })}
                  className="text-sm hover:text-primary transition-colors"
                >
                  {folder}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFileSelect}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm" onClick={() => createNewFile()}>
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Main content area with file manager - removing calendar sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* File manager content */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "list" ? (
            <div className="space-y-2">
              {files.map((file) => renderFileListItem(file))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => renderFileGridItem(file))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      {isEditorOpen && editingFile && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" id="editor-container">
          {renderEditorHeader()}
          {renderEditorToolbar()}
          {renderEditorContent()}

          {/* Editor footer */}
          <div className="border-t border-gray-800 p-2 flex items-center justify-between text-xs text-gray-400 bg-black">
            <div className="flex items-center gap-4">
              <span>Line: 1, Column: 1</span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{hasUnsavedChanges ? "Modified" : "Saved"}</span>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Dialog */}
      {previewFile && (
        <FilePreview
          file={{
            id: previewFile.id,
            name: previewFile.name,
            type: previewFile.type,
            size: previewFile.size,
            url: previewFile.type === "document" ?
              `/api/files/${previewFile.id}?type=doc` :
              previewFile.type === "image" ?
                `/api/files/${previewFile.id}?type=image` :
                `/api/files/${previewFile.id}`
          }}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onEdit={() => {
            setPreviewOpen(false);
            handleFileOpen(previewFile);
          }}
        />
      )}
    </div>
  );
}

