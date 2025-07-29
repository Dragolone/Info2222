"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { AlertCircle, Keyboard, Eye, Sparkles, AlertTriangle } from "lucide-react"

const accessibilityFormSchema = z.object({
  screenReader: z.object({
    enabled: z.boolean(),
    verboseMode: z.boolean(),
    announceUpdates: z.boolean(),
  }),
  visual: z.object({
    highContrastMode: z.boolean(),
    reducedMotion: z.boolean(),
    largeText: z.boolean(),
    focusIndicators: z.boolean(),
  }),
})

type AccessibilityFormValues = z.infer<typeof accessibilityFormSchema>

const defaultShortcuts = [
  {
    id: "shortcut-1",
    action: "Open Search",
    keys: ["Control", "K"],
    editable: true,
  },
  {
    id: "shortcut-2",
    action: "Save Document",
    keys: ["Control", "S"],
    editable: true,
  },
  {
    id: "shortcut-3",
    action: "New Task",
    keys: ["Control", "N"],
    editable: true,
  },
  {
    id: "shortcut-4",
    action: "Toggle Sidebar",
    keys: ["Control", "B"],
    editable: true,
  },
  {
    id: "shortcut-5",
    action: "Focus Calendar",
    keys: ["Alt", "C"],
    editable: true,
  },
  {
    id: "shortcut-6",
    action: "Next Item",
    keys: ["Tab"],
    editable: false,
  },
  {
    id: "shortcut-7",
    action: "Previous Item",
    keys: ["Shift", "Tab"],
    editable: false,
  },
  {
    id: "shortcut-8",
    action: "Activate Button",
    keys: ["Space"],
    editable: false,
  },
]

export function AccessibilitySettings() {
  const [shortcuts, setShortcuts] = useState(defaultShortcuts)
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [showConflictWarning, setShowConflictWarning] = useState(false)

  const form = useForm<AccessibilityFormValues>({
    resolver: zodResolver(accessibilityFormSchema),
    defaultValues: {
      screenReader: {
        enabled: false,
        verboseMode: false,
        announceUpdates: true,
      },
      visual: {
        highContrastMode: false,
        reducedMotion: false,
        largeText: false,
        focusIndicators: true,
      },
    },
  })

  function onSubmit(data: AccessibilityFormValues) {
    toast.success("Accessibility settings saved")
    console.log(data)
  }

  function formatKeyboardShortcut(keys: string[]) {
    return keys.map(key =>
      key === "Control" ? "Ctrl" : key
    ).join(" + ")
  }

  function handleShortcutEdit(shortcutId: string) {
    setEditingShortcut(shortcutId)
  }

  function handleShortcutSave(shortcutId: string, newKeys: string) {
    const keysArray = newKeys.split("+").map(k => k.trim())

    // Check for conflicts with other shortcuts
    const hasConflict = shortcuts.some(s =>
      s.id !== shortcutId &&
      JSON.stringify(s.keys.sort()) === JSON.stringify(keysArray.sort())
    )

    if (hasConflict) {
      setShowConflictWarning(true)
      setTimeout(() => setShowConflictWarning(false), 5000)
      return
    }

    const updatedShortcuts = shortcuts.map(shortcut => {
      if (shortcut.id === shortcutId) {
        return { ...shortcut, keys: keysArray }
      }
      return shortcut
    })

    setShortcuts(updatedShortcuts)
    setEditingShortcut(null)
    toast.success("Keyboard shortcut updated")
  }

  function handleShortcutCancel() {
    setEditingShortcut(null)
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Visual</span>
          </TabsTrigger>
          <TabsTrigger value="keyboard" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span>Keyboard</span>
          </TabsTrigger>
          <TabsTrigger value="screen-reader" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Screen Reader</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Visual Accessibility</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adjust visual settings to improve readability and reduce visual strain.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="visual.highContrastMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">High Contrast Mode</FormLabel>
                          <FormDescription>
                            Increases color contrast for better visibility
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visual.reducedMotion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Reduced Motion</FormLabel>
                          <FormDescription>
                            Minimizes animations and transitions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visual.largeText"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Increase Text Size</FormLabel>
                          <FormDescription>
                            Makes all text larger across the application
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visual.focusIndicators"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enhanced Focus Indicators</FormLabel>
                          <FormDescription>
                            Makes focus outlines more visible for keyboard users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit">Save Visual Settings</Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="keyboard" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Customize keyboard shortcuts for faster navigation and interaction.
            </p>
          </div>

          {showConflictWarning && (
            <div className="flex items-center space-x-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 mb-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Shortcut conflict detected</p>
                <p className="text-sm">This keyboard shortcut is already in use. Please choose a different combination.</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Customize Shortcuts</CardTitle>
              <CardDescription>
                Click on a shortcut to edit. System shortcuts cannot be modified.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-4 border-b"
                  >
                    <div>
                      <p className="font-medium">{shortcut.action}</p>
                    </div>

                    {editingShortcut === shortcut.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          className="w-40"
                          placeholder="e.g. Control+K"
                          defaultValue={shortcut.keys.join("+")}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleShortcutSave(
                            shortcut.id,
                            document.querySelector<HTMLInputElement>(`input[class*="w-40"]`)?.value || ""
                          )}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleShortcutCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <kbd className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted border rounded-md">
                          {formatKeyboardShortcut(shortcut.keys)}
                        </kbd>
                        {shortcut.editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShortcutEdit(shortcut.id)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" className="gap-1">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77618 4 8.00003 4.22386 8.00003 4.5V7H9.50003C9.77618 7 10 7.22386 10 7.5C10 7.77614 9.77618 8 9.50003 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              Reset to Defaults
            </Button>
            <Button className="gap-1" onClick={() => toast.success("Keyboard shortcuts saved")}>
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="screen-reader" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Screen Reader Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure settings to improve compatibility with screen readers.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="screenReader.enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Optimize for Screen Readers</FormLabel>
                          <FormDescription>
                            Enhances accessibility for screen reader users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("screenReader.enabled") && (
                    <>
                      <FormField
                        control={form.control}
                        name="screenReader.verboseMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 ml-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Verbose Mode</FormLabel>
                              <FormDescription>
                                Provides more detailed descriptions for screen readers
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="screenReader.announceUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 ml-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Announce Updates</FormLabel>
                              <FormDescription>
                                Announces when content changes on the page
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="flex items-center space-x-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 mt-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">
                        Our application follows WCAG 2.1 AA standards and is regularly tested with NVDA and VoiceOver screen readers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit">Save Screen Reader Settings</Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
