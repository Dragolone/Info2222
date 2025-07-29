"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Bell,
  Moon,
  Sun,
  Search,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Clock,
  LogOut,
  Settings,
  User
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: "task" | "meeting" | "message" | "system"
}

export default function Header() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Task assigned to you",
      description: "Alex assigned you the task 'Update documentation'",
      time: "10 minutes ago",
      read: false,
      type: "task",
    },
    {
      id: "2",
      title: "Meeting reminder",
      description: "Team standup meeting in 15 minutes",
      time: "15 minutes ago",
      read: false,
      type: "meeting",
    },
    {
      id: "3",
      title: "New message from Sarah",
      description: "Hi, can you review the latest designs?",
      time: "1 hour ago",
      read: true,
      type: "message",
    },
    {
      id: "4",
      title: "Task deadline approaching",
      description: "Task 'Finalize project proposal' is due tomorrow",
      time: "3 hours ago",
      read: true,
      type: "task",
    },
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  const unreadCount = notifications.filter(notification => !notification.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case "meeting":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case "system":
        return <Clock className="h-5 w-5 text-orange-500" />
    }
  }

  const handleLogout = () => {
    // In a real app, you would clear auth tokens, etc.
    router.push('/auth/login')
  }

  return (
    <header className="h-14 border-b px-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="pl-8 w-full" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="top-4 translate-y-0 max-w-md">
            <DialogHeader>
              <DialogTitle>Search</DialogTitle>
              <DialogDescription>
                Search for tasks, files, messages, and more.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input placeholder="Type to search..." className="w-full" />
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto text-xs px-2"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer p-0"
                  onSelect={() => markAsRead(notification.id)}
                >
                  <div className={`p-3 w-full flex items-start gap-3 ${notification.read ? "" : "bg-muted/50"}`}>
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-sm font-medium line-clamp-1 ${notification.read ? "" : "font-semibold"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <div className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

