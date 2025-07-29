"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Users, Star, Clock, MoreVertical, Plus, Search, Filter, ArrowUpDown, Activity, Lock, Trash, Edit, Eye, Share } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

export default function DocumentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [documents, setDocuments] = useState([
    {
      id: "doc-1",
      title: "Project Proposal",
      type: "document",
      modified: "2023-09-15T10:30:00",
      created: "2023-09-10T14:25:00",
      shared: true,
      owner: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      collaborators: [
        {
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JS",
        },
        {
          name: "Mark Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MJ",
        },
      ],
      size: 2.5 * 1024 * 1024, // 2.5 MB
      starred: true,
    },
    {
      id: "doc-2",
      title: "Meeting Notes",
      type: "document",
      modified: "2023-09-20T16:45:00",
      created: "2023-09-20T15:30:00",
      shared: true,
      owner: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      collaborators: [
        {
          name: "Alex Brown",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "AB",
        },
      ],
      size: 450 * 1024, // 450 KB
      starred: false,
    },
    {
      id: "doc-3",
      title: "Budget Forecast",
      type: "spreadsheet",
      modified: "2023-09-18T11:20:00",
      created: "2023-09-05T09:15:00",
      shared: false,
      owner: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      collaborators: [],
      size: 1.8 * 1024 * 1024, // 1.8 MB
      starred: true,
    },
    {
      id: "doc-4",
      title: "Client Presentation",
      type: "presentation",
      modified: "2023-09-22T13:15:00",
      created: "2023-09-21T10:30:00",
      shared: true,
      owner: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JS",
      },
      collaborators: [
        {
          name: "John Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
        },
        {
          name: "Sarah Williams",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "SW",
        },
      ],
      size: 5.2 * 1024 * 1024, // 5.2 MB
      starred: false,
    },
    {
      id: "doc-5",
      title: "Product Roadmap",
      type: "document",
      modified: "2023-09-19T09:45:00",
      created: "2023-09-12T11:20:00",
      shared: true,
      owner: {
        name: "Mark Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      collaborators: [
        {
          name: "John Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
        },
      ],
      size: 1.1 * 1024 * 1024, // 1.1 MB
      starred: false,
    },
    {
      id: "doc-6",
      title: "Marketing Strategy",
      type: "document",
      modified: "2023-09-21T14:30:00",
      created: "2023-09-15T16:45:00",
      shared: false,
      owner: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      collaborators: [],
      size: 3.7 * 1024 * 1024, // 3.7 MB
      starred: true,
    },
  ])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + " B"
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB"
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
    }
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Toggle star
  const toggleStar = (id: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, starred: !doc.starred } : doc
      )
    )
  }

  // Filter documents based on active tab
  const filterDocuments = () => {
    let filtered = [...documents]

    // Apply tab filter
    if (activeTab === "shared") {
      filtered = filtered.filter((doc) => doc.shared)
    } else if (activeTab === "starred") {
      filtered = filtered.filter((doc) => doc.starred)
    } else if (activeTab === "recent") {
      // Sort by modified date and take the most recent 5
      filtered.sort(
        (a, b) =>
          new Date(b.modified).getTime() - new Date(a.modified).getTime()
      )
      filtered = filtered.slice(0, 5)
    }

    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.owner.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const filteredDocuments = filterDocuments()

  const documentIcons = {
    document: (
      <FileText className="h-5 w-5 text-blue-500" />
    ),
    spreadsheet: (
      <FileText className="h-5 w-5 text-green-500" />
    ),
    presentation: (
      <FileText className="h-5 w-5 text-orange-500" />
    ),
  }

  // Update the viewDocument function to redirect to the real-time editor
  const viewDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    // Redirect to the real-time document editor
    router.push(`/dashboard/docs/${documentId}`);

    toast({
      title: "Opening document",
      description: `Opening ${document.title} in the real-time editor.`,
    });
  };

  // Add a downloadDocument function to handle document downloading
  const downloadDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    // In a real app, this would trigger the actual download
    const link = document.title.toLowerCase().replace(/\s+/g, '-') + '.pdf';
    const downloadUrl = `/api/documents/${documentId}/download`;

    // Create a temporary link element to trigger the download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = link;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Download started",
      description: `Downloading ${document.title}`,
    });
  };

  // Add a shareDocument function to handle document sharing
  const shareDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    // Generate a sharing link
    const shareLink = `https://yourapp.com/share/${documentId}`;
    navigator.clipboard.writeText(shareLink);

    toast({
      title: "Link copied",
      description: "Document sharing link has been copied to your clipboard.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Documents</h1>
          <p className="text-muted-foreground">
            Create, collaborate, and organize your documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Types</DropdownMenuItem>
              <DropdownMenuItem>Documents</DropdownMenuItem>
              <DropdownMenuItem>Spreadsheets</DropdownMenuItem>
              <DropdownMenuItem>Presentations</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Latest modified</DropdownMenuItem>
              <DropdownMenuItem>Oldest modified</DropdownMenuItem>
              <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Size (largest)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <DocumentsList
            documents={filteredDocuments}
            toggleStar={toggleStar}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
            documentIcons={documentIcons}
            viewDocument={viewDocument}
            downloadDocument={downloadDocument}
            shareDocument={shareDocument}
          />
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <DocumentsList
            documents={filteredDocuments}
            toggleStar={toggleStar}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
            documentIcons={documentIcons}
            viewDocument={viewDocument}
            downloadDocument={downloadDocument}
            shareDocument={shareDocument}
          />
        </TabsContent>

        <TabsContent value="starred" className="mt-6">
          <DocumentsList
            documents={filteredDocuments}
            toggleStar={toggleStar}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
            documentIcons={documentIcons}
            viewDocument={viewDocument}
            downloadDocument={downloadDocument}
            shareDocument={shareDocument}
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <DocumentsList
            documents={filteredDocuments}
            toggleStar={toggleStar}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
            documentIcons={documentIcons}
            viewDocument={viewDocument}
            downloadDocument={downloadDocument}
            shareDocument={shareDocument}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface DocumentsListProps {
  documents: any[]
  toggleStar: (id: string) => void
  formatDate: (date: string) => string
  formatFileSize: (size: number) => string
  documentIcons: Record<string, JSX.Element>
  viewDocument: (documentId: string) => void
  downloadDocument: (documentId: string) => void
  shareDocument: (documentId: string) => void
}

function DocumentsList({ documents, toggleStar, formatDate, formatFileSize, documentIcons, viewDocument, downloadDocument, shareDocument }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/20">
        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/80" />
        <h3 className="font-medium text-lg mb-1">No documents found</h3>
        <p className="text-muted-foreground mb-4">Try changing your search or filter criteria</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Document
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="bg-muted/50 p-4 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Owner</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>
      <div className="divide-y">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/30 transition-colors"
          >
            <div className="col-span-6 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleStar(doc.id)}
              >
                <Star
                  className={`h-4 w-4 ${
                    doc.starred
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              </Button>
              <div className="bg-primary/10 p-2 rounded-md">
                {documentIcons[doc.type]}
              </div>
              <div className="min-w-0">
                <div
                  className="font-medium truncate hover:text-primary cursor-pointer"
                  onClick={() => viewDocument(doc.id)}
                >
                  {doc.title}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  {doc.shared ? (
                    <>
                      <Users className="h-3 w-3" /> Shared with{" "}
                      {doc.collaborators.length} people
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" /> Only you
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{doc.owner.initials}</AvatarFallback>
                <AvatarImage src={doc.owner.avatar} alt={doc.owner.name} />
              </Avatar>
              <span className="truncate text-sm">{doc.owner.name}</span>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">
              {formatDate(doc.modified)}
            </div>
            <div className="col-span-1 text-sm text-muted-foreground">
              {formatFileSize(doc.size)}
            </div>
            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => viewDocument(doc.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadDocument(doc.id)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareDocument(doc.id)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
