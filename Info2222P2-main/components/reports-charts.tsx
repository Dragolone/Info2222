"use client"

import { useMemo } from "react"
import { format, subDays } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts to prevent SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ReportsChartsProps {
  activeMetric: string
  metrics: {
    totalTasks: number
    completedTasks: number
    completionRate: number
    overdueRate: number
    averageCycleTime: number
    tasksByPriority: {
      Critical: number
      High: number
      Medium: number
      Low: number
    }
    tasksByStatus: {
      backlog: number
      todo: number
      "in-progress": number
      done: number
    }
    tasksTrend: number[]
    completionTrend: number[]
  }
  dateRange: string
}

export default function ReportsCharts({ activeMetric, metrics, dateRange }: ReportsChartsProps) {
  // Charts configuration
  const burndownConfig = useMemo(() => ({
    options: {
      chart: {
        type: "line",
        toolbar: {
          show: false
        },
        fontFamily: "inherit"
      },
      colors: ["#3b82f6", "#10b981"],
      stroke: {
        width: 3,
        curve: "smooth"
      },
      xaxis: {
        categories: Array(7).fill(0).map((_, i) => format(subDays(new Date(), 6 - i), "MMM dd"))
      },
      yaxis: {
        labels: {
          formatter: (value: number) => Math.round(value)
        }
      },
      tooltip: {
        x: {
          format: "dd MMM"
        }
      },
      legend: {
        position: "top"
      },
      grid: {
        strokeDashArray: 4
      }
    },
    series: [
      {
        name: "Tasks Added",
        data: metrics.tasksTrend
      },
      {
        name: "Tasks Completed",
        data: metrics.completionTrend
      }
    ]
  }), [metrics.tasksTrend, metrics.completionTrend])

  const velocityConfig = useMemo(() => ({
    options: {
      chart: {
        type: "bar",
        toolbar: {
          show: false
        },
        fontFamily: "inherit"
      },
      colors: ["#3b82f6"],
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: "60%"
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
        position: "bottom"
      },
      grid: {
        strokeDashArray: 4
      }
    },
    series: [
      {
        name: "Tasks Completed",
        data: [8, 12, 15, 9]
      }
    ]
  }), [])

  const distributionConfig = useMemo(() => ({
    options: {
      chart: {
        type: "pie",
        toolbar: {
          show: false
        },
        fontFamily: "inherit"
      },
      colors: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"],
      labels: ["Critical", "High", "Medium", "Low"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    },
    series: [
      metrics.tasksByPriority.Critical,
      metrics.tasksByPriority.High,
      metrics.tasksByPriority.Medium,
      metrics.tasksByPriority.Low
    ]
  }), [metrics.tasksByPriority])

  if (activeMetric === "overview") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Task completion versus new tasks over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Chart
              options={burndownConfig.options}
              series={burndownConfig.series}
              type="line"
              height="100%"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activeMetric === "velocity") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Velocity</CardTitle>
          <CardDescription>Tasks completed per week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Chart
              options={velocityConfig.options}
              series={velocityConfig.series}
              type="bar"
              height="100%"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <div>Average: 11 tasks/week</div>
          <div>Trend: Improving</div>
        </CardFooter>
      </Card>
    )
  }

  if (activeMetric === "distribution") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Chart
                options={distributionConfig.options}
                series={distributionConfig.series}
                type="pie"
                height="100%"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Current task distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span>Backlog</span>
                </div>
                <span className="font-medium">{metrics.tasksByStatus.backlog}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded"
                  style={{
                    width: `${metrics.totalTasks ? (metrics.tasksByStatus.backlog / metrics.totalTasks) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span>To Do</span>
                </div>
                <span className="font-medium">{metrics.tasksByStatus.todo}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded"
                  style={{
                    width: `${metrics.totalTasks ? (metrics.tasksByStatus.todo / metrics.totalTasks) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>In Progress</span>
                </div>
                <span className="font-medium">{metrics.tasksByStatus["in-progress"]}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{
                    width: `${metrics.totalTasks ? (metrics.tasksByStatus["in-progress"] / metrics.totalTasks) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Done</span>
                </div>
                <span className="font-medium">{metrics.tasksByStatus.done}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded"
                  style={{
                    width: `${metrics.totalTasks ? (metrics.tasksByStatus.done / metrics.totalTasks) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
