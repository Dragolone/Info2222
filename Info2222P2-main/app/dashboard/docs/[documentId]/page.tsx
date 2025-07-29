"use client"

import { useEffect, useState } from 'react'
import { DocumentEditor } from '@/components/document-editor'
import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

// Sample document content for different document IDs
const sampleDocumentContents = {
  'doc-1': `# Project Proposal: Team Collaboration Platform

## Overview
This **project proposal** outlines our plan to develop a *collaborative platform* for team productivity.

## Goals
- Increase team efficiency by __20%__
- Reduce meeting time by ~~50%~~ 30%
- <center>Improve customer satisfaction</center>

## Timeline
1. Research phase: 2 weeks
2. Design phase: 3 weeks
3. Development phase: 8 weeks
4. Testing phase: 4 weeks

<right>**Total timeline: 17 weeks**</right>

## Budget
<left>The estimated budget for this project is $75,000 including all resources and contingency.</left>`,

  'doc-2': `# Meeting Minutes: Product Strategy Session

## Attendees
- Alice Smith (Product Manager)
- Bob Johnson (Engineering Lead)
- Carol Williams (UX Designer)
- David Brown (Marketing)

## Agenda
1. **Review Q3 goals**
2. *Product roadmap updates*
3. Feature prioritization
4. <center>Next steps and action items</center>

## Discussion Points
- Marketing strategy for the new feature release
- Customer feedback from beta testing
- Resource allocation for Q4

## Action Items
- Alice: <center>Finalize product roadmap by Friday</center>
- Bob: Prepare technical specifications
- Carol: <right>Create wireframes for new features</right>
- David: <left>Develop marketing communication plan</left>`,

  'doc-3': `# Product Roadmap 2023-2024

## Q4 2023
- **Launch mobile application**
- *Redesign dashboard interface*
- Add collaboration features
- <center>Beta test premium subscription model</center>

## Q1 2024
1. API integrations with third-party tools
2. Advanced analytics dashboard
3. Custom reporting features

## Q2 2024
- <right>Enterprise-level security features</right>
- Team management enhancements
- <left>Localization for international markets</left>

## Q3 2024
- **AI-powered recommendations**
- Workflow automation tools
- Performance optimization`,

  'doc-4': `# Research Notes: User Behavior Analysis

## Methodology
This research uses **mixed methods** to analyze *user behaviors* and preferences.

## Key Findings
- Users spend an average of __45 minutes__ per session
- Mobile usage increased by ~~15%~~ 27% in Q3
- <center>Feature discovery remains a challenge</center>

## User Segments
1. Power users (daily active)
2. Regular users (weekly active)
3. Occasional users (monthly active)

## Recommendations
<right>**Simplify onboarding process**</right>
<left>Improve feature discoverability through tooltips</left>
<center>Enhance mobile experience with responsive design</center>`
}

// Default document content for new documents
const defaultContent = `# Untitled Document

## Introduction
Start typing your document here...

## Section 1
**Bold text**, *italic text*, and __underlined text__ are supported.

## Section 2
- You can create bullet points
- And organize your thoughts

## Section 3
1. Numbered lists work too
2. For sequential steps
3. Or prioritized tasks`

// Document collaborators
const documentCollaborators = {
  'doc-1': [
    { id: 'user1', name: 'Alice Smith', color: '#4285F4' },
    { id: 'user2', name: 'Bob Johnson', color: '#EA4335' },
    { id: 'user3', name: 'Carol Williams', color: '#FBBC05' }
  ],
  'doc-2': [
    { id: 'user1', name: 'Alice Smith', color: '#4285F4' },
    { id: 'user4', name: 'David Brown', color: '#34A853' }
  ],
  'doc-3': [
    { id: 'user1', name: 'Alice Smith', color: '#4285F4' },
    { id: 'user2', name: 'Bob Johnson', color: '#EA4335' },
    { id: 'user5', name: 'Emma Davis', color: '#9C27B0' }
  ],
  'doc-4': [
    { id: 'user1', name: 'Alice Smith', color: '#4285F4' }
  ]
}

// Document titles
const documentTitles = {
  'doc-1': 'Project Proposal',
  'doc-2': 'Meeting Minutes',
  'doc-3': 'Product Roadmap',
  'doc-4': 'Research Notes'
}

export default function DocumentPage() {
  // Get params using the useParams hook instead of direct props
  const params = useParams()
  const documentId = params.documentId as string

  const [loading, setLoading] = useState(true)
  const [documentData, setDocumentData] = useState<{
    id: string;
    title: string;
    content: string;
    collaborators: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  } | null>(null)

  useEffect(() => {
    // Simulate loading document data
    const timer = setTimeout(() => {
      // First, try to load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const storedDocs = JSON.parse(localStorage.getItem('userDocuments') || '[]')
          const storedDoc = storedDocs.find((doc: any) => doc.id === documentId)

          if (storedDoc) {
            // If found in localStorage, use that data
            setDocumentData({
              id: documentId,
              title: storedDoc.title,
              content: storedDoc.content,
              collaborators: storedDoc.collaborators || [
                { id: 'user1', name: 'Alice Smith', color: '#4285F4' }
              ]
            })
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Error loading document from localStorage', e)
        }
      }

      // If not found in localStorage, fall back to sample data
      const content = sampleDocumentContents[documentId as keyof typeof sampleDocumentContents] || defaultContent
      const title = documentTitles[documentId as keyof typeof documentTitles] || 'Untitled Document'
      const collaborators = documentCollaborators[documentId as keyof typeof documentCollaborators] || [
        { id: 'user1', name: 'Alice Smith', color: '#4285F4' }
      ]

      setDocumentData({
        id: documentId,
        title,
        content,
        collaborators
      })

      setLoading(false)
    }, 800) // Simulate network delay

    return () => clearTimeout(timer)
  }, [documentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-4">The document you're looking for doesn't exist or you don't have access.</p>
      </div>
    )
  }

  return <DocumentEditor
    documentId={documentData.id}
    initialTitle={documentData.title}
    initialContent={documentData.content}
    collaborators={documentData.collaborators}
  />
}
