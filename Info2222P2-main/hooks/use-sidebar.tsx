"use client"

import { useState, useEffect } from "react"

type SidebarState = {
  isOpen: boolean
  isCollapsed: boolean
  isMobile: boolean
}

export function useSidebar() {
  const [state, setState] = useState<SidebarState>({
    isOpen: false,
    isCollapsed: false,
    isMobile: false
  })

  useEffect(() => {
    // Function to check if the screen is mobile size
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setState(prev => ({
        ...prev,
        isMobile: isMobileView,
        // On mobile, sidebar is closed by default
        // On desktop, sidebar is open and expanded by default
        isOpen: !isMobileView,
        isCollapsed: false
      }))
    }

    // Initial check
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Clean up event listener
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }))
  }

  const toggleCollapse = () => {
    if (!state.isMobile) {
      setState(prev => ({
        ...prev,
        isCollapsed: !prev.isCollapsed
      }))
    }
  }

  return {
    ...state,
    toggleSidebar,
    toggleCollapse
  }
}
