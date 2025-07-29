"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Calendar, Download, ExternalLink, FileUp, Upload, Lock, Check, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Define integration types
const calendarServices = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    icon: "/icons/google-calendar.svg",
    description: "Sync events with your Google Calendar",
    connected: true,
    lastSync: "Today at 12:34 PM",
  },
  {
    id: "ms-outlook",
    name: "Microsoft Outlook",
    icon: "/icons/outlook.svg",
    description: "Connect with your Outlook calendar",
    connected: false,
    lastSync: null,
  },
  {
    id: "apple-calendar",
    name: "Apple Calendar",
    icon: "/icons/apple-calendar.svg",
    description: "Sync with iCloud calendar",
    connected: false,
    lastSync: null,
  },
]

const thirdPartyTools = [
  {
    id: "slack",
    name: "Slack",
    icon: "/icons/slack.svg",
    description: "Receive notifications and updates in Slack",
    connected: true,
    workspace: "Acme Corp",
  },
  {
    id: "zoom",
    name: "Zoom",
    icon: "/icons/zoom.svg",
    description: "Create and join Zoom meetings",
    connected: true,
    account: "user@example.com",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "/icons/github.svg",
    description: "Integrate with GitHub issues and pull requests",
    connected: false,
    repository: null,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "/icons/dropbox.svg",
    description: "Access and share files from Dropbox",
    connected: false,
    folder: null,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    icon: "/icons/google-drive.svg",
    description: "Access and share files from Google Drive",
    connected: false,
    folder: null,
  },
]

export function IntegrationSettings() {
  const [calendarConnections, setCalendarConnections] = useState(
    calendarServices.map(service => service.connected)
  )

  const [toolConnections, setToolConnections] = useState(
    thirdPartyTools.map(tool => tool.connected)
  )

  const [exportInProgress, setExportInProgress] = useState(false)
  const [importInProgress, setImportInProgress] = useState(false)

  function toggleCalendarConnection(index: number) {
    const newConnections = [...calendarConnections]
    newConnections[index] = !newConnections[index]
    setCalendarConnections(newConnections)

    const service = calendarServices[index]
    if (newConnections[index]) {
      toast.success(`Connected to ${service.name}`)
    } else {
      toast.info(`Disconnected from ${service.name}`)
    }
  }

  function toggleToolConnection(index: number) {
    const newConnections = [...toolConnections]
    newConnections[index] = !newConnections[index]
    setToolConnections(newConnections)

    const tool = thirdPartyTools[index]
    if (newConnections[index]) {
      toast.success(`Connected to ${tool.name}`)
    } else {
      toast.info(`Disconnected from ${tool.name}`)
    }
  }

  function handleExport() {
    setExportInProgress(true)

    // Simulate export process
    setTimeout(() => {
      setExportInProgress(false)
      toast.success("Data exported successfully")
    }, 2000)
  }

  function handleImport() {
    setImportInProgress(true)

    // Simulate import process
    setTimeout(() => {
      setImportInProgress(false)
      toast.success("Data imported successfully")
    }, 2000)
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="calendars" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendars" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Calendar Services</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Third-Party Tools</span>
          </TabsTrigger>
          <TabsTrigger value="importexport" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Import/Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendars" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Calendar Services</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your calendars to sync events and meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarServices.map((service, index) => (
              <Card key={service.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{service.name}</CardTitle>
                    </div>
                    <Switch
                      checked={calendarConnections[index]}
                      onCheckedChange={() => toggleCalendarConnection(index)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground">{service.description}</p>
                  {calendarConnections[index] && service.lastSync && (
                    <p className="text-xs flex items-center gap-1 mt-2 text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500" /> Last synced: {service.lastSync}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/40 py-2 border-t text-xs flex justify-between">
                  {calendarConnections[index] ? (
                    <>
                      <span className="text-primary font-medium">Connected</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        Configure
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Not connected</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        Learn more
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Third-Party Integrations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with external tools and services to enhance your workflow.
            </p>
          </div>

          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-4">
              {thirdPartyTools.map((tool, index) => (
                <Card key={tool.id} className="border-2 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <ExternalLink className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold">{tool.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                        </div>
                      </div>

                      {toolConnections[index] && (
                        <div className="mt-4 ml-[52px]">
                          <Collapsible>
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline" className="bg-muted/80">
                                {tool.workspace || tool.account}
                              </Badge>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Settings
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`${tool.id}-settings-1`}>Notification Level</Label>
                                  <select
                                    id={`${tool.id}-settings-1`}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option>All updates</option>
                                    <option>Important only</option>
                                    <option>None</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`${tool.id}-settings-2`}>Auto-sync</Label>
                                  <select
                                    id={`${tool.id}-settings-2`}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option>Every 30 minutes</option>
                                    <option>Every hour</option>
                                    <option>Every day</option>
                                    <option>Manual only</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm">Reset</Button>
                                <Button size="sm">Save</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col justify-between border-t md:border-t-0 md:border-l p-4 bg-muted/40 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        {toolConnections[index] ? (
                          <>
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">Connected</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                            <span className="text-sm text-muted-foreground">Disconnected</span>
                          </>
                        )}
                      </div>
                      <div>
                        <Switch
                          checked={toolConnections[index]}
                          onCheckedChange={() => toggleToolConnection(index)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="importexport" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Import/Export Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Safely transfer your data in and out of the system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <CardTitle>Export Data</CardTitle>
                </div>
                <CardDescription>
                  Download your data in a portable format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select data to export</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="export-tasks" defaultChecked className="rounded" />
                      <label htmlFor="export-tasks" className="text-sm">Tasks</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="export-documents" defaultChecked className="rounded" />
                      <label htmlFor="export-documents" className="text-sm">Documents</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="export-calendar" defaultChecked className="rounded" />
                      <label htmlFor="export-calendar" className="text-sm">Calendar</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="export-settings" defaultChecked className="rounded" />
                      <label htmlFor="export-settings" className="text-sm">Settings</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Export format</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="format-json" name="format" defaultChecked className="rounded" />
                      <label htmlFor="format-json" className="text-sm">JSON</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="format-csv" name="format" className="rounded" />
                      <label htmlFor="format-csv" className="text-sm">CSV</label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Data is encrypted during transfer</span>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={exportInProgress}
                  className="flex items-center gap-1"
                >
                  {exportInProgress ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
              </CardFooter>
              {exportInProgress && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm">Preparing export...</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <CardTitle>Import Data</CardTitle>
                </div>
                <CardDescription>
                  Upload data from an external source
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    id="import-file"
                    className="hidden"
                    onChange={() => handleImport()}
                  />
                  <label
                    htmlFor="import-file"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JSON and CSV formats
                    </p>
                  </label>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-xs">
                    Importing data may overwrite existing information. We recommend creating a backup first.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  <span>Data validation applied during import</span>
                </div>
                <Button variant="outline" size="sm">
                  View Import History
                </Button>
              </CardFooter>
              {importInProgress && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm">Processing import...</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
