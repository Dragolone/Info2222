"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FilePreviewProps {
  file: {
    id: string
    name: string
    type: string
    size?: number
    url?: string
    content?: string // For text-based files
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
}

export function FilePreview({ file, open, onOpenChange, onEdit }: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Determine file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

  // Handle image load complete
  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // Simulate PDF loading
  const handlePdfLoad = () => {
    // Simulate loading delay and page count for PDF
    setTimeout(() => {
      setIsLoading(false)
      setTotalPages(Math.floor(Math.random() * 10) + 1) // Random page count between 1-10
    }, 1500)
  }

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Navigate between pages (for PDFs)
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Use effect to handle loading based on file type
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
        // For images, create a simulated delayed loading to demonstrate the process
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      } else if (fileExtension === 'pdf') {
        handlePdfLoad()
      } else {
        // For other file types, simulate a short loading time
        setTimeout(() => {
          setIsLoading(false)
        }, 800)
      }
    }
  }, [open, fileExtension])

  // Get sample image URL based on file type (for demo purposes)
  const getSampleImageUrl = () => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      // Use placeholder images for demo
      return `https://images.unsplash.com/photo-1682687982360-3fbccf6a753a?q=80&w=800&h=600&auto=format&fit=crop`
    }
    return ''
  }

  // Get the appropriate preview content based on file type
  const renderPreview = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      )
    }

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return (
        <div className="flex items-center justify-center w-full">
          <img
            src={file.url || getSampleImageUrl()}
            alt={file.name}
            className="max-h-[70vh] w-auto object-contain"
            onLoad={handleImageLoad}
          />
        </div>
      )
    }

    // PDF files
    if (fileExtension === 'pdf') {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-muted rounded-lg p-8 mb-4 min-h-[500px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center">
              <FileText className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">PDF Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">Page {currentPage} of {totalPages}</p>
              <div className="bg-background border rounded-lg p-4 w-full max-w-lg">
                <p className="text-sm">This is a simulated content for page {currentPage} of {file.name}</p>
                <p className="text-sm mt-2">PDF previews would typically use a PDF rendering library in a real implementation.</p>
              </div>
            </div>
          </div>

          {/* PDF navigation controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )
    }

    // Word documents
    if (['doc', 'docx'].includes(fileExtension)) {
      return (
        <div className="bg-muted rounded-lg p-8 min-h-[500px] w-full flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{file.name.replace(`.${fileExtension}`, '')}</h1>
            <div className="prose">
              <p>This is a simulated preview of a document file.</p>
              <p>In a real implementation, you would use a document rendering library or service to convert and display the contents of the file.</p>
              <h2>Sample document content:</h2>
              <ul>
                <li>Introduction</li>
                <li>Project Overview</li>
                <li>Key Requirements</li>
                <li>Timeline</li>
                <li>Budget Considerations</li>
              </ul>
              <p>For security and privacy reasons, many applications generate document previews on the server-side and deliver them as images or HTML to the client.</p>
            </div>
          </div>
        </div>
      )
    }

    // Default for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <File className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">Preview not available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Preview is not available for {fileExtension?.toUpperCase()} files
        </p>
        <div className="flex gap-2">
          <Button onClick={() => window.open(file.url, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download to view
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Open & Edit
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[700px] md:max-w-[900px] p-0",
          isFullscreen && "w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh]"
        )}
      >
        <DialogHeader className="px-4 py-2 flex flex-row items-center justify-between">
          <div className="flex items-center">
            {fileExtension === 'pdf' && <FileText className="h-5 w-5 mr-2 text-red-500" />}
            {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension) && <ImageIcon className="h-5 w-5 mr-2 text-blue-500" />}
            {['doc', 'docx'].includes(fileExtension) && <FileText className="h-5 w-5 mr-2 text-blue-600" />}
            {!['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx'].includes(fileExtension) && <File className="h-5 w-5 mr-2" />}

            <DialogTitle className="text-base">{file.name}</DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className={cn(
          "p-4",
          isFullscreen ? "max-h-[calc(95vh-120px)]" : "max-h-[70vh]"
        )}>
          {renderPreview()}
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center p-4 border-t">
          <div>
            <Badge variant="outline" className="mr-2">
              {fileExtension.toUpperCase()}
            </Badge>
            {file.size && (
              <span className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to concatenate class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
