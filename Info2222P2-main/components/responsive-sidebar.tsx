"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerOverlay,
  DrawerTitle,
  DrawerHeader
} from "@/components/ui/drawer"
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
  Menu,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

interface SidebarLink {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string
}

export default function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, isCollapsed, isMobile, toggleSidebar, toggleCollapse } = useSidebar()

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

  // Handle link click for mobile
  const handleLinkClick = (href: string) => {
    if (isMobile && isOpen) {
      // Navigate to the link
      router.push(href)
      // Close the drawer
      toggleSidebar()
    }
  }

  // Desktop sidebar content
  const SidebarContent = ({ closeable = false }: { closeable?: boolean }) => (
    <>
      <div className={cn(
        "h-14 flex items-center px-4 border-b",
        isCollapsed && !isMobile ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              T
            </div>
            {!isCollapsed && <span>TeamSync</span>}
          </Link>
        )}

        {closeable ? (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className={cn(!isCollapsed ? "" : "mx-auto")}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 pt-3">
        <div className="px-3 py-2">
          {!isCollapsed && (
            <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
              MAIN
            </div>
          )}
          <nav className={cn(
            "grid gap-2 px-2",
            isCollapsed && !isMobile && "gap-6 py-2"
          )}>
            {mainLinks.map((link) => (
              isMobile ? (
                <button
                  key={link.title}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left w-full",
                    pathname === link.href
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.icon}
                  <span>{link.title}</span>
                  {link.badge && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {link.badge}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    isCollapsed && !isMobile ? "justify-center h-10" : "",
                    pathname === link.href
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={isCollapsed ? link.title : undefined}
                >
                  {link.icon}
                  {(!isCollapsed || isMobile) && (
                    <>
                      <span>{link.title}</span>
                      {link.badge && (
                        <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            ))}
          </nav>
        </div>

        <div className="px-3 py-2">
          {!isCollapsed && (
            <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
              SETTINGS
            </div>
          )}
          <nav className={cn(
            "grid gap-2 px-2",
            isCollapsed && !isMobile && "gap-6 py-2"
          )}>
            {secondaryLinks.map((link) => (
              isMobile ? (
                <button
                  key={link.title}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left w-full",
                    pathname === link.href
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.icon}
                  <span>{link.title}</span>
                </button>
              ) : (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    isCollapsed && !isMobile ? "justify-center h-10" : "",
                    pathname === link.href
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={isCollapsed ? link.title : undefined}
                >
                  {link.icon}
                  {(!isCollapsed || isMobile) && <span>{link.title}</span>}
                </Link>
              )
            ))}
          </nav>
        </div>
      </ScrollArea>

      <div className={cn(
        "mt-auto p-4 border-t",
        isCollapsed && !isMobile ? "flex justify-center" : ""
      )}>
        {isCollapsed && !isMobile ? (
          <Avatar className="h-9 w-9">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex items-center gap-3 py-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">John Doe</span>
              <span className="text-xs text-muted-foreground">john@example.com</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => router.push('/auth/login')}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  )

  // Mobile toggle button (shown at bottom of screen on mobile)
  const MobileToggle = () => (
    <div className="fixed bottom-4 right-4 z-40 md:hidden">
      <DrawerTrigger asChild>
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Collapsible
          open={!isCollapsed}
          className={cn(
            "border-r bg-background h-screen sidebar-transition",
            isCollapsed ? "w-[80px]" : "w-[280px]"
          )}
        >
          <CollapsibleContent forceMount className="flex flex-col h-full">
            <SidebarContent />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer open={isOpen} onOpenChange={toggleSidebar}>
          <MobileToggle />
          <DrawerContent className={cn(
            "h-[90vh] flex flex-col",
            isOpen ? "drawer-slide-up" : "drawer-slide-down"
          )}>
            <DrawerHeader>
              <DrawerTitle className="sr-only">
                Navigation Menu
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-auto flex flex-col">
              <SidebarContent closeable />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 overflow-auto",
        !isMobile && "transition-all duration-300",
      )}>
        {isMobile && (
          <div className="h-14 flex items-center px-4 border-b justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                T
              </div>
              TeamSync
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
