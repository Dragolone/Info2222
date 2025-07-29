"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  BarChart3,
  FolderOpen,
  ChevronDown,
  ExternalLink
} from "lucide-react"

interface SidebarLink {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string
  dropdown?: boolean
  dropdownItems?: {
    title: string
    href: string
    external?: boolean
    icon?: React.ReactNode
  }[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const mainLinks: SidebarLink[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      badge: "5",
    },
    {
      title: "Calendar",
      href: "/dashboard/calendar",
      icon: <Calendar className="h-5 w-5" />,
      badge: "New",
    },
    {
      title: "Chat",
      href: "/dashboard/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: "3",
    },
    {
      title: "Documents",
      href: "/dashboard/docs",
      icon: <FileText className="h-5 w-5" />,
      dropdown: true,
      dropdownItems: [
        {
          title: "Local Documents",
          href: "/dashboard/docs",
        },
        {
          title: "Collaborative Docs",
          href: "/dashboard/docs",
        },
        {
          title: "Google Docs",
          href: "https://docs.google.com",
          external: true,
          icon: <ExternalLink className="h-4 w-4 ml-1" />
        }
      ]
    },
    {
      title: "Files",
      href: "/dashboard/files",
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      title: "Meeting",
      href: "/dashboard/meeting",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ]

  const secondaryLinks: SidebarLink[] = [
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Help & Support",
      href: "/dashboard/help",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ]

  // Function to render a sidebar link or dropdown
  const renderSidebarLink = (link: SidebarLink) => {
    // For dropdown links
    if (link.dropdown && link.dropdownItems) {
      return (
        <DropdownMenu key={link.title}>
          <DropdownMenuTrigger asChild>
            <button className={`
              w-full flex items-center gap-3 rounded-lg px-3 py-2
              ${pathname.startsWith(link.href)
                ? "bg-muted font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
              transition-colors
            `}>
              {link.icon}
              <span>{link.title}</span>
              {link.badge && (
                <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {link.badge}
                </span>
              )}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            {link.dropdownItems.map(item => (
              <DropdownMenuItem key={item.title} asChild>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between"
                  >
                    {item.title}
                    {item.icon}
                  </a>
                ) : (
                  <Link href={item.href} className="w-full">
                    {item.title}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    // For regular links
    return (
      <Link
        key={link.title}
        href={link.href}
        className={`
          flex items-center gap-3 rounded-lg px-3 py-2
          ${
            pathname === link.href
              ? "bg-muted font-medium text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }
          transition-colors
        `}
      >
        {link.icon}
        <span>{link.title}</span>
        {link.badge && (
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {link.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="w-[280px] flex flex-col border-r bg-background h-screen">
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            T
          </div>
          TeamSync
        </Link>
      </div>

      <ScrollArea className="flex-1 pt-3">
        <div className="px-3 py-2">
          <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
            MAIN
          </div>
          <nav className="grid gap-1 px-2">
            {mainLinks.map(renderSidebarLink)}
          </nav>
        </div>
        <div className="px-3 py-2">
          <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
            SETTINGS
          </div>
          <nav className="grid gap-1 px-2">
            {secondaryLinks.map(renderSidebarLink)}
          </nav>
        </div>
      </ScrollArea>

      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3 py-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">John Doe</span>
            <span className="text-xs text-muted-foreground">john@example.com</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={() => {
            router.push("/auth/login")
          }}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

