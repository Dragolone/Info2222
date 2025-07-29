"use client"

import React, { useState, useRef, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isToday, isTomorrow, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, isEqual, endOfWeek, startOfDay, addMonths, subMonths, subDays, differenceInDays, parse } from "date-fns"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Clock, Users, Plus, CheckCircle2, ArrowRight, ExternalLink, Bell, CalendarDays, Clipboard, Video, ChevronLeft, ChevronRight, X, Menu, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: Date
  startTime?: string
  endTime?: string
  type: "meeting" | "deadline" | "reminder" | "task"
  priority?: "low" | "medium" | "high"
  attendees?: {
    name: string
    avatar?: string
    initials: string
  }[]
  color?: string
  location?: string
  link?: string
  isCompleted?: boolean
}

export function SharedCalendar() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [showNewEvent, setShowNewEvent] = useState<boolean>(false)
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month")
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    date: new Date(),
    type: "meeting",
    priority: "medium",
    attendees: [],
  })
  const [draggingEvent, setDraggingEvent] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const timeGridRef = useRef<HTMLDivElement>(null)
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)
  const touchStartPosition = useRef<{x: number, y: number} | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [showTaskSidebar, setShowTaskSidebar] = useState(true)

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "event-1",
      title: "Weekly Sprint Planning",
      description: "Review progress and plan tasks for the next sprint",
      date: new Date(new Date().setHours(14, 0, 0, 0)), // Today at 2pm
      startTime: "14:00",
      endTime: "15:00",
      type: "meeting",
      priority: "high",
      attendees: [
        { name: "You", initials: "YO" },
        { name: "Jane Doe", initials: "JD" },
        { name: "Mike Smith", initials: "MS" },
        { name: "Alex Lee", initials: "AL" },
      ],
      color: "#3b82f6", // blue
      location: "Virtual",
      link: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: "event-2",
      title: "Project Proposal Deadline",
      description: "Submit the final project proposal document",
      date: addDays(new Date(), 3),
      type: "deadline",
      priority: "high",
      attendees: [
        { name: "You", initials: "YO" },
        { name: "Jane Doe", initials: "JD" },
      ],
      color: "#ef4444", // red
    },
    {
      id: "event-3",
      title: "Design Review",
      description: "Review the latest UI designs with the team",
      date: addDays(new Date(), 1),
      startTime: "10:00",
      endTime: "11:30",
      type: "meeting",
      priority: "medium",
      attendees: [
        { name: "You", initials: "YO" },
        { name: "Alex Lee", initials: "AL" },
        { name: "Sarah Johnson", initials: "SJ" },
      ],
      color: "#3b82f6", // blue
      location: "Design Lab",
    },
    {
      id: "event-4",
      title: "Complete API Documentation",
      description: "Finish writing the documentation for the new API endpoints",
      date: addDays(new Date(), 2),
      type: "task",
      priority: "medium",
      attendees: [
        { name: "You", initials: "YO" },
      ],
      color: "#8b5cf6", // purple
      isCompleted: false,
    },
    {
      id: "event-5",
      title: "Reminder: Submit Progress Report",
      description: "Don't forget to submit the weekly progress report",
      date: addDays(new Date(), 2),
      startTime: "09:00",
      type: "reminder",
      priority: "low",
      attendees: [
        { name: "You", initials: "YO" },
      ],
      color: "#f59e0b", // amber
    },
  ])

  // Initialize mounted state to handle window references safely
  useEffect(() => {
    setIsMounted(true)

    // Set initial screen size
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640)
    }

    // Set initial value
    handleResize()

    // Add event listener for resize
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Format date for display
  const formatDate = (date: Date, includeYear = true) => {
    if (isToday(date)) {
      return "Today"
    } else if (isTomorrow(date)) {
      return "Tomorrow"
    } else {
      return includeYear
        ? format(date, "MMM d, yyyy")
        : format(date, "MMM d")
    }
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) =>
      isEqual(
        new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
      )
    )
  }

  // Function to get event count for a date
  const getEventCountForDate = (date: Date) => {
    return getEventsForDate(date).length;
  }

  // Add a new event
  const addEvent = () => {
    if (!newEvent.title) return

    const event: CalendarEvent = {
      id: `event-${events.length + 1}`,
      title: newEvent.title || "",
      description: newEvent.description,
      date: newEvent.date || new Date(),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      type: newEvent.type || "meeting",
      priority: newEvent.priority || "medium",
      attendees: [{ name: "You", initials: "YO" }, ...(newEvent.attendees || [])],
      color:
        newEvent.type === "meeting" ? "#3b82f6" : // blue
        newEvent.type === "deadline" ? "#ef4444" : // red
        newEvent.type === "task" ? "#8b5cf6" : // purple
        "#f59e0b", // amber (reminder)
      location: newEvent.location,
      link: newEvent.link,
      isCompleted: false,
    }

    setEvents([...events, event])
    setShowNewEvent(false)
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      type: "meeting",
      priority: "medium",
      attendees: [],
    })
  }

  // Get upcoming events
  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter((event) => event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5) // Just show the next 5 events
  }

  // Toggle task completion
  const toggleTaskCompletion = (id: string) => {
    setEvents(
      events.map((event) =>
        event.id === id ? { ...event, isCompleted: !event.isCompleted } : event
      )
    )
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="secondary">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return null
    }
  }

  // Get icon for event type
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Video className="h-4 w-4 text-blue-500" />
      case "deadline":
        return <CalendarDays className="h-4 w-4 text-red-500" />
      case "task":
        return <Clipboard className="h-4 w-4 text-purple-500" />
      case "reminder":
        return <Bell className="h-4 w-4 text-amber-500" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  // Handle drag start
  const handleDragStart = (event: React.DragEvent, eventId: string) => {
    event.dataTransfer.setData("text/plain", eventId)
    setDraggingEvent(eventId)
  }

  // Handle drag over
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  // Handle drop on time slot
  const handleDrop = (event: React.DragEvent, time: string) => {
    event.preventDefault()
    const eventId = event.dataTransfer.getData("text/plain")

    // Update the event time
    setEvents(prevEvents =>
      prevEvents.map(ev => {
        if (ev.id === eventId) {
          toast({
            title: "Event moved",
            description: `"${ev.title}" moved to ${time}`,
          })
          return { ...ev, startTime: time }
        }
        return ev
      })
    )

    setDraggingEvent(null)
  }

  // Edit event
  const editEvent = () => {
    if (!editingEvent) return

    setEvents(prevEvents =>
      prevEvents.map(ev =>
        ev.id === editingEvent.id ? editingEvent : ev
      )
    )

    setEditingEvent(null)
    toast({
      title: "Event updated",
      description: `"${editingEvent.title}" has been updated`,
    })
  }

  // Generate time slots for 24-hour day view
  const generateTimeSlots = () => {
    const slots = []
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0')
      slots.push(`${hour}:00`)
    }
    return slots
  }

  // Get events for a specific time slot
  const getEventsForTimeSlot = (time: string) => {
    return events.filter(event =>
      isEqual(
        new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
      ) && event.startTime && event.startTime.startsWith(time.slice(0, 2))
    )
  }

  // Function to get events for a specific time
  const getEventsForTime = (date: Date, time: string) => {
    return events.filter(event => {
      return isEqual(
        new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
      ) && event.startTime === time;
    });
  };

  // CSS for month view with full grid
  const MonthView = () => {
    const today = new Date();
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    return (
      <div className="flex flex-col h-full border rounded-md overflow-hidden">
        {/* Day names header */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium p-1 sm:p-2 border-r last:border-r-0">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(6,1fr)] divide-x divide-y divide-border">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === date.getMonth();
            const isCurrentDate = isEqual(
              startOfDay(day),
              startOfDay(today)
            );

            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 relative group",
                  isCurrentMonth ? "bg-background" : "bg-muted/20 text-muted-foreground",
                  isCurrentDate && "bg-accent/20",
                  "transition-colors hover:bg-accent/10"
                )}
                onClick={(e) => handleCellClick(e, day)}
                onTouchStart={(e) => handleTouchStart(e, day)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs sm:text-sm",
                      isCurrentDate && "bg-primary text-white font-medium"
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Events list */}
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
                  {dayEvents.slice(0, isSmallScreen ? 2 : 3).map((event) => (
                    <div
                      key={event.id}
                      className="calendar-event cursor-pointer rounded bg-background p-1 text-xs shadow-sm border-l-2"
                      style={{ borderLeftColor: event.color || "#3b82f6" }}
                      onClick={(e) => handleEventClick(e, event)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event.id)}
                    >
                      <div className="calendar-event-title truncate">{event.title}</div>
                      {event.startTime && !isSmallScreen && (
                        <div className="calendar-event-time">
                          {event.startTime} {event.endTime && `- ${event.endTime}`}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Show indicator for more events */}
                  {dayEvents.length > (isSmallScreen ? 2 : 3) && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      + {dayEvents.length - (isSmallScreen ? 2 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // CSS for week view - full implementation with time slots on left
  const WeekView = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(date),
      end: endOfWeek(date),
    });

    const hours = Array.from({ length: 24 }, (_, i) =>
      `${String(i).padStart(2, "0")}:00`
    );

    return (
      <div className="flex flex-col h-full overflow-hidden border rounded-md">
        {/* Day headers */}
        <div className="grid grid-cols-[40px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)] border-b">
          <div className="border-r p-1 sm:p-2 bg-muted/20"></div>
          {days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "p-1 sm:p-2 text-center border-r",
                isToday(day) && "bg-accent/30 font-medium"
              )}
            >
              <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
              <div className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 mx-auto flex items-center justify-center rounded-full text-xs sm:text-sm",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[40px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)] divide-y divide-border">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                {/* Time label column */}
                <div className="border-r p-1 sm:p-2 text-xs text-muted-foreground flex items-center justify-end pr-2 sm:pr-3">
                  {isSmallScreen
                    ? hour.substring(0, 2)
                    : hour
                  }
                </div>

                {/* Day columns */}
                {days.map((day, dayIndex) => {
                  const dayEvents = getEventsForTime(day, hour);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        "min-h-[50px] sm:min-h-[60px] border-r relative group",
                        isToday(day) && "bg-accent/10"
                      )}
                      onClick={(e) => handleCellClick(e, day)}
                      onTouchStart={(e) => handleTouchStart(e, day)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      data-time={hour}
                    >
                      {/* Events for this time slot */}
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="calendar-event absolute inset-x-1 top-1 bottom-1 cursor-pointer rounded bg-background p-1 text-xs shadow-sm border-l-2 z-10"
                          style={{ borderLeftColor: event.color || "#3b82f6" }}
                          onClick={(e) => handleEventClick(e, event)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event.id)}
                        >
                          <div className="calendar-event-title truncate">{event.title}</div>
                          {event.startTime && (
                            <div className="calendar-event-time hidden sm:block">
                              {event.startTime} - {event.endTime || hour}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // CSS for day view with proper time grid
  const DayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) =>
      `${String(i).padStart(2, "0")}:00`
    );

    return (
      <div className="flex flex-col h-full border rounded-md overflow-hidden">
        {/* Day header */}
        <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[60px_1fr] border-b">
          <div className="border-r p-1 sm:p-2 bg-muted/20"></div>
          <div className="p-2 text-center font-medium border-r">
            <div className="text-base sm:text-lg">{format(date, 'EEEE')}</div>
            <div className={cn(
              "h-5 w-5 sm:h-6 sm:w-6 mx-auto flex items-center justify-center rounded-full text-xs sm:text-sm",
              isToday(date) && "bg-primary text-primary-foreground"
            )}>
              {format(date, 'd')}
            </div>
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[60px_1fr] divide-y divide-border">
            {hours.map((hour) => {
              const hourEvents = getEventsForTime(date, hour);

              return (
                <React.Fragment key={hour}>
                  {/* Time label */}
                  <div className="border-r p-1 sm:p-2 text-xs text-muted-foreground flex items-center justify-end pr-2 sm:pr-3">
                    {isSmallScreen
                      ? hour.substring(0, 2)
                      : hour
                    }
                  </div>

                  {/* Events container */}
                  <div
                    className={cn(
                      "min-h-[60px] sm:min-h-[80px] border-r relative group p-1",
                      isToday(date) && "bg-accent/10"
                    )}
                    onClick={(e) => handleCellClick(e, date)}
                    onTouchStart={(e) => handleTouchStart(e, date)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    data-time={hour}
                  >
                    {/* Events */}
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className="calendar-event cursor-pointer rounded bg-background p-1 sm:p-2 text-xs sm:text-sm shadow-sm border-l-2 mb-1"
                        style={{ borderLeftColor: event.color || "#3b82f6" }}
                        onClick={(e) => handleEventClick(e, event)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event.id)}
                      >
                        <div className="calendar-event-title">{event.title}</div>
                        {event.startTime && (
                          <div className="calendar-event-time">
                            {event.startTime} {event.endTime && `- ${event.endTime}`}
                          </div>
                        )}
                        {event.description && !isSmallScreen && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {event.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced function to detect empty space clicks in the calendar cell
  const handleCellClick = (e: React.MouseEvent, date: Date) => {
    // Check if click was on an empty area (not on an event)
    const target = e.target as HTMLElement;
    const isEventClick = target.closest('.calendar-event') !== null;

    // Only proceed if it's a click on empty space
    if (!isEventClick) {
      // Set create mode and selected date
      setIsCreateMode(true);
      setSelectedDate(date);
      setEditingEvent(null);

      // Determine the time based on data-time attribute
      let startTime = "12:00";
      let endTime = "13:00";

      // Try to get time from data-time attribute
      const timeCell = target.closest('[data-time]');
      if (timeCell) {
        const timeValue = timeCell.getAttribute('data-time');
        if (timeValue) {
          startTime = timeValue;
          // Calculate end time (next hour)
          const hourMatch = timeValue.match(/^(\d{1,2}):00/);
          if (hourMatch && hourMatch[1]) {
            const hour = parseInt(hourMatch[1]);
            const nextHour = (hour + 1) % 24;
            endTime = `${nextHour.toString().padStart(2, '0')}:00`;
          }
        }
      }

      // Initialize a new event at the selected date with the detected time
      setNewEvent({
        title: "",
        description: "",
        date: date,
        startTime: startTime,
        endTime: endTime,
        type: "meeting",
        priority: "medium",
        attendees: [],
      });

      setShowNewEvent(true);
    }
  };

  // Handle clicks on existing events (for editing)
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation(); // Prevent the cell click handler from firing

    // Set editing mode
    setIsCreateMode(false);
    setEditingEvent(event);
    setSelectedDate(event.date);

    // Populate form with event data
    setNewEvent({
      ...event,
      date: event.date,
    });

    setShowNewEvent(true);
  };

  // Handle clicks on the add button in each cell
  const handleAddButtonClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation(); // Prevent the cell click handler from firing

    // Set create mode and selected date
    setIsCreateMode(true);
    setSelectedDate(date);
    setEditingEvent(null);

    // Determine time from parent cell with data-time attribute
    let startTime = "12:00";
    let endTime = "13:00";

    // Try to get time from parent cell data-time attribute
    const timeCell = (e.currentTarget as HTMLElement).closest('[data-time]');
    if (timeCell) {
      const timeValue = timeCell.getAttribute('data-time');
      if (timeValue) {
        startTime = timeValue;
        // Calculate end time (next hour)
        const hourMatch = timeValue.match(/^(\d{1,2}):00/);
        if (hourMatch && hourMatch[1]) {
          const hour = parseInt(hourMatch[1]);
          const nextHour = (hour + 1) % 24;
          endTime = `${nextHour.toString().padStart(2, '0')}:00`;
        }
      }
    }

    // Initialize a new event at the selected date
    setNewEvent({
      title: "",
      description: "",
      date: date,
      startTime: startTime,
      endTime: endTime,
      type: "meeting",
      priority: "medium",
      attendees: [],
    });

    setShowNewEvent(true);
  };

  // Handle touch start for mobile
  const handleTouchStart = (e: React.TouchEvent, currentDate: Date) => {
    touchStartPosition.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    // Start long press timer
    longPressTimeout.current = setTimeout(() => {
      // Show context menu for adding event on long press
      setSelectedDate(currentDate);
      setIsCreateMode(true);
    }, 800); // 800ms long press to show context menu
  };

  // Handle touch move to cancel long press if user is scrolling
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosition.current) return;

    const moveX = Math.abs(e.touches[0].clientX - touchStartPosition.current.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStartPosition.current.y);

    // If moved more than 10px, cancel long press
    if (moveX > 10 || moveY > 10) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    }
  };

  // Handle touch end to clean up
  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    touchStartPosition.current = null;
  };

  // Function to handle event form submission
  const handleEventSubmit = (eventData: Partial<CalendarEvent>) => {
    if (!eventData.title) return;

    if (isCreateMode) {
      // Add new event
      const event: CalendarEvent = {
        id: `event-${events.length + 1}`,
        title: eventData.title || "",
        description: eventData.description || "",
        date: eventData.date || new Date(),
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        type: eventData.type || "meeting",
        priority: eventData.priority || "medium",
        attendees: [{ name: "You", initials: "YO" }, ...(eventData.attendees || [])],
        color:
          eventData.type === "meeting" ? "#3b82f6" : // blue
          eventData.type === "deadline" ? "#ef4444" : // red
          eventData.type === "task" ? "#8b5cf6" : // purple
          "#f59e0b", // amber (reminder)
        location: eventData.location,
        link: eventData.link,
        isCompleted: false,
      };

      setEvents([...events, event]);
      toast({
        title: "Event created",
        description: `"${event.title}" has been created.`,
      });
    } else {
      // Update existing event
      if (!editingEvent) return;

      const updatedEvents = events.map(event =>
        event.id === editingEvent.id
          ? {
              ...event,
              title: eventData.title || event.title,
              description: eventData.description || event.description,
              date: eventData.date || event.date,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              type: eventData.type || event.type,
              priority: eventData.priority || event.priority,
              location: eventData.location,
              link: eventData.link,
              color:
                eventData.type === "meeting" ? "#3b82f6" : // blue
                eventData.type === "deadline" ? "#ef4444" : // red
                eventData.type === "task" ? "#8b5cf6" : // purple
                "#f59e0b", // amber (reminder)
            }
          : event
      );

      setEvents(updatedEvents);
      toast({
        title: "Event updated",
        description: `"${eventData.title}" has been updated.`,
      });
    }

    // Close the dialog
    setShowNewEvent(false);
    setEditingEvent(null);
  };

  // Main dialog for adding/editing events
  const EventDialog = ({ open, event, isEditMode, onClose, onSubmit }: {
    open: boolean,
    event: Partial<CalendarEvent>,
    isEditMode: boolean,
    onClose: () => void,
    onSubmit: (event: Partial<CalendarEvent>) => void
  }) => {
    const [localEvent, setLocalEvent] = useState<Partial<CalendarEvent>>(event);

    useEffect(() => {
      // Update local state when the prop changes
      setLocalEvent(event);
    }, [event]);

    // Handle the form submission
    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(localEvent);
    };

    return (
      <>
        <div className="grid gap-3 sm:gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              className="col-span-3"
              value={localEvent.title || ""}
              onChange={(e) => setLocalEvent({ ...localEvent, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              className="col-span-3 min-h-20"
              value={localEvent.description || ""}
              onChange={(e) => setLocalEvent({ ...localEvent, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={localEvent.type || "meeting"}
              onValueChange={(value) =>
                setLocalEvent({ ...localEvent, type: value as "meeting" | "deadline" | "task" | "reminder" })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="startTime" className="text-right">
              Start
            </Label>
            <div className="col-span-3 flex flex-col sm:flex-row gap-2">
              <Select
                value={localEvent.startTime || "12:00"}
                onValueChange={(value) => setLocalEvent({ ...localEvent, startTime: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {Array.from({ length: 24 }, (_, i) => {
                    // Format hours to have leading zeros (00, 01, 02, etc.)
                    const hour = String(i).padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {`${hour}:00`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="endTime" className="text-right">
              End
            </Label>
            <div className="col-span-3 flex flex-col sm:flex-row gap-2">
              <Select
                value={localEvent.endTime || "13:00"}
                onValueChange={(value) => setLocalEvent({ ...localEvent, endTime: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {Array.from({ length: 24 }, (_, i) => {
                    // Format hours to have leading zeros (00, 01, 02, etc.)
                    const hour = String(i).padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {`${hour}:00`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mt-2 sm:mt-0"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(localEvent)}
            className="mt-2 sm:mt-0"
          >
            {isEditMode ? "Save Changes" : "Add Event"}
          </Button>
        </DialogFooter>
      </>
    );
  };

  // Navigation functions
  const prevMonth = () => setDate(subMonths(date, 1));
  const nextMonth = () => setDate(addMonths(date, 1));
  const today = () => setDate(new Date());

  // Group events by date for the side panel
  const getEventsByDate = () => {
    // Get current date
    const today = new Date();

    // Create an object to hold events grouped by date
    const groupedEvents: Record<string, {
      date: Date,
      dateKey: string,
      events: CalendarEvent[]
    }> = {};

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group events by date
    sortedEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const dateKey = format(eventDate, 'yyyy-MM-dd');

      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = {
          date: eventDate,
          dateKey,
          events: []
        };
      }

      groupedEvents[dateKey].events.push(event);
    });

    // Convert to array and sort by date
    return Object.values(groupedEvents)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Format time for display
  const formatEventTime = (event: CalendarEvent) => {
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    } else if (event.startTime) {
      return event.startTime;
    } else {
      return "All day";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b p-4">
        {/* Mobile header */}
        <div className="flex flex-col space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Calendar</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTaskSidebar(true)}
                title="View Events List"
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowNewEvent(true)}
                size="sm"
                className="px-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-xs">Add</span>
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm font-medium px-2 py-1 rounded-md bg-muted/30">
              {format(date, 'MMMM yyyy')}
            </div>

            <div className="flex items-center">
              <Select value={view} onValueChange={(value) => setView(value as "month" | "week" | "day" | "agenda")}>
                <SelectTrigger className="h-8 w-[90px] text-xs">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={today}>
              <span className="text-xs font-medium">
                Today
              </span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <Tabs value={view} onValueChange={(value) => setView(value as "month" | "week" | "day" | "agenda")}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 mr-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={today}>
                <span className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                  Today
                </span>
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm font-medium px-3 py-1.5 rounded-md bg-muted/30 mr-2">
              {format(date, 'MMMM yyyy')}
            </div>

            <Button onClick={() => setShowNewEvent(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Calendar View */}
        <div className={cn(
          "flex-1 p-4 overflow-auto",
          showTaskSidebar ? "md:pr-2" : "pr-4"
        )}>
          <div ref={calendarRef} className="relative">
            {view === "month" && <MonthView />}
            {view === "week" && <WeekView />}
            {view === "day" && <DayView />}
          </div>

          {/* Floating action button for mobile */}
          <div className="fixed bottom-5 right-5 md:hidden z-20">
            <Button
              onClick={() => setShowNewEvent(true)}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Tasks Sidebar - collapsible and responsive */}
        {showTaskSidebar && (
          <div className="hidden md:block w-80 border-l bg-muted/10 overflow-hidden flex-shrink-0 relative">
            {/* Collapse sidebar button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-12 w-10 z-10 rounded-none"
              onClick={() => setShowTaskSidebar(false)}
              title="Collapse sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="p-4 border-b bg-background">
              <h2 className="font-semibold text-lg flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                Tasks & Events
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your upcoming schedule
              </p>
            </div>

            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="p-4 space-y-6">
                {getEventsByDate().map((dateGroup) => (
                  <div key={dateGroup.dateKey} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-2 w-14 h-14 shadow-sm border">
                        <span className="text-xs text-muted-foreground font-medium uppercase">
                          {format(dateGroup.date, 'MMM')}
                        </span>
                        <span className="text-xl font-bold">
                          {format(dateGroup.date, 'd')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {isToday(dateGroup.date)
                            ? "Today"
                            : isTomorrow(dateGroup.date)
                              ? "Tomorrow"
                              : format(dateGroup.date, 'EEEE')}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {dateGroup.events.length} {dateGroup.events.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 ml-1 pl-2 border-l-2 border-dashed border-muted">
                      {dateGroup.events.map((event) => (
                        <div
                          key={event.id}
                          className="pl-4 py-2 -ml-px border-l-2"
                          style={{ borderLeftColor: event.color || '#3b82f6' }}
                        >
                          <div className="flex items-start justify-between group cursor-pointer hover:bg-accent rounded-md -mx-2 p-2 transition-colors" onClick={(e) => {
                            handleEventClick(e, event);
                            setShowTaskSidebar(false);
                          }}>
                            <div>
                              <div className="flex items-center gap-2">
                                {getEventTypeIcon(event.type)}
                                <span className="font-medium">{event.title}</span>
                                {event.type === "task" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskCompletion(event.id);
                                    }}
                                  >
                                    <CheckCircle2 className={cn(
                                      "h-4 w-4",
                                      event.isCompleted ? "text-green-500 fill-green-500" : "text-muted-foreground"
                                    )} />
                                  </Button>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatEventTime(event)}
                                {event.location && (
                                  <span className="ml-2">• {event.location}</span>
                                )}
                              </div>
                            </div>
                            {event.priority && (
                              <div className="mt-1">
                                {getPriorityBadge(event.priority)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {getEventsByDate().length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex rounded-full bg-muted p-3 mb-4">
                      <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-1">No upcoming events</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an event to get started
                    </p>
                    <Button
                      onClick={() => {
                        setShowNewEvent(true);
                        setShowTaskSidebar(false);
                      }}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Event
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Show an expand button when sidebar is collapsed */}
        {!showTaskSidebar && (
          <div className="hidden md:flex border-l hover:bg-accent/10 items-center justify-center w-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-full rounded-none"
              onClick={() => setShowTaskSidebar(true)}
              title="Expand sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Event dialogs and context menus */}
      <Dialog open={showNewEvent} onOpenChange={setShowNewEvent}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? "Add Event" : "Edit Event"}</DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? "Fill in the details of your new event."
                : "Update the details of your event below."}
            </DialogDescription>
          </DialogHeader>

          <EventDialog
            open={showNewEvent}
            event={newEvent}
            isEditMode={false}
            onClose={() => setShowNewEvent(false)}
            onSubmit={handleEventSubmit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the details of your event below.
            </DialogDescription>
          </DialogHeader>

          {editingEvent && (
            <EventDialog
              open={!!editingEvent}
              event={editingEvent}
              isEditMode={true}
              onClose={() => setEditingEvent(null)}
              onSubmit={handleEventSubmit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile drawer for events list */}
      {isSmallScreen && showTaskSidebar && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
             onClick={() => setShowTaskSidebar(false)}>
          <div
            className="fixed top-0 right-0 h-full w-full max-w-[320px] bg-background border-l shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                Tasks & Events
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowTaskSidebar(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-5rem)]">
              <div className="p-4 space-y-6">
                {getEventsByDate().map((dateGroup) => (
                  <div key={dateGroup.dateKey} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-2 w-14 h-14 shadow-sm border">
                        <span className="text-xs text-muted-foreground font-medium uppercase">
                          {format(dateGroup.date, 'MMM')}
                        </span>
                        <span className="text-xl font-bold">
                          {format(dateGroup.date, 'd')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {isToday(dateGroup.date)
                            ? "Today"
                            : isTomorrow(dateGroup.date)
                              ? "Tomorrow"
                              : format(dateGroup.date, 'EEEE')}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {dateGroup.events.length} {dateGroup.events.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 ml-1 pl-2 border-l-2 border-dashed border-muted">
                      {dateGroup.events.map((event) => (
                        <div
                          key={event.id}
                          className="pl-4 py-2 -ml-px border-l-2"
                          style={{ borderLeftColor: event.color || '#3b82f6' }}
                        >
                          <div className="flex items-start justify-between group cursor-pointer hover:bg-accent rounded-md -mx-2 p-2 transition-colors" onClick={(e) => {
                            handleEventClick(e, event);
                            setShowTaskSidebar(false);
                          }}>
                            <div>
                              <div className="flex items-center gap-2">
                                {getEventTypeIcon(event.type)}
                                <span className="font-medium">{event.title}</span>
                                {event.type === "task" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskCompletion(event.id);
                                    }}
                                  >
                                    <CheckCircle2 className={cn(
                                      "h-4 w-4",
                                      event.isCompleted ? "text-green-500 fill-green-500" : "text-muted-foreground"
                                    )} />
                                  </Button>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatEventTime(event)}
                                {event.location && (
                                  <span className="ml-2">• {event.location}</span>
                                )}
                              </div>
                            </div>
                            {event.priority && (
                              <div className="mt-1">
                                {getPriorityBadge(event.priority)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {getEventsByDate().length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex rounded-full bg-muted p-3 mb-4">
                      <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-1">No upcoming events</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an event to get started
                    </p>
                    <Button
                      onClick={() => {
                        setShowNewEvent(true);
                        setShowTaskSidebar(false);
                      }}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Event
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
