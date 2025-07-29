"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Share2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Clock
} from "lucide-react"
import { format, subDays, subMonths, isAfter, isBefore, parseISO } from "date-fns"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts components to prevent SSR issues
const ReportsCharts = dynamic(
  () => import("./reports-charts"),
  { ssr: false, loading: () => <ReportsLoader /> }
)

function ReportsLoader() {
  return (
    <div className="h-[300px] flex items-center justify-center bg-card border rounded-md">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading charts...</p>
      </div>
    </div>
  )
}

interface ReportsProps {
  tasks?: any[]
}

export function Reports({ tasks = [] }: ReportsProps) {
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d")
  const [activeMetric, setActiveMetric] = useState("overview")

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter tasks by date range
  const filteredTasks = useMemo(() => {
    if (!mounted || !tasks || tasks.length === 0) return []

    const today = new Date()
    let start: Date, end: Date;

    switch (dateRange) {
      case "7d":
        start = subDays(today, 7)
        break
      case "90d":
        start = subDays(today, 90)
        break
      case "30d":
      default:
        start = subDays(today, 30)
    }
    end = today

    return tasks.filter(task => {
      // If no dueDate, include the task
      if (!task.dueDate) return true

      try {
        const taskDate = new Date(task.dueDate)
        return !isBefore(taskDate, start) && !isAfter(taskDate, end)
      } catch (error) {
        // If date parsing fails, include the task
        return true
      }
    })
  }, [tasks, dateRange, mounted])

  // Calculate metrics
  const metrics = useMemo(() => {
    // If no tasks or component not mounted, return default values
    if (!filteredTasks.length || !mounted) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        overdueRate: 0,
        averageCycleTime: 0,
        tasksByPriority: {
          Critical: 0,
          High: 0,
          Medium: 0,
          Low: 0
        },
        tasksByStatus: {
          backlog: 0,
          todo: 0,
          "in-progress": 0,
          done: 0
        },
        tasksTrend: Array(7).fill(0),
        completionTrend: Array(7).fill(0)
      }
    }

    // Calculate metrics from filtered tasks
    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter(t => t.status === "done").length
    const overdueTasks = filteredTasks.filter(t => {
      if (t.status === "done" || !t.dueDate) return false
      return isBefore(new Date(t.dueDate), new Date())
    }).length

    // Task distribution by priority
    const tasksByPriority = {
      Critical: filteredTasks.filter(t => t.priority === "Critical").length,
      High: filteredTasks.filter(t => t.priority === "High").length,
      Medium: filteredTasks.filter(t => t.priority === "Medium").length,
      Low: filteredTasks.filter(t => t.priority === "Low").length
    }

    // Task distribution by status
    const tasksByStatus = {
      backlog: filteredTasks.filter(t => t.status === "backlog").length,
      todo: filteredTasks.filter(t => t.status === "todo").length,
      "in-progress": filteredTasks.filter(t => t.status === "in-progress").length,
      done: filteredTasks.filter(t => t.status === "done").length
    }

    // Generate sample trend data (in a real app, this would use actual historical data)
    const days = 7
    const tasksTrend = Array(days).fill(0).map(() => Math.floor(Math.random() * 5) + 3)
    const completionTrend = Array(days).fill(0).map(() => Math.floor(Math.random() * 5) + 1)

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueRate: totalTasks ? Math.round((overdueTasks / totalTasks) * 100) : 0,
      averageCycleTime: 3.2, // Sample value (days) - would be calculated from actual completion data
      tasksByPriority,
      tasksByStatus,
      tasksTrend,
      completionTrend
    }
  }, [filteredTasks, mounted])

  // Overview metrics
  const summaryCards = useMemo(() => {
    if (!mounted) return []

    return [
      {
        title: "Tasks Completed",
        value: metrics.completedTasks,
        total: metrics.totalTasks,
        percentage: metrics.completionRate,
        trend: "up",
        trendValue: "+12%",
        icon: BarChartIcon
      },
      {
        title: "Average Cycle Time",
        value: metrics.averageCycleTime,
        unit: "days",
        trend: "down",
        trendValue: "-0.5",
        icon: Clock
      },
      {
        title: "Overdue Rate",
        value: `${metrics.overdueRate}%`,
        trend: metrics.overdueRate > 15 ? "up" : "down",
        trendValue: metrics.overdueRate > 15 ? "+5%" : "-2%",
        icon: Calendar
      },
      {
        title: "Task Distribution",
        value: metrics.tasksByStatus["in-progress"],
        description: "Tasks in progress",
        trend: "neutral",
        icon: Users
      }
    ]
  }, [metrics, mounted])

  // Return loading state if not mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="animate-pulse h-10 w-[180px] bg-muted rounded"></div>
          <div className="animate-pulse h-10 w-32 bg-muted rounded"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-32 bg-muted rounded mb-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] border rounded-md bg-muted/20"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeMetric} onValueChange={setActiveMetric}>
          <TabsList className="h-10 p-1 bg-background border">
            <TabsTrigger value="overview" className="px-3 py-2">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="velocity" className="px-3 py-2">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Velocity
            </TabsTrigger>
            <TabsTrigger value="distribution" className="px-3 py-2">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Distribution
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {activeMetric === "overview" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {card.value}
                  {card.unit && <span className="text-sm font-normal ml-1">{card.unit}</span>}
                </div>
                {card.total && (
                  <p className="text-xs text-muted-foreground">
                    {card.percentage}% of {card.total} tasks
                  </p>
                )}
                {card.description && (
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                )}
                {card.trend && (
                  <div className="flex items-center pt-1">
                    {card.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
                    ) : card.trend === "down" ? (
                      <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : null}
                    <span className={`text-xs ${card.trend === "up" ? "text-red-500" : card.trend === "down" ? "text-green-500" : ""}`}>
                      {card.trendValue} from previous period
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts with client-side only rendering */}
      <ReportsCharts
        activeMetric={activeMetric}
        metrics={metrics}
        dateRange={dateRange}
      />
    </div>
  )
}
// Also export a default version to support dynamic imports
export default Reports;

