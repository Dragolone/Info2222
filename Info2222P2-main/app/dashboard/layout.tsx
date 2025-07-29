import type { ReactNode } from "react"
import ResponsiveSidebar from "@/components/responsive-sidebar"
import Header from "@/components/header"
import DndWrapper from "@/components/dnd-provider"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DndWrapper>
      <ResponsiveSidebar>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </ResponsiveSidebar>
    </DndWrapper>
  )
}

