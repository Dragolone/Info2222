"use client"

import React, { useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  FileText,
  Folder,
  Image as ImageIcon,
  FileArchive,
  File,
  ArrowLeft,
  Star,
  Trash2,
  MoreHorizontal,
  Download,
  Share,
  Eye,
  ExternalLink,
  Save,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function FilesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const fileToOpen = searchParams?.get('path')
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view")
  const [activeFile, setActiveFile] = useState<any | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorContent, setEditorContent] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isFileOpening, setIsFileOpening] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Simple file data
  const files = [
    {
      id: "folder-1",
      name: "Project Documentation",
      type: "folder",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 3),
      path: [],
      starred: false
    },
    {
      id: "file-1",
      name: "Project_Requirements.docx",
      type: "document",
      size: 2500000,
      modified: new Date(Date.now() - 1000 * 60 * 30),
      path: [],
      starred: true
    },
    {
      id: "file-2",
      name: "Design_Mockups.fig",
      type: "file",
      size: 8500000,
      modified: new Date(Date.now() - 1000 * 60 * 60 * 2),
      path: [],
      starred: false
    },
    {
      id: "file-3",
      name: "Meeting_Screenshot.png",
      type: "image",
      size: 1200000,
      modified: new Date(Date.now() - 1000 * 60 * 120),
      path: [],
      starred: false
    },
  ]

  // Helper functions
  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder className="h-5 w-5 text-blue-500" />
      case "image":
        return <ImageIcon className="h-5 w-5 text-purple-500" />
      case "document":
        return <FileText className="h-5 w-5 text-green-500" />
      case "archive":
        return <FileArchive className="h-5 w-5 text-amber-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 Byte"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

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

  const filteredFiles = files.filter(file => {
    return currentPath.length === 0
      ? file.path.length === 0
      : JSON.stringify(file.path) === JSON.stringify(currentPath)
  })

  // Navigate back to dashboard
  const goBack = () => {
    router.push('/dashboard')
  }

  const navigateToFolder = (folder: any) => {
    setCurrentPath([...folder.path, folder.name])
  }

  const navigateUp = () => {
    setCurrentPath(currentPath.slice(0, -1))
  }

  // Toggle star for a file (fixed to actually toggle the star state)
  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Create a new array with the updated starred status
    const updatedFiles = files.map(file => {
      if (file.id === id) {
        const newStarredStatus = !file.starred;

        // Show toast notification
        toast({
          title: newStarredStatus ? "Added to starred" : "Removed from starred",
          description: `"${file.name}" has been ${newStarredStatus ? "added to" : "removed from"} starred items`,
        });

        // Return a new object with updated starred status
        return { ...file, starred: newStarredStatus };
      }
      return file;
    });

    // Update the files array
    const fileIndex = files.findIndex(file => file.id === id);
    if (fileIndex !== -1) {
      files[fileIndex] = updatedFiles[fileIndex];
    }
  }

  // Enhanced file opening with appropriate behavior based on file type
  const handleOpenFile = (file: any) => {
    if (file.type === "folder") {
      navigateToFolder(file);
    } else {
      setIsFileOpening(true);
      setActiveFile(file);

      // Simulate file opening process
      toast({
        title: "Opening file",
        description: `Preparing ${file.name}...`,
      });

      setTimeout(() => {
        setIsFileOpening(false);

        // Different behavior based on file type
        if (file.type === "document") {
          // For documents, open in the editor
          openInEditor(file);
        } else if (file.type === "image") {
          // For images, show in preview
          handlePreviewFile(file);
        } else {
          // Generic file handler
          window.open(`https://example.com/view/${file.id}`, '_blank');
          toast({
            title: "File opened",
            description: `${file.name} has been opened in a new tab`,
          });
        }
      }, 1500);
    }
  }

  // Open document in editor
  const openInEditor = (file: any) => {
    setActiveFile(file);
    setIsEditorOpen(true);
    setHasUnsavedChanges(false);

    // Generate mock content based on file type/name
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    let mockContent = '';

    if (['doc', 'docx'].includes(fileExtension)) {
      mockContent = `# ${file.name.split('.')[0]}

This is a sample document that you can edit.

## Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies aliquam, nunc nisl aliquet nunc, eget aliquam nisl nunc eget nisl.

## Details
- Point 1: Important information about the project
- Point 2: Timeline and milestones
- Point 3: Resources and budget

## Conclusion
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
    } else {
      mockContent = `Content of ${file.name}

This is a sample file content for demonstration purposes.
In a real implementation, this would be the actual content of the file.`;
    }

    setEditorContent(mockContent);
  }

  // Save editor content
  const saveEditorContent = () => {
    setHasUnsavedChanges(false);

    toast({
      title: "File saved",
      description: `Changes to ${activeFile?.name} have been saved.`,
    });

    // In a real application, this would save the content to the server
  }

  // Close editor
  const closeEditor = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        setIsEditorOpen(false);
        setActiveFile(null);
        setEditorContent("");
      }
    } else {
      setIsEditorOpen(false);
      setActiveFile(null);
      setEditorContent("");
    }
  }

  // Handle editor content change
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
    setHasUnsavedChanges(true);
  }

  // Apply text formatting
  const applyFormatting = (format: string) => {
    // This is a simplified version - in a real app, you'd want to handle selections properly
    toast({
      title: "Formatting applied",
      description: `${format} formatting has been applied to the selected text.`,
    });
  }

  // Enhanced preview with better file type handling
  const handlePreviewFile = (file: any) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }

  // Enhanced download with progress tracking
  const handleDownloadFile = (file: any) => {
    setIsDownloading(file.id);
    setDownloadProgress(0);

    toast({
      title: "Download started",
      description: `Downloading ${file.name}...`,
    });

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const newProgress = prev + Math.random() * 10;

        if (newProgress >= 100) {
          clearInterval(interval);

          // Create a fake download
          setTimeout(() => {
            const element = document.createElement("a");
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

            // Create appropriate mock content based on file type
            let content = `Sample content for ${file.name}`;
            let mimeType = "text/plain";

            if (['doc', 'docx', 'pdf'].includes(fileExtension)) {
              mimeType = "application/octet-stream";
            } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
              // For images, use a data URL
              element.href = "data:,"; // Empty data URL as a placeholder
              element.download = file.name;
              element.click();

              setIsDownloading(null);
              toast({
                title: "Download complete",
                description: `${file.name} has been downloaded`,
              });
              return 100;
            }

            const blob = new Blob([content], { type: mimeType });
            element.href = URL.createObjectURL(blob);
            element.download = file.name;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            setIsDownloading(null);
            toast({
              title: "Download complete",
              description: `${file.name} has been downloaded`,
            });
          }, 500);

          return 100;
        }

        return newProgress;
      });
    }, 200);
  }

  // Enhanced sharing with email input
  const handleShareFile = (file: any) => {
    setActiveFile(file);
    setIsShareDialogOpen(true);
    setShareEmail("");
    setShareSuccess(false);

    // Focus the email input after dialog opens
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 100);
  }

  // Process share form submission
  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shareEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to share this file",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);

    // Simulate sharing process
    setTimeout(() => {
      setIsSharing(false);
      setShareSuccess(true);

      // Generate a mock share link
      const shareLink = `https://example.com/shared/${activeFile.id}?shared-by=you&permission=${sharePermission}`;
      navigator.clipboard.writeText(shareLink);

      toast({
        title: "File shared",
        description: `${activeFile.name} has been shared with ${shareEmail} (${sharePermission === "edit" ? "Can edit" : "View only"})`,
      });

      // Close dialog after success
      setTimeout(() => {
        setIsShareDialogOpen(false);
      }, 2000);
    }, 1500);
  }

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Mock deleting a file
    toast({
      title: "File deleted",
      description: `The file has been moved to trash`,
    });
  }

  return (
    <div className="p-4 h-screen bg-background max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={goBack}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Files</h1>
      </div>

      {/* Path navigation */}
      <div className="flex items-center gap-2 mb-4">
        {currentPath.length > 0 && (
          <Button
            onClick={navigateUp}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            Back
          </Button>
        )}
        <div className="flex items-center gap-1">
          {currentPath.map((folder, index) => (
            <React.Fragment key={folder}>
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <span className="text-muted-foreground">{folder}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* File list */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-3 border-b grid grid-cols-12 text-sm font-medium text-muted-foreground">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3">Modified</div>
          <div className="col-span-1"></div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No files found in this location
          </div>
        ) : (
          <div>
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className={cn(
                  "p-3 border-b last:border-b-0 grid grid-cols-12 items-center",
                  "group transition-colors",
                  file.type === 'folder' ? 'cursor-pointer' : '',
                  "hover:bg-accent/40 dark:hover:bg-accent/20"
                )}
                onClick={() => file.type === 'folder' ? navigateToFolder(file) : handleOpenFile(file)}
              >
                <div className="col-span-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md flex items-center justify-center bg-muted/60">
                    {getFileIcon(file.type)}
                  </div>
                  <span className="font-medium">{file.name}</span>
                  {file.type === "folder" && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Folder
                    </Badge>
                  )}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {file.size ? formatFileSize(file.size) : "—"}
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {formatDate(file.modified)}
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => toggleStar(file.id, e)}
                  >
                    <Star className={`h-4 w-4 ${file.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFile(file);
                      }}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewFile(file);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleShareFile(file);
                      }}>
                        <Share className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id, e);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog - Enhanced with file type specific previews */}
      {previewFile && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <span>{previewFile.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {previewFile.type === "image" ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-black/5">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
                    <span className="text-muted-foreground ml-2">Image Preview</span>
                  </div>
                </div>
              ) : previewFile.type === "document" ? (
                <div className="border rounded-md h-80 overflow-hidden flex flex-col">
                  <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                    <span className="text-sm font-medium">Document Preview</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleDownloadFile(previewFile)}
                      >
                        {isDownloading === previewFile.id ? (
                          <>
                            <Spinner className="mr-1" size="sm" />
                            <span className="text-xs">{downloadProgress.toFixed(0)}%</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">Download</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-auto prose prose-sm max-w-none">
                    <h1>{previewFile.name.split('.')[0]}</h1>
                    <p>This is a preview of the document content. In a real implementation, the actual document content would be displayed here.</p>
                    <h2>Sample Content</h2>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, eget aliquam nisl nunc eget nunc.</p>
                    <ul>
                      <li>Item 1</li>
                      <li>Item 2</li>
                      <li>Item 3</li>
                    </ul>
                    <p>Additional content would be shown here based on the actual document.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-6 border rounded-lg bg-muted/20 flex flex-col items-center justify-center h-60">
                  {getFileIcon(previewFile.type)}
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Preview not available for this file type.<br />
                    You can download the file to view its contents.
                  </p>
                  <Button
                    onClick={() => handleDownloadFile(previewFile)}
                    className="mt-4"
                  >
                    {isDownloading === previewFile.id ? (
                      <>
                        <Spinner className="mr-2" size="sm" />
                        {downloadProgress.toFixed(0)}%
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
              >
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleShareFile(previewFile);
                  }}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  onClick={() => {
                    handleDownloadFile(previewFile);
                  }}
                  disabled={isDownloading === previewFile.id}
                >
                  {isDownloading === previewFile.id ? (
                    <>
                      <Spinner className="mr-2" size="sm" />
                      {downloadProgress.toFixed(0)}%
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* File Opening Dialog */}
      {isFileOpening && activeFile && (
        <Dialog open={isFileOpening} onOpenChange={setIsFileOpening}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(activeFile.type)}
                <span>Opening {activeFile.name}</span>
              </DialogTitle>
              <DialogDescription>
                Please wait while we prepare this file for you.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center justify-center">
              <Spinner size="xl" className="text-primary" />
              <p className="text-sm text-muted-foreground mt-4">
                Preparing file content...
              </p>
              <Progress value={65} className="w-full mt-4" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Text Editor Dialog */}
      {activeFile && (
        <Dialog open={isEditorOpen} onOpenChange={(open) => !open && closeEditor()}>
          <DialogContent className="sm:max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(activeFile.type)}
                  <span>{activeFile.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveEditorContent}
                    disabled={!hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="border rounded-md mt-2 flex-1 flex flex-col">
              <div className="bg-muted px-4 py-2 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormatting('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormatting('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormatting('underline')}
                >
                  <Underline className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormatting('align-left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormatting('align-center')}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormatting('align-right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                className="flex-1 p-4 resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                value={editorContent}
                onChange={handleEditorChange}
                placeholder="Start typing..."
              />
            </div>

            <div className="flex justify-between mt-4">
              <div>
                {hasUnsavedChanges && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    You have unsaved changes
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closeEditor}
                >
                  Close
                </Button>
                <Button
                  onClick={saveEditorContent}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog with Dropdown instead of radio buttons */}
      {activeFile && (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share className="h-5 w-5" />
                <span>Share {activeFile?.name}</span>
              </DialogTitle>
              <DialogDescription>
                Enter an email address to share this file with someone.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleShareSubmit}>
              <div className="py-4 space-y-6">
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="email" className="text-base">Email address</Label>
                  <div className="flex w-full items-center space-x-2">
                    <Input
                      ref={emailInputRef}
                      id="email"
                      placeholder="example@email.com"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      disabled={isSharing || shareSuccess}
                      className="flex-1"
                    />
                  </div>
                </div>

                {shareSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 rounded-md text-sm">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      <span className="font-medium">Shared successfully with {shareEmail}</span>
                    </div>
                    <p className="text-xs mt-2 text-green-600 dark:text-green-500">
                      A link has been copied to your clipboard that you can share manually if needed.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="permission" className="text-base">Permission level</Label>
                  <Select
                    value={sharePermission}
                    onValueChange={(value) => setSharePermission(value as "view" | "edit")}
                    disabled={isSharing || shareSuccess}
                  >
                    <SelectTrigger className="w-full" id="permission">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View only (Recipient can view but not edit)</SelectItem>
                      <SelectItem value="edit">Can edit (Recipient can make changes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="hover:bg-red-500 hover:text-white"
                  onClick={() => setIsShareDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSharing || shareSuccess}
                >
                  {isSharing ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : shareSuccess ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Share className="h-4 w-4 mr-2" />
                  )}
                  Share
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Download Progress Overlay */}
      {isDownloading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Downloading...</span>
            </div>
            <span className="text-xs text-muted-foreground">{downloadProgress.toFixed(0)}%</span>
          </div>
          <Progress value={downloadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {files.find(f => f.id === isDownloading)?.name}
          </p>
        </div>
      )}
    </div>
  )
}

