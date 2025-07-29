"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { FileText, Plus, Search, Users, Clock, Star } from 'lucide-react'

// Sample documents data
const sampleDocuments = [
  {
    id: 'doc-1',
    title: 'Project Proposal',
    createdAt: '2023-10-15T14:30:00Z',
    updatedAt: '2023-10-20T09:15:00Z',
    starred: true,
    collaborators: [
      { id: 'user1', name: 'Alice Smith', color: '#4285F4' },
      { id: 'user2', name: 'Bob Johnson', color: '#EA4335' },
      { id: 'user3', name: 'Carol Williams', color: '#FBBC05' }
    ]
  },
  {
    id: 'doc-2',
    title: 'Meeting Minutes',
    createdAt: '2023-10-18T11:00:00Z',
    updatedAt: '2023-10-19T16:45:00Z',
    starred: false,
    collaborators: [
      { id: 'user1', name: 'Alice Smith', color: '#4285F4' },
      { id: 'user4', name: 'David Brown', color: '#34A853' }
    ]
  },
  {
    id: 'doc-3',
    title: 'Product Roadmap',
    createdAt: '2023-09-25T09:00:00Z',
    updatedAt: '2023-10-21T10:30:00Z',
    starred: true,
    collaborators: [
      { id: 'user1', name: 'Alice Smith', color: '#4285F4' },
      { id: 'user2', name: 'Bob Johnson', color: '#EA4335' },
      { id: 'user5', name: 'Emma Davis', color: '#9C27B0' }
    ]
  },
  {
    id: 'doc-4',
    title: 'Research Notes',
    createdAt: '2023-10-10T13:45:00Z',
    updatedAt: '2023-10-18T14:20:00Z',
    starred: false,
    collaborators: [
      { id: 'user1', name: 'Alice Smith', color: '#4285F4' }
    ]
  }
]

export default function DocumentsListPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState(() => {
    // Try to load documents from localStorage
    if (typeof window !== 'undefined') {
      const storedDocs = JSON.parse(localStorage.getItem('userDocuments') || '[]');
      return [...storedDocs, ...sampleDocuments]; // Combine stored docs with sample docs
    }
    return sampleDocuments;
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  // Handle document click
  const openDocument = (docId: string) => {
    router.push(`/dashboard/docs/${docId}`)
  }

  // Handle create new document
  const createNewDocument = () => {
    const newId = `doc-${Date.now()}`
    const newDoc = {
      id: newId,
      title: 'Untitled Document',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      collaborators: [{ id: 'user1', name: 'Alice Smith', color: '#4285F4' }]
    }

    // Add the new document to the list
    setDocuments([newDoc, ...documents])

    // Store in localStorage to persist across sessions
    const storedDocs = JSON.parse(localStorage.getItem('userDocuments') || '[]')
    localStorage.setItem('userDocuments', JSON.stringify([newDoc, ...storedDocs]))

    // Navigate to the new document
    router.push(`/dashboard/docs/${newId}`)
  }

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Button onClick={createNewDocument}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map(doc => (
          <Card
            key={doc.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openDocument(doc.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                </div>
                {doc.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </div>
              <CardDescription>Updated {formatDate(doc.updatedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>Created {formatDate(doc.createdAt)}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {doc.collaborators.slice(0, 3).map((user, i) => (
                    <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback style={{ backgroundColor: user.color, fontSize: '10px' }}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {doc.collaborators.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      +{doc.collaborators.length - 3}
                    </div>
                  )}
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  {doc.collaborators.length} {doc.collaborators.length === 1 ? 'collaborator' : 'collaborators'}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Users className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
