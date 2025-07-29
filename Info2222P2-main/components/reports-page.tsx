"use client"

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  ChevronDown,
  Download,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  FileBox,
  Video,
  CheckSquare,
  MessageSquare,
  Filter,
  Plus,
  Clock,
  Star,
  Settings,
  Save,
  Share2
} from 'lucide-react'

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days")
  const [selectedReportTab, setSelectedReportTab] = useState("tasks")

  return (
    <div className="flex flex-col h-screen">
      {/* Page Header */}
      <div className="border-b px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Reports</h1>
            <p className="text-muted-foreground">Analyze team performance and activity</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  {selectedPeriod === "7days" && "Last 7 days"}
                  {selectedPeriod === "30days" && "Last 30 days"}
                  {selectedPeriod === "3months" && "Last 3 months"}
                  {selectedPeriod === "12months" && "Last 12 months"}
                  {selectedPeriod === "custom" && "Custom Range"}
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
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" />
              New Custom Report
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Key Metrics Overview */}
          <section>
            <h2 className="text-lg font-medium mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tasks Completed</CardDescription>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">124</CardTitle>
                    <CheckSquare className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className="text-green-500 flex items-center">
                      +12% <ChevronDown className="h-3 w-3 rotate-180" />
                    </div>
                    <div>vs previous period</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Communication</CardDescription>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">538</CardTitle>
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className="text-red-500 flex items-center">
                      -3% <ChevronDown className="h-3 w-3" />
                    </div>
                    <div>vs previous period</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Document Activity</CardDescription>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">87</CardTitle>
                    <FileBox className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className="text-green-500 flex items-center">
                      +23% <ChevronDown className="h-3 w-3 rotate-180" />
                    </div>
                    <div>vs previous period</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Meeting Participation</CardDescription>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">45</CardTitle>
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className="text-green-500 flex items-center">
                      +5% <ChevronDown className="h-3 w-3 rotate-180" />
                    </div>
                    <div>vs previous period</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Activity Reports Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Activity Reports</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="h-3 w-3" />
                    Filter
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    All Users
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    My Activity Only
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Team Activity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Tabs
              value={selectedReportTab}
              onValueChange={setSelectedReportTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start mb-4 overflow-x-auto p-0 pb-px">
                <TabsTrigger value="tasks" className="gap-1">
                  <CheckSquare className="h-4 w-4" />
                  Tasks & Projects
                </TabsTrigger>
                <TabsTrigger value="communication" className="gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Communication
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1">
                  <FileBox className="h-4 w-4" />
                  Documents & Files
                </TabsTrigger>
                <TabsTrigger value="meetings" className="gap-1">
                  <Video className="h-4 w-4" />
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
                      <CardTitle className="text-base">Task Completion Trend</CardTitle>
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
          <section>
            <h2 className="text-lg font-medium mb-4">Custom Report Builder</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Build Your Custom Report</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Save className="h-4 w-4" />
                      Save Report
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Clock className="h-4 w-4" />
                      Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="font-medium text-sm">1. Select Metrics</div>
                    <div className="border rounded-md p-4 min-h-[200px] bg-muted/10">
                      <div className="text-sm text-muted-foreground text-center p-6">
                        Drag and drop metrics here to include in your report
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="border rounded-md p-2 bg-background flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-primary" />
                            <span className="text-sm">Task Completion Rate</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="border rounded-md p-2 bg-background flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm">Team Activity</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronDown className="h-3 w-3" />
                          </Button>
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
                    <div className="font-medium text-sm">3. Preview</div>
                    <div className="border rounded-md p-4 min-h-[200px] bg-muted/10 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <div>Report Preview</div>
                        <div className="text-sm">(Visualization will appear here)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button>
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
