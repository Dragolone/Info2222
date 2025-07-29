"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, CheckCircle2, Clock, AlertCircle, ArrowRight, Bell, BarChart3, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DashboardChart } from "@/components/dashboard-chart"
import { TaskCard } from "@/components/task-card"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [showReminderDialog, setShowReminderDialog] = useState(false)

  const velocityData = [
    { sprint: 'Sprint 1', points: 25, average: 25 },
    { sprint: 'Sprint 2', points: 28, average: 26.5 },
    { sprint: 'Sprint 3', points: 32, average: 28.3 },
    { sprint: 'Sprint 4', points: 30, average: 28.75 },
    { sprint: 'Sprint 5', points: 35, average: 30 },
    { sprint: 'Current', points: 32, average: 30.3 },
  ]

  const VelocityChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={velocityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis
            dataKey="sprint"
            tick={{ fill: "hsl(var(--foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
              color: "hsl(var(--card-foreground))",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="points"
            name="Sprint Points"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))", r: 4 }}
            activeDot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="average"
            name="Average Points"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(var(--accent))", stroke: "hsl(var(--accent))", r: 4 }}
            activeDot={{ fill: "hsl(var(--accent))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  const handleOpenFile = (path: string) => {
    router.push(`/dashboard/files?path=${encodeURIComponent(path)}`)
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, John! Here's an overview of your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button size="lg" asChild>
            <Link href="/dashboard/tasks">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tasks
            </Link>
          </Button>
        </div>
      </div>

      {showAnnouncement && (
        <Card className="bg-secondary/50 border-secondary">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Important Announcement</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAnnouncement(false)} className="h-9 w-9">
                <span className="sr-only">Dismiss</span>
                <span className="h-5 w-5">×</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-base">Project proposal deadline is approaching in 3 days. Make sure to review and submit your work on time.</p>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" size="default" asChild>
                <Link href="/dashboard/files">View Files</Link>
              </Button>
              <Button size="default" onClick={() => setShowReminderDialog(true)}>
                <Bell className="mr-2 h-4 w-4" />
                Set Reminder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Tasks Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold">24 Tasks</div>
            <div className="text-sm text-muted-foreground mt-2">8 completed this week</div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Backlog</div>
                <div>4</div>
              </div>
              <Progress value={16} className="h-2.5" />
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">To Do</div>
                <div>8</div>
              </div>
              <Progress value={33} className="h-2.5" />
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">In Progress</div>
                <div>10</div>
              </div>
              <Progress value={42} className="h-2.5" />
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Done</div>
                <div>6</div>
              </div>
              <Progress value={25} className="h-2.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-secondary text-primary rounded-full p-3 h-12 w-12 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base">Weekly Sprint Planning</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" /> Today, 2:00 PM
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/meeting">Join</Link>
                </Button>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-secondary text-primary rounded-full p-3 h-12 w-12 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base">Design Review</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" /> Tomorrow, 10:00 AM
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/meeting">Join</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-base">
                    <span className="font-medium">Jane Doe</span> commented on{" "}
                    <span className="font-medium">Project Requirements</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">10 minutes ago</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>MS</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-base">
                    <span className="font-medium">Mike Smith</span> completed{" "}
                    <span className="font-medium">API Integration</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">1 hour ago</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-base">
                    <span className="font-medium">Alex Lee</span> uploaded{" "}
                    <span className="font-medium">design-mockup.fig</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">3 hours ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="mt-8">
        <TabsList className="grid w-full grid-cols-4 md:w-auto mb-6">
          <TabsTrigger value="tasks" className="px-6 py-3">Tasks</TabsTrigger>
          <TabsTrigger value="progress" className="px-6 py-3">Progress</TabsTrigger>
          <TabsTrigger value="documents" className="px-6 py-3">Documents</TabsTrigger>
          <TabsTrigger value="team" className="px-6 py-3">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TaskCard
              id="task-1"
              title="Update user dashboard"
              description="Implement new analytics widgets and improve mobile responsiveness"
              dueDate="Mar 28, 2025"
              priority="High"
              assignee={{
                name: "Jane Doe",
                avatar: "/placeholder.svg?height=32&width=32",
                initials: "JD",
              }}
              status="in-progress"
            />
            <TaskCard
              id="task-2"
              title="API documentation"
              description="Create comprehensive documentation for the new API endpoints"
              dueDate="Mar 30, 2025"
              priority="Medium"
              assignee={{
                name: "Mike Smith",
                avatar: "/placeholder.svg?height=32&width=32",
                initials: "MS",
              }}
              status="todo"
            />
            <TaskCard
              id="task-3"
              title="Fix login issues"
              description="Address the authentication bugs reported by QA team"
              dueDate="Mar 26, 2025"
              priority="Critical"
              assignee={{
                name: "Alex Lee",
                avatar: "/placeholder.svg?height=32&width=32",
                initials: "AL",
              }}
              status="todo"
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tasks">
                View All Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Track the progress of your active projects</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <DashboardChart />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Current Sprint</span>
                    </div>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm">Overall Progress</span>
                    </div>
                    <span className="text-sm font-medium">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sprint Goals</CardTitle>
                <CardDescription>Key objectives for the current sprint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[24px]">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">User Authentication</div>
                      <div className="text-sm text-muted-foreground">Implement secure login and registration</div>
                    </div>
                    <Badge>Completed</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="min-w-[24px]">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">File Management</div>
                      <div className="text-sm text-muted-foreground">Build drag-and-drop file upload system</div>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="min-w-[24px]">
                      <Clock className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Collaborative Editing</div>
                      <div className="text-sm text-muted-foreground">Real-time document collaboration features</div>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="min-w-[24px]">
                      <Clock className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Analytics Dashboard</div>
                      <div className="text-sm text-muted-foreground">Implement data visualization components</div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Velocity</CardTitle>
                <CardDescription>Sprint performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <VelocityChart />
                <div className="space-y-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Current Sprint</div>
                      <div className="text-sm">32 points</div>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Previous Sprint</div>
                      <div className="text-sm">28 points</div>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Average Velocity</div>
                      <div className="text-sm">30 points</div>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">Projected completion: 2 sprints remaining</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
                <CardDescription>Project risk assessment and mitigation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="flex-1">
                      <div className="font-medium">Technical Debt</div>
                      <div className="text-sm text-muted-foreground">High priority - Requires immediate attention</div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <div className="flex-1">
                      <div className="font-medium">Resource Allocation</div>
                      <div className="text-sm text-muted-foreground">Medium priority - Monitor closely</div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <div className="font-medium">Timeline</div>
                      <div className="text-sm text-muted-foreground">Low priority - On track</div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Collaborative documents shared with your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-10 w-10 text-blue-500 bg-blue-50 p-2 rounded" />
                    <div>
                      <div className="font-medium">Project Requirements.docx</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>Edited 2 hours ago by You</span>
                        <Badge variant="secondary">5 collaborators</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFile('Project Requirements.docx')}
                  >
                    Open
                  </Button>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-10 w-10 text-green-500 bg-green-50 p-2 rounded" />
                    <div>
                      <div className="font-medium">Meeting Notes - March 15.docx</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>Edited yesterday by Jane Doe</span>
                        <Badge variant="secondary">3 collaborators</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFile('Meeting Notes - March 15.docx')}
                  >
                    Open
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-10 w-10 text-purple-500 bg-purple-50 p-2 rounded" />
                    <div>
                      <div className="font-medium">Project Timeline.docx</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>Edited 3 days ago by Mike Smith</span>
                        <Badge variant="secondary">4 collaborators</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFile('Project Timeline.docx')}
                  >
                    Open
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/files')}
                >
                  View All Documents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Your project team and their roles</CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link href="/dashboard/chat">
                    <Users className="mr-2 h-4 w-4" />
                    Team Chat
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">John Doe (You)</div>
                      <div className="text-sm text-muted-foreground">Project Lead</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Online</Badge>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">Jane Doe</div>
                      <div className="text-sm text-muted-foreground">UI/UX Designer</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Online</Badge>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>MS</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">Mike Smith</div>
                      <div className="text-sm text-muted-foreground">Backend Developer</div>
                    </div>
                  </div>
                  <Badge variant="outline">Away</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">Alex Lee</div>
                      <div className="text-sm text-muted-foreground">Frontend Developer</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Online</Badge>
                </div>
              </div>

              <div className="mt-6">
                <div className="font-medium mb-2">Team Evaluation</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-bold text-primary">83%</div>
                    <div className="text-sm text-muted-foreground">Team Performance</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-bold text-primary">92%</div>
                    <div className="text-sm text-muted-foreground">Task Completion</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              Create a reminder for the project proposal deadline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reminder-date" className="text-right">
                Date
              </Label>
              <Input
                id="reminder-date"
                type="date"
                defaultValue="2025-03-30"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reminder-time" className="text-right">
                Time
              </Label>
              <Input
                id="reminder-time"
                type="time"
                defaultValue="09:00"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reminder-type" className="text-right">
                Notify via
              </Label>
              <Select defaultValue="app">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select notification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">App Notification</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowReminderDialog(false)}>Save Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

