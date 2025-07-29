"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Download,
  FileBox,
  FileText,
  Filter,
  LineChart,
  MessageSquare,
  MoveHorizontal,
  PieChart,
  Plus,
  Save,
  Settings,
  Share2,
  Star,
  Users,
  Video,
  CheckSquare,
} from "lucide-react"

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days")
  const [activeReportTab, setActiveReportTab] = useState("tasks")
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false)

  // Mock data for visualizations
  const mockTasksCompleted = 127
  const mockTasksInProgress = 43
  const mockMessagesExchanged = 856
  const mockDocumentsViewed = 214
  const mockMeetingsAttended = 18
  const mockMeetingMinutes = 845

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Review productivity, engagement, and performance metrics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {selectedPeriod === "7days" ? "Last 7 days" :
                    selectedPeriod === "30days" ? "Last 30 days" :
                    selectedPeriod === "3months" ? "Last 3 months" :
                    selectedPeriod === "12months" ? "Last 12 months" : "Custom Range"}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedPeriod("7days")}>
                  Last 7 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPeriod("30days")}>
                  Last 30 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPeriod("3months")}>
                  Last 3 months
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPeriod("12months")}>
                  Last 12 months
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPeriod("custom")}>
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="default" onClick={() => setIsReportBuilderOpen(!isReportBuilderOpen)}>
              <Plus className="h-4 w-4 mr-2" />
              New Custom Report
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tasks Completed</p>
                  <div className="flex items-baseline">
                    <h3 className="text-3xl font-bold mr-2">{mockTasksCompleted}</h3>
                    <span className="text-xs font-medium text-green-500 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      12%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary/10 flex items-center justify-center rounded-full">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={75} className="h-1" />
                <p className="text-xs text-muted-foreground mt-2">
                  {mockTasksInProgress} tasks in progress
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Communication</p>
                  <div className="flex items-baseline">
                    <h3 className="text-3xl font-bold mr-2">{mockMessagesExchanged}</h3>
                    <span className="text-xs font-medium text-green-500 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      8%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 flex items-center justify-center rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Channels</span>
                  <span>DMs</span>
                  <span>Threads</span>
                </div>
                <div className="w-full h-1 bg-muted mt-1 rounded-full flex">
                  <div className="h-full bg-blue-500 rounded-l-full" style={{ width: "45%" }} />
                  <div className="h-full bg-indigo-500" style={{ width: "30%" }} />
                  <div className="h-full bg-purple-500 rounded-r-full" style={{ width: "25%" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Document Activity</p>
                  <div className="flex items-baseline">
                    <h3 className="text-3xl font-bold mr-2">{mockDocumentsViewed}</h3>
                    <span className="text-xs font-medium text-red-500 flex items-center">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      3%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-500/10 flex items-center justify-center rounded-full">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Viewed</span>
                  <span className="font-medium">154</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Edited</span>
                  <span className="font-medium">43</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Shared</span>
                  <span className="font-medium">17</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Meetings</p>
                  <div className="flex items-baseline">
                    <h3 className="text-3xl font-bold mr-2">{mockMeetingsAttended}</h3>
                    <span className="text-xs font-medium text-green-500 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      5%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-amber-500/10 flex items-center justify-center rounded-full">
                  <Video className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-1 text-xs">
                  <span className="text-muted-foreground">Total time</span>
                  <span className="font-medium">{Math.floor(mockMeetingMinutes / 60)}h {mockMeetingMinutes % 60}m</span>
                </div>
                <Progress value={68} className="h-1" />
                <p className="text-xs text-muted-foreground mt-2">
                  Avg attendance: 92%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Activity Reports Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Activity Reports</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto mb-6">
            <TabsTrigger
              value="tasks"
              className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none py-3 px-4"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks & Projects
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none py-3 px-4"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Communication
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none py-3 px-4"
            >
              <FileBox className="h-4 w-4 mr-2" />
              Documents & Files
            </TabsTrigger>
            <TabsTrigger
              value="meetings"
              className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none py-3 px-4"
            >
              <Video className="h-4 w-4 mr-2" />
              Meetings & Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Task Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Bar Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Task Distribution by Status</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Pie Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Productivity Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Heatmap Visualization</div>
                      <div className="text-sm">(Heatmap would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Message Volume by Channel</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Bar Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Response Time Analysis</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <LineChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Line Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document Activity by Type</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Pie Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document Collaboration Metrics</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Bar Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Meeting Duration Analysis</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Bar Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Meeting Participation Rate</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[240px] w-full flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <LineChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <div>Line Chart Visualization</div>
                      <div className="text-sm">(Chart would render here)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Custom Report Builder */}
      {isReportBuilderOpen && (
        <section className="border rounded-lg p-6 bg-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Custom Report Builder</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsReportBuilderOpen(false)}>
                Cancel
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="font-medium text-sm">1. Select Data Sources</div>
              <div className="border rounded-md p-4 bg-muted/10">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="tasks-data" className="rounded border-gray-300" />
                    <label htmlFor="tasks-data" className="text-sm">Tasks & Projects</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="comm-data" className="rounded border-gray-300" />
                    <label htmlFor="comm-data" className="text-sm">Communication</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="docs-data" className="rounded border-gray-300" />
                    <label htmlFor="docs-data" className="text-sm">Documents & Files</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="meeting-data" className="rounded border-gray-300" />
                    <label htmlFor="meeting-data" className="text-sm">Meetings & Events</label>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <label className="text-sm mb-1 block">Add Metrics</label>
                  <div className="space-y-2">
                    <div className="flex items-center p-2 border rounded-md bg-background">
                      <div className="flex-1">Tasks Completed</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center p-2 border rounded-md bg-background">
                      <div className="flex-1">Response Time</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center p-2 border rounded-md bg-background">
                      <div className="flex-1">Meeting Duration</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-medium text-sm">2. Configure Visualization</div>
              <div className="border rounded-md p-4 min-h-[200px] bg-muted/10">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm">Chart Type</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm mt-1">
                      <option>Bar Chart</option>
                      <option>Line Chart</option>
                      <option>Pie Chart</option>
                      <option>Table</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm">Group By</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm mt-1">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>User</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="include-target" className="rounded border-gray-300" />
                    <label htmlFor="include-target" className="text-sm">Include Target Lines</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-medium text-sm">3. Preview & Settings</div>
              <div className="border rounded-md p-4 min-h-[200px] bg-muted/10">
                <div className="h-[150px] w-full flex items-center justify-center bg-muted rounded-md mb-4">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Chart Preview</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm">Report Name</label>
                    <Input className="h-8 mt-1" placeholder="My Custom Report" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="schedule" className="rounded border-gray-300" />
                    <label htmlFor="schedule" className="text-sm">Schedule this report</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="share-report" className="rounded border-gray-300" />
                    <label htmlFor="share-report" className="text-sm">Share with team</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button size="sm" className="gap-2">
              <Clock className="h-4 w-4" />
              Schedule Report
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
