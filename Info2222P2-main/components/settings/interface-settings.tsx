"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const interfaceFormSchema = z.object({
  layoutDensity: z.enum(["compact", "comfortable", "spacious"], {
    required_error: "Please select a layout density.",
  }),
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
  fontSize: z.number().min(12).max(20),
  defaultCalendarView: z.enum(["day", "week", "month"], {
    required_error: "Please select a default calendar view.",
  }),
  defaultDocumentsView: z.enum(["list", "grid"], {
    required_error: "Please select a default documents view.",
  }),
  defaultTasksView: z.enum(["list", "board"], {
    required_error: "Please select a default tasks view.",
  }),
})

type InterfaceFormValues = z.infer<typeof interfaceFormSchema>

export function InterfaceSettings() {
  const [activeTheme, setActiveTheme] = useState<string>("light")

  const form = useForm<InterfaceFormValues>({
    resolver: zodResolver(interfaceFormSchema),
    defaultValues: {
      layoutDensity: "comfortable",
      theme: "light",
      fontSize: 16,
      defaultCalendarView: "week",
      defaultDocumentsView: "grid",
      defaultTasksView: "board",
    },
  })

  function onSubmit(data: InterfaceFormValues) {
    toast.success("Interface preferences saved")
    console.log(data)
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <h3 className="text-lg font-medium">Layout Density</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how compact you want the user interface to be.
            </p>

            <FormField
              control={form.control}
              name="layoutDensity"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="compact"
                            id="layout-compact"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <label
                          htmlFor="layout-compact"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="mb-3 h-16 w-full bg-muted rounded-sm flex flex-col">
                            <div className="h-2 w-full bg-primary/20 rounded-sm"></div>
                            <div className="flex-1 p-1">
                              <div className="h-1 w-3/4 bg-primary/20 rounded-sm mb-1"></div>
                              <div className="h-1 w-full bg-primary/20 rounded-sm mb-1"></div>
                              <div className="h-1 w-2/3 bg-primary/20 rounded-sm"></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <FormLabel className="text-base">Compact</FormLabel>
                            <FormDescription>
                              Dense view with smaller spacing
                            </FormDescription>
                          </div>
                        </label>
                      </FormItem>

                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="comfortable"
                            id="layout-comfortable"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <label
                          htmlFor="layout-comfortable"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="mb-3 h-16 w-full bg-muted rounded-sm flex flex-col">
                            <div className="h-3 w-full bg-primary/20 rounded-sm"></div>
                            <div className="flex-1 p-1.5">
                              <div className="h-1.5 w-3/4 bg-primary/20 rounded-sm mb-1.5"></div>
                              <div className="h-1.5 w-full bg-primary/20 rounded-sm mb-1.5"></div>
                              <div className="h-1.5 w-2/3 bg-primary/20 rounded-sm"></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <FormLabel className="text-base">Comfortable</FormLabel>
                            <FormDescription>
                              Balanced spacing (recommended)
                            </FormDescription>
                          </div>
                        </label>
                      </FormItem>

                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="spacious"
                            id="layout-spacious"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <label
                          htmlFor="layout-spacious"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="mb-3 h-16 w-full bg-muted rounded-sm flex flex-col">
                            <div className="h-4 w-full bg-primary/20 rounded-sm"></div>
                            <div className="flex-1 p-2">
                              <div className="h-2 w-3/4 bg-primary/20 rounded-sm mb-2"></div>
                              <div className="h-2 w-full bg-primary/20 rounded-sm mb-2"></div>
                              <div className="h-2 w-2/3 bg-primary/20 rounded-sm"></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <FormLabel className="text-base">Spacious</FormLabel>
                            <FormDescription>
                              More room between elements
                            </FormDescription>
                          </div>
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Theme</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a visual theme for the application.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className={`cursor-pointer border-2 ${activeTheme === "light" ? "border-primary" : "border-muted"}`}
                onClick={() => {
                  form.setValue("theme", "light");
                  setActiveTheme("light");
                }}
              >
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="rounded-md bg-background border p-2 w-full h-24 flex flex-col mb-3">
                    <div className="h-3 w-full bg-primary/80 mb-2 rounded-sm"></div>
                    <div className="flex gap-2 flex-1">
                      <div className="w-1/4 bg-muted rounded-sm"></div>
                      <div className="flex-1 flex flex-col">
                        <div className="h-2 w-3/4 bg-foreground/70 rounded-sm mb-1.5"></div>
                        <div className="h-2 w-full bg-foreground/60 rounded-sm mb-1.5"></div>
                        <div className="h-2 w-2/3 bg-foreground/60 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-medium">Light Theme</span>
                    {activeTheme === "light" && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${activeTheme === "dark" ? "border-primary" : "border-muted"}`}
                onClick={() => {
                  form.setValue("theme", "dark");
                  setActiveTheme("dark");
                }}
              >
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="rounded-md bg-black border border-gray-700 p-2 w-full h-24 flex flex-col mb-3">
                    <div className="h-3 w-full bg-primary/80 mb-2 rounded-sm"></div>
                    <div className="flex gap-2 flex-1">
                      <div className="w-1/4 bg-gray-800 rounded-sm"></div>
                      <div className="flex-1 flex flex-col">
                        <div className="h-2 w-3/4 bg-gray-400 rounded-sm mb-1.5"></div>
                        <div className="h-2 w-full bg-gray-400 rounded-sm mb-1.5"></div>
                        <div className="h-2 w-2/3 bg-gray-400 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-medium">Dark Theme</span>
                    {activeTheme === "dark" && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${activeTheme === "system" ? "border-primary" : "border-muted"}`}
                onClick={() => {
                  form.setValue("theme", "system");
                  setActiveTheme("system");
                }}
              >
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="rounded-md border p-2 w-full h-24 flex flex-col mb-3 bg-gradient-to-r from-background to-black">
                    <div className="h-3 w-full bg-primary/80 mb-2 rounded-sm"></div>
                    <div className="flex gap-2 flex-1">
                      <div className="w-1/4 bg-gradient-to-r from-muted to-gray-800 rounded-sm"></div>
                      <div className="flex-1 flex flex-col">
                        <div className="h-2 w-3/4 bg-gradient-to-r from-foreground/70 to-gray-400 rounded-sm mb-1.5"></div>
                        <div className="h-2 w-full bg-gradient-to-r from-foreground/60 to-gray-400 rounded-sm mb-1.5"></div>
                        <div className="h-2 w-2/3 bg-gradient-to-r from-foreground/60 to-gray-400 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-medium">System</span>
                    {activeTheme === "system" && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Font Size</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adjust the base font size for the application.
            </p>

            <FormField
              control={form.control}
              name="fontSize"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-3">
                      <FormControl>
                        <Slider
                          min={12}
                          max={20}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          className="py-2"
                        />
                      </FormControl>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size: </span>
                      <span
                        className="px-2 py-1 rounded-md border bg-muted font-medium"
                        style={{ fontSize: `${field.value}px` }}
                      >
                        {field.value}px
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("fontSize", 12)}
                      className={field.value === 12 ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    >
                      Small
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("fontSize", 16)}
                      className={field.value === 16 ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    >
                      Default
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("fontSize", 20)}
                      className={field.value === 20 ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    >
                      Large
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Default View Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set the default view for each main section.
            </p>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="defaultCalendarView"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Calendar View</FormLabel>
                    <ToggleGroup
                      type="single"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="day">Day</ToggleGroupItem>
                      <ToggleGroupItem value="week">Week</ToggleGroupItem>
                      <ToggleGroupItem value="month">Month</ToggleGroupItem>
                    </ToggleGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultDocumentsView"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Documents View</FormLabel>
                    <ToggleGroup
                      type="single"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="list">List</ToggleGroupItem>
                      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
                    </ToggleGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultTasksView"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tasks View</FormLabel>
                    <ToggleGroup
                      type="single"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="list">List</ToggleGroupItem>
                      <ToggleGroupItem value="board">Board</ToggleGroupItem>
                    </ToggleGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit">Save Preferences</Button>
        </form>
      </Form>
    </div>
  )
}
