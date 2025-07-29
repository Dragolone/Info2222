"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  MoreVertical,
  Clock,
  Users,
  UserPlus,
  Share2,
  Eye,
  PencilLine,
  FileText,
  Star,
  ExternalLink,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react'
import ReactDOMServer from 'react-dom/server'
import CollaborativeCursor from '@/components/collaborative-cursor'
import { useRouter } from 'next/navigation'
import {
  formatContent,
  formatInlineStyles,
  findNodeAtPosition,
  getTextPosition,
  findWordBoundaryAtPosition,
  getNewSelectionRange
} from '@/lib/document-utils'
import { useDocumentSocket } from '@/lib/document-socket'

interface DocumentEditorProps {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  collaborators: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  collaborators
}: DocumentEditorProps) {
  const router = useRouter()

  // Document state
  const [documentName, setDocumentName] = useState(initialTitle)
  const [isRenaming, setIsRenaming] = useState(initialTitle === 'Untitled Document')
  const [content, setContent] = useState(initialContent)
  const [activeTab, setActiveTab] = useState("edit")
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const editorRef = useRef<HTMLTextAreaElement>(null)

  // Current user state
  const [currentUser, setCurrentUser] = useState(() => {
    // In a real app, this would come from authentication
    return {
      id: 'user1',
      name: 'Alice Smith',
      color: '#4285F4'
    };
  });

  // Connect to document socket
  const {
    connected,
    collaborators: socketCollaborators,
    sendCursorUpdate,
    sendTextUpdate,
    sendTitleUpdate
  } = useDocumentSocket(documentId, currentUser.id);

  // Initialize users with collaborators
  const [users, setUsers] = useState<Record<string, {
    id: string;
    name: string;
    color: string;
    cursor: number;
    lastActive: number;
  }>>({});

  // Update users when collaborators change
  useEffect(() => {
    const initialUsers: Record<string, any> = {};

    // Add current user
    initialUsers[currentUser.id] = {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      cursor: 0,
      lastActive: Date.now()
    };

    // Add collaborators from props
    collaborators.forEach((user, index) => {
      if (user.id !== currentUser.id) {
        initialUsers[user.id] = {
          id: user.id,
          name: user.name,
          color: user.color,
          cursor: index * 10, // Spread cursors around
          lastActive: Date.now()
        };
      }
    });

    setUsers(initialUsers);
  }, [collaborators, currentUser]);

  // Update users when socket collaborators change
  useEffect(() => {
    setUsers(prev => ({
      ...prev,
      ...socketCollaborators
    }));
  }, [socketCollaborators]);

  // Update the editor's useEffect hook to properly handle content changes
  useEffect(() => {
    if (!editorRef.current || activeTab !== 'edit') return;

    // Set focus to editor when tab becomes active
    if (activeTab === 'edit') {
      editorRef.current.focus();
    }

    const handleSelectionChange = () => {
      if (!editorRef.current) return;

      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;

      setSelection({ start, end });
      sendCursorUpdate(end);
    };

    const handleKeyUp = () => {
      handleSelectionChange();
    };

    editorRef.current.addEventListener('select', handleSelectionChange);
    editorRef.current.addEventListener('keyup', handleKeyUp);
    editorRef.current.addEventListener('click', handleSelectionChange);
    editorRef.current.addEventListener('focus', handleSelectionChange);

    return () => {
      if (!editorRef.current) return;
      editorRef.current.removeEventListener('select', handleSelectionChange);
      editorRef.current.removeEventListener('keyup', handleKeyUp);
      editorRef.current.removeEventListener('click', handleSelectionChange);
      editorRef.current.removeEventListener('focus', handleSelectionChange);
    };
  }, [activeTab, sendCursorUpdate]);

  // Apply formatting
  const applyFormatting = (format: string) => {
    if (!editorRef.current) return;

    const editorElement = editorRef.current;
    const { start, end } = selection;

    // If there's no selection, just toggle the format in the active formats
    if (start === end) {
      setActiveFormats(prev =>
        prev.includes(format)
          ? prev.filter(f => f !== format)
          : [...prev, format]
      );
      return;
    }

    // Get selected text
    const selectedText = content.substring(start, end);

    // Trimmed version for format checking
    const trimmedText = selectedText.trim();

    // Check if the text already has this formatting
    const hasFormatting = checkFormatting(selectedText, format);

    // Variable to store the new content
    let newContent = content;

    // Toggle formatting based on format type
    if (hasFormatting) {
      // Remove formatting
      switch (format) {
        case 'bold':
          newContent = content.substring(0, start) +
                      selectedText.replace(/^\*\*([\s\S]+)\*\*$/, '$1') +
                      content.substring(end);
          break;
        case 'italic':
          newContent = content.substring(0, start) +
                      selectedText.replace(/^\*([\s\S]+)\*$/, '$1') +
                      content.substring(end);
          break;
        case 'underline':
          newContent = content.substring(0, start) +
                      selectedText.replace(/^__([\s\S]+)__$/, '$1') +
                      content.substring(end);
          break;
        case 'align-center':
          newContent = content.substring(0, start) +
                      selectedText.replace(/^<center>([\s\S]+)<\/center>$/, '$1') +
                      content.substring(end);
          break;
        case 'align-right':
          newContent = content.substring(0, start) +
                      selectedText.replace(/^<right>([\s\S]+)<\/right>$/, '$1') +
                      content.substring(end);
          break;
        case 'align-left':
          newContent = content.substring(0, start) +
                      selectedText.replace(/^<left>([\s\S]+)<\/left>$/, '$1') +
                      content.substring(end);
          break;
      }
    } else {
      // Add formatting
      switch (format) {
        case 'bold':
          newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
          break;
        case 'italic':
          newContent = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
          break;
        case 'underline':
          newContent = content.substring(0, start) + `__${selectedText}__` + content.substring(end);
          break;
        case 'align-center':
          newContent = content.substring(0, start) + `<center>${selectedText}</center>` + content.substring(end);
          break;
        case 'align-right':
          newContent = content.substring(0, start) + `<right>${selectedText}</right>` + content.substring(end);
          break;
        case 'align-left':
          newContent = content.substring(0, start) + `<left>${selectedText}</left>` + content.substring(end);
          break;
      }
    }

    // Apply the change
    setContent(newContent);
    sendTextUpdate(newContent);

    // Calculate new selection range
    const newRange = getNewSelectionRange(format, selectedText, start, end, hasFormatting);

    // Set cursor back to the selection
    setTimeout(() => {
      if (editorElement) {
        editorElement.focus();
        editorElement.setSelectionRange(newRange.start, newRange.end);

        // Update selection state
        setSelection({
          start: newRange.start,
          end: newRange.end
        });
      }
    }, 0);
  };

  // Helper function to check if text already has formatting
  const checkFormatting = (text: string, format: string): boolean => {
    switch (format) {
      case 'bold':
        return /^\*\*([\s\S]+)\*\*$/.test(text.trim());
      case 'italic':
        return /^\*([\s\S]+)\*$/.test(text.trim()) && !text.trim().startsWith('**') && !text.trim().endsWith('**');
      case 'underline':
        return /^__([\s\S]+)__$/.test(text.trim());
      case 'align-center':
        return /^<center>([\s\S]+)<\/center>$/.test(text.trim());
      case 'align-right':
        return /^<right>([\s\S]+)<\/right>$/.test(text.trim());
      case 'align-left':
        return /^<left>([\s\S]+)<\/left>$/.test(text.trim());
      default:
        return false;
    }
  };

  // Handle title change
  const handleNameChange = (newTitle: string) => {
    if (newTitle.trim()) {
      setDocumentName(newTitle.trim())
      sendTitleUpdate(newTitle.trim())

      // Store updated title in localStorage if supported
      if (typeof window !== 'undefined') {
        try {
          const storedDocs = JSON.parse(localStorage.getItem('userDocuments') || '[]')
          const updatedDocs = storedDocs.map((doc: any) =>
            doc.id === documentId ? { ...doc, title: newTitle.trim(), updatedAt: new Date().toISOString() } : doc
          )
          localStorage.setItem('userDocuments', JSON.stringify(updatedDocs))
        } catch (e) {
          console.error('Error updating document title in localStorage', e)
        }
      }
    }
  }

  // Update cursor selection handling to check for active formatting
  useEffect(() => {
    if (!content || selection.start === selection.end) {
      // If no selection, check formatting at cursor position
      const formats = detectFormattingAtPosition(content, selection.start);
      setActiveFormats(formats);
    } else {
      // If there's a selection, check if the entire selection has formatting
      const selectedText = content.substring(selection.start, selection.end);
      const formats = detectFormattingInText(selectedText);
      setActiveFormats(formats);
    }
  }, [content, selection]);

  // Helper function to detect formatting at a position
  const detectFormattingAtPosition = (text: string, position: number): string[] => {
    const formats: string[] = [];

    // Find the word or element at the position
    const { start, end } = findWordBoundaryAtPosition(text, position);
    if (start === end) return formats;

    const wordOrElement = text.substring(Math.max(0, start - 10), Math.min(text.length, end + 10));

    // Check for formatting patterns
    if (wordOrElement.includes('**')) formats.push('bold');
    if (wordOrElement.includes('*') && !wordOrElement.includes('**')) formats.push('italic');
    if (wordOrElement.includes('__')) formats.push('underline');
    if (wordOrElement.includes('~~')) formats.push('strikethrough');

    // Check for alignment
    if (wordOrElement.includes('<center>')) formats.push('align-center');
    if (wordOrElement.includes('<right>')) formats.push('align-right');
    if (wordOrElement.includes('<left>')) formats.push('align-left');

    // Check for lists
    const lineStart = text.lastIndexOf('\n', position);
    const lineEnd = text.indexOf('\n', position);
    const line = text.substring(
      lineStart === -1 ? 0 : lineStart + 1,
      lineEnd === -1 ? text.length : lineEnd
    );

    if (line.trimStart().startsWith('- ')) formats.push('list');
    if (line.trimStart().match(/^\d+\. /)) formats.push('ordered-list');

    return formats;
  };

  // Helper function to detect formatting in selected text
  const detectFormattingInText = (text: string): string[] => {
    const formats: string[] = [];
    const trimmed = text.trim();

    // Improved pattern matching for better format detection

    // Check for bold (** at beginning and end)
    if (/^\*\*([\s\S]+)\*\*$/.test(trimmed)) {
      formats.push('bold');
    }

    // Check for italic (* at beginning and end, but not **)
    if (/^\*([\s\S]+)\*$/.test(trimmed) &&
        !trimmed.startsWith('**') &&
        !trimmed.endsWith('**')) {
      formats.push('italic');
    }

    // Check for underline (__ at beginning and end)
    if (/^__([\s\S]+)__$/.test(trimmed)) {
      formats.push('underline');
    }

    // Check for strikethrough (~~ at beginning and end)
    if (/^~~([\s\S]+)~~$/.test(trimmed)) {
      formats.push('strikethrough');
    }

    // Check for alignment tags
    if (/^<center>([\s\S]+)<\/center>$/.test(trimmed)) {
      formats.push('align-center');
    }
    if (/^<right>([\s\S]+)<\/right>$/.test(trimmed)) {
      formats.push('align-right');
    }
    if (/^<left>([\s\S]+)<\/left>$/.test(trimmed)) {
      formats.push('align-left');
    }

    return formats;
  };

  // Navigate back to documents list
  const handleBack = () => {
    router.push('/dashboard/docs')
  }

  // Add a state to track if sidebar is collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Add useMediaQuery hook to detect mobile screen
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isMobileView, setIsMobileView] = useState(isMobile);

  // Effect to handle resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarCollapsed]);

  // Add this state to manage the mobile menu visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add accessibility improvements for focus management
  useEffect(() => {
    // Ensure the editor gets focused when in edit mode, especially after a mobile touch interaction
    if (activeTab === 'edit' && editorRef.current && !isMobileView) {
      editorRef.current.focus();
    }

    // Close mobile menu when switching tabs
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [activeTab, mobileMenuOpen, isMobileView]);

  // Add an effect to handle the virtual keyboard on mobile
  useEffect(() => {
    if (!isMobileView) return;

    const handleVisibilityChange = () => {
      // When the keyboard appears, scroll to ensure the cursor is visible
      if (editorRef.current && document.activeElement === editorRef.current) {
        setTimeout(() => {
          if (!editorRef.current) return;

          const cursorPosition = editorRef.current.selectionStart;
          // Get approximate position of cursor
          const textBeforeCursor = editorRef.current.value.substring(0, cursorPosition);
          const lineCount = (textBeforeCursor.match(/\n/g) || []).length;

          // Scroll the textarea to make sure cursor is visible
          editorRef.current.scrollTop = lineCount * 20; // Approximate line height
        }, 300);
      }
    };

    window.addEventListener('resize', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobileView]);

  // Add mobile header that appears when scrolling down
  const [showMobileHeader, setShowMobileHeader] = useState(false);

  // Add effect to handle scroll behavior on mobile
  useEffect(() => {
    if (!isMobileView) return;

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowMobileHeader(true);
      } else {
        setShowMobileHeader(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileView]);

  // Add state for share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState<Array<{id: string; name: string; email: string; access: string}>>([
    { id: 'user2', name: 'Bob Johnson', email: 'bob@example.com', access: 'Editor' },
    { id: 'user3', name: 'Carol Williams', email: 'carol@example.com', access: 'Viewer' }
  ]);

  // Add state for share permission
  const [sharePermission, setSharePermission] = useState<'Editor' | 'Viewer'>('Editor');
  const [emailError, setEmailError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

  // Add email validation function
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    sendTextUpdate(newContent);

    // Save content to localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedDocs = JSON.parse(localStorage.getItem('userDocuments') || '[]')
        const existingDocIndex = storedDocs.findIndex((doc: any) => doc.id === documentId)

        if (existingDocIndex !== -1) {
          // Update existing document
          storedDocs[existingDocIndex] = {
            ...storedDocs[existingDocIndex],
            content: newContent,
            updatedAt: new Date().toISOString()
          }
        } else {
          // Add as new document if not found
          storedDocs.push({
            id: documentId,
            title: documentName,
            content: newContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collaborators: [{ id: currentUser.id, name: currentUser.name, color: currentUser.color }]
          })
        }

        localStorage.setItem('userDocuments', JSON.stringify(storedDocs))
      } catch (e) {
        console.error('Error saving document content to localStorage', e)
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Mobile floating header - appears when scrolling */}
      {isMobileView && showMobileHeader && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b shadow-sm flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-medium text-sm truncate max-w-[180px]">{documentName}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setActiveTab(activeTab === 'edit' ? 'view' : 'edit')}
            >
              {activeTab === 'edit' ? <Eye className="h-5 w-5" /> : <PencilLine className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Document header */}
      <div className="border-b p-4 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-1"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <FileText className="h-5 w-5 text-blue-500" />
          {isRenaming ? (
            <Input
              className="h-7 py-1 px-2 w-full max-w-[200px] sm:max-w-[300px]"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onBlur={() => {
                setIsRenaming(false);
                handleNameChange(documentName);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsRenaming(false);
                  handleNameChange(documentName);
                }
                if (e.key === "Escape") setIsRenaming(false);
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-lg sm:text-xl font-semibold cursor-pointer hover:underline truncate max-w-[150px] sm:max-w-full"
              onClick={() => setIsRenaming(true)}
            >
              {documentName}
            </h1>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
            <Star className="h-4 w-4" />
          </Button>
        </div>

        {/* Collaborators */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center border rounded-md px-2 py-1 bg-background">
            {Object.entries(users).slice(0, isMobileView ? 2 : 3).map(([id, user], i) => (
              <TooltipProvider key={id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar
                      className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-background"
                      style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                    >
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {user.name} {id === currentUser.id ? "(You)" : ""}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 ml-1"
              onClick={() => setShareDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main document area */}
        <div className="flex-1 flex flex-col">
          {/* Document toolbar */}
          <div className="border-b p-1 sm:p-2 flex items-center justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
              }}
              className="w-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <TabsList className="grid w-full sm:w-48 grid-cols-2 p-1">
                    <TabsTrigger
                      value="edit"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("edit");
                      }}
                      className="flex items-center justify-center py-2 px-3 h-10 sm:h-auto"
                    >
                      <div className="flex items-center justify-center">
                        <PencilLine className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger
                      value="view"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("view");
                      }}
                      className="flex items-center justify-center py-2 px-3 h-10 sm:h-auto"
                    >
                      <div className="flex items-center justify-center">
                        <Eye className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-2 hidden sm:flex">
                        Options <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <a
                          href="https://docs.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Open Google Docs
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Export Document
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Print Document
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center w-full sm:w-auto justify-between">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <div className="flex items-center border-r pr-1 mr-1">
                      <Button
                        variant={activeFormats.includes('bold') ? "default" : "ghost"}
                        size="icon"
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${activeFormats.includes('bold') ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => applyFormatting('bold')}
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={activeFormats.includes('italic') ? "default" : "ghost"}
                        size="icon"
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${activeFormats.includes('italic') ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => applyFormatting('italic')}
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={activeFormats.includes('underline') ? "default" : "ghost"}
                        size="icon"
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${activeFormats.includes('underline') ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => applyFormatting('underline')}
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant={activeFormats.includes('align-left') ? "default" : "ghost"}
                        size="icon"
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${activeFormats.includes('align-left') ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => applyFormatting('align-left')}
                        title="Align Left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={activeFormats.includes('align-center') ? "default" : "ghost"}
                        size="icon"
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${activeFormats.includes('align-center') ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => applyFormatting('align-center')}
                        title="Align Center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={activeFormats.includes('align-right') ? "default" : "ghost"}
                        size="icon"
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${activeFormats.includes('align-right') ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => applyFormatting('align-right')}
                        title="Align Right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground hidden sm:flex items-center ml-2">
                    <span className="flex items-center">
                      {connected ? (
                        <>
                          <Clock className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-500 mr-1">●</span>
                          All changes saved
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-1" />
                          Connecting...
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document content */}
              <TabsContent value="edit" className="flex-1 p-0 m-0 data-[state=active]:block">
                <ScrollArea
                  className="h-full"
                  scrollHideDelay={0}
                  data-mobile-view={isMobileView ? "true" : "false"}
                >
                  <div
                    className="max-w-4xl mx-auto p-2 sm:p-8 relative"
                    style={{
                      paddingBottom: isMobileView ? '120px' : undefined, // Add extra padding for mobile bottom controls
                      overscrollBehavior: 'contain' // Prevent pull-to-refresh on mobile
                    }}
                  >
                    <textarea
                      ref={editorRef}
                      className="min-h-[calc(100vh-16rem)] outline-none p-2 sm:p-4 font-sans w-full resize-none border rounded-md text-sm sm:text-base"
                      value={content}
                      onChange={handleContentChange}
                      onFocus={() => {
                        if (editorRef.current) {
                          const start = editorRef.current.selectionStart;
                          const end = editorRef.current.selectionEnd;
                          setSelection({ start, end });
                          sendCursorUpdate(end);
                        }
                      }}
                      onSelect={() => {
                        if (editorRef.current) {
                          const start = editorRef.current.selectionStart;
                          const end = editorRef.current.selectionEnd;
                          setSelection({ start, end });
                          sendCursorUpdate(end);
                        }
                      }}
                      onTouchEnd={() => {
                        if (editorRef.current) {
                          // Add a small delay to ensure the selection is updated
                          setTimeout(() => {
                            const start = editorRef.current?.selectionStart || 0;
                            const end = editorRef.current?.selectionEnd || 0;
                            setSelection({ start, end });
                            sendCursorUpdate(end);

                            // On mobile, show the formatting menu when text is selected
                            if (isMobileView && start !== end && !mobileMenuOpen) {
                              setMobileMenuOpen(true);
                            }
                          }, 50);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Improved keyboard shortcut handling
                        const hasSelection = editorRef.current?.selectionStart !== editorRef.current?.selectionEnd;

                        // Bold: Ctrl+B or Cmd+B (Mac)
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                          e.preventDefault();
                          applyFormatting('bold');
                          return;
                        }

                        // Italic: Ctrl+I or Cmd+I (Mac)
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                          e.preventDefault();
                          applyFormatting('italic');
                          return;
                        }

                        // Underline: Ctrl+U or Cmd+U (Mac)
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                          e.preventDefault();
                          applyFormatting('underline');
                          return;
                        }

                        // Toggle sidebar: Ctrl+\ or Cmd+\ (Mac)
                        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
                          e.preventDefault();
                          setSidebarCollapsed(!sidebarCollapsed);
                          return;
                        }
                      }}
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontSize: isMobileView ? '16px' : undefined, // Prevent zoom on iOS when focusing
                        lineHeight: isMobileView ? '1.6' : undefined,  // Improve line spacing on mobile
                        WebkitOverflowScrolling: 'touch', // Improve scrolling performance on iOS
                      }}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="view" className="flex-1 p-0 m-0 data-[state=active]:block">
                <ScrollArea
                  className="h-full"
                  scrollHideDelay={0}
                  data-mobile-view={isMobileView ? "true" : "false"}
                >
                  <div className="max-w-4xl mx-auto p-2 sm:p-8">
                    <div className="prose prose-sm sm:prose lg:prose-lg mx-auto">
                      {formatContent(content)}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Floating collaborator avatars for quick access */}
        <div className={`fixed bottom-4 sm:bottom-8 right-4 sm:right-8 flex flex-col gap-2 ${isMobileView ? 'z-30' : 'z-10'}`}>
          {Object.entries(users).slice(0, isMobileView ? 3 : 5).map(([id, user]) => (
            <TooltipProvider key={id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar
                    className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background shadow-md cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <AvatarFallback style={{ backgroundColor: user.color }}>
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side={isMobileView ? "top" : "left"}>
                  {user.name} {id === currentUser.id ? "(You)" : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {Object.entries(users).length > (isMobileView ? 3 : 5) && (
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground border-2 border-background shadow-md text-xs sm:text-sm font-medium cursor-pointer"
              onClick={() => setShareDialogOpen(true)}
            >
              +{Object.entries(users).length - (isMobileView ? 3 : 5)}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        {isMobileView && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-16 right-4 z-20 rounded-full h-12 w-12 shadow-lg border-2 bg-background"
            style={{
              bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
              right: 'max(16px, env(safe-area-inset-right, 16px))'
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Mobile formatting menu */}
        {isMobileView && mobileMenuOpen && (
          <div className="fixed bottom-32 right-4 z-20 bg-background border rounded-lg shadow-lg p-2 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={activeFormats.includes('bold') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  applyFormatting('bold');
                  // Refocus the editor after applying formatting
                  setTimeout(() => editorRef.current?.focus(), 50);
                }}
                title="Bold"
                className="h-10 w-10 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={activeFormats.includes('italic') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  applyFormatting('italic');
                  setTimeout(() => editorRef.current?.focus(), 50);
                }}
                title="Italic"
                className="h-10 w-10 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={activeFormats.includes('underline') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  applyFormatting('underline');
                  setTimeout(() => editorRef.current?.focus(), 50);
                }}
                title="Underline"
                className="h-10 w-10 p-0"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={activeFormats.includes('align-left') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  applyFormatting('align-left');
                  setTimeout(() => editorRef.current?.focus(), 50);
                }}
                title="Align Left"
                className="h-10 w-10 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={activeFormats.includes('align-center') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  applyFormatting('align-center');
                  setTimeout(() => editorRef.current?.focus(), 50);
                }}
                title="Align Center"
                className="h-10 w-10 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={activeFormats.includes('align-right') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  applyFormatting('align-right');
                  setTimeout(() => editorRef.current?.focus(), 50);
                }}
                title="Align Right"
                className="h-10 w-10 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="border-t mt-1 pt-1 space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setShareDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share document
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share document</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-2">
            <div className="grid flex-1 gap-2">
              <div className="relative">
                <Input
                  id="email"
                  placeholder="Add people by email"
                  value={shareEmail}
                  onChange={(e) => {
                    setShareEmail(e.target.value);
                    // Clear error when typing
                    if (emailError) setEmailError('');
                  }}
                  type="email"
                  className={emailError ? "border-destructive pr-10" : ""}
                />
                {emailError && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-destructive">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
              {emailError && (
                <p className="text-destructive text-xs">
                  {emailError}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="shrink-0">
                  <span className="sr-only">Change permissions</span>
                  <span>Can {sharePermission.toLowerCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSharePermission('Editor')}>Can edit</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSharePermission('Viewer')}>Can view</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Show current shares */}
          {sharedUsers.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Currently shared with:</h4>
              <div className="space-y-2 max-h-[150px] overflow-auto">
                {sharedUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between text-sm ${
                      index === sharedUsers.length - 1 && shareSuccess ? "animate-pulse bg-primary/10 rounded-md p-1" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback style={{ backgroundColor: `hsl(${parseInt(user.id.slice(-2), 36) * 10}, 70%, 50%)` }}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name} ({user.email})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.access === 'Editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.access}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSharedUsers(sharedUsers.filter(u => u.id !== user.id));
                            setShareSuccess(`Removed ${user.name} from shared users`);
                          }}>
                            Remove access
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const newAccess = user.access === 'Editor' ? 'Viewer' : 'Editor';
                            const updatedUsers = sharedUsers.map(u =>
                              u.id === user.id ? {...u, access: newAccess} : u
                            );
                            setSharedUsers(updatedUsers);
                            setShareSuccess(`Changed ${user.name} to ${newAccess}`);
                          }}>
                            Change to {user.access === 'Editor' ? 'Viewer' : 'Editor'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shareSuccess && (
            <div className="bg-green-50 border-green-200 border rounded-md p-2 mt-2 text-green-700 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {shareSuccess}
            </div>
          )}

          <DialogFooter className="sm:justify-between mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShareDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={!shareEmail}
              onClick={() => {
                setEmailError('');
                setShareSuccess('');

                if (!shareEmail) return;

                if (!validateEmail(shareEmail)) {
                  setEmailError('Please enter a valid email address');
                  return;
                }

                // Check if email already exists
                const emailExists = sharedUsers.some(user => user.email === shareEmail);
                if (emailExists) {
                  setEmailError('This email has already been invited');
                  return;
                }

                const newUser = {
                  id: `user${Math.floor(Math.random() * 10000)}`,
                  name: shareEmail.split('@')[0],
                  email: shareEmail,
                  access: sharePermission
                };

                setSharedUsers([...sharedUsers, newUser]);
                setShareEmail('');
                setShareSuccess(`${shareEmail} added successfully as ${sharePermission}`);
              }}
            >
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add CSS to hide scrollbar on mobile if needed */}
      <style jsx global>{`
        [data-mobile-view="true"] [data-radix-scroll-area-scrollbar] {
          display: none;
        }
      `}</style>
    </div>
  )
}
